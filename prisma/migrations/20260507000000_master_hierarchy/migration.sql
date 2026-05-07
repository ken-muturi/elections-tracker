-- Migration: Convert election-scoped Ward hierarchy to permanent master records
-- Wards, PollingStations, and Streams become master geographic data.
-- A new junction table (election_polling_stations) records which stations
-- participate in each election.

BEGIN;

-- ─── Preflight: Abort if duplicate streams have result or assignment data ──
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM streams s
    INNER JOIN stream_results sr ON sr.stream_id = s.id
    WHERE (s.polling_station_id, s.code) IN (
      SELECT polling_station_id, code FROM streams
      GROUP BY polling_station_id, code HAVING COUNT(*) > 1
    )
  ) THEN
    RAISE EXCEPTION 'Duplicate streams with result data detected. Resolve duplicates before migrating.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM streams s
    INNER JOIN agent_streams asg ON asg.stream_id = s.id
    WHERE (s.polling_station_id, s.code) IN (
      SELECT polling_station_id, code FROM streams
      GROUP BY polling_station_id, code HAVING COUNT(*) > 1
    )
  ) THEN
    RAISE EXCEPTION 'Duplicate streams with agent assignments detected. Resolve duplicates before migrating.';
  END IF;
END $$;

-- ─── Step 1: Create the junction table ────────────────────────────────────
CREATE TABLE "election_polling_stations" (
  "id"                 VARCHAR(50) NOT NULL,
  "election_id"        VARCHAR(50) NOT NULL,
  "polling_station_id" VARCHAR(50) NOT NULL,
  "is_active"          BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "election_polling_stations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "election_polling_stations_election_id_fkey"
    FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "election_polling_stations_polling_station_id_fkey"
    FOREIGN KEY ("polling_station_id") REFERENCES "polling_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "election_polling_stations_election_id_polling_station_id_key"
    UNIQUE ("election_id", "polling_station_id")
);

CREATE INDEX "election_polling_stations_election_id_idx"
  ON "election_polling_stations"("election_id");

CREATE INDEX "election_polling_stations_polling_station_id_idx"
  ON "election_polling_stations"("polling_station_id");

-- ─── Step 2: Populate junction from existing election-scoped data ──────────
-- Each non-deleted polling_station inherits its election via its ward.
INSERT INTO "election_polling_stations" ("id", "election_id", "polling_station_id", "is_active")
SELECT
  gen_random_uuid()::varchar(50),
  w."election_id",
  ps."id",
  ps."is_active"
FROM "polling_stations" ps
INNER JOIN "wards" w ON w."id" = ps."ward_id"
WHERE ps."deleted_at" IS NULL
ON CONFLICT DO NOTHING;

-- ─── Step 3: Deduplicate wards (same constituency_id + code, different elections) ─
-- Keep the lexicographically-first id per (constituency_id, code) as canonical.
CREATE TEMP TABLE _ward_canonical AS
SELECT DISTINCT ON ("constituency_id", "code")
  "id"               AS canonical_id,
  "constituency_id",
  "code"
FROM "wards"
ORDER BY "constituency_id", "code", "id";

-- Remap ALL polling_stations (including soft-deleted) to canonical wards
UPDATE "polling_stations"
SET "ward_id" = wc.canonical_id
FROM "wards" w
INNER JOIN _ward_canonical wc
  ON wc."constituency_id" = w."constituency_id" AND wc."code" = w."code"
WHERE "polling_stations"."ward_id" = w."id"
  AND w."id" != wc.canonical_id;

-- Delete non-canonical wards (no more polling_stations point to them)
DELETE FROM "wards"
WHERE "id" NOT IN (SELECT canonical_id FROM _ward_canonical);

-- ─── Step 4: Deduplicate polling_stations (same ward_id + code after remap) ─
CREATE TEMP TABLE _station_canonical AS
SELECT DISTINCT ON ("ward_id", "code")
  "id"       AS canonical_id,
  "ward_id",
  "code"
FROM "polling_stations"
ORDER BY "ward_id", "code", "id";

-- Remap streams to canonical stations
UPDATE "streams"
SET "polling_station_id" = sc.canonical_id
FROM "polling_stations" ps
INNER JOIN _station_canonical sc
  ON sc."ward_id" = ps."ward_id" AND sc."code" = ps."code"
WHERE "streams"."polling_station_id" = ps."id"
  AND ps."id" != sc.canonical_id;

-- Remap election_polling_stations to canonical stations
UPDATE "election_polling_stations"
SET "polling_station_id" = sc.canonical_id
FROM "polling_stations" ps
INNER JOIN _station_canonical sc
  ON sc."ward_id" = ps."ward_id" AND sc."code" = ps."code"
WHERE "election_polling_stations"."polling_station_id" = ps."id"
  AND ps."id" != sc.canonical_id;

-- Remove duplicate junction rows created by the remap above
DELETE FROM "election_polling_stations" a
USING "election_polling_stations" b
WHERE a."election_id" = b."election_id"
  AND a."polling_station_id" = b."polling_station_id"
  AND a."id" > b."id";

-- Delete non-canonical polling_stations
DELETE FROM "polling_stations"
WHERE "id" NOT IN (SELECT canonical_id FROM _station_canonical);

-- ─── Step 5: Deduplicate streams (same polling_station_id + code after remap) ─
CREATE TEMP TABLE _stream_canonical AS
SELECT DISTINCT ON ("polling_station_id", "code")
  "id"                  AS canonical_id,
  "polling_station_id",
  "code"
FROM "streams"
ORDER BY "polling_station_id", "code", "id";

-- Remap agent_streams to canonical streams
UPDATE "agent_streams"
SET "stream_id" = sc.canonical_id
FROM "streams" s
INNER JOIN _stream_canonical sc
  ON sc."polling_station_id" = s."polling_station_id" AND sc."code" = s."code"
WHERE "agent_streams"."stream_id" = s."id"
  AND s."id" != sc.canonical_id;

-- Remap stream_results to canonical streams
UPDATE "stream_results"
SET "stream_id" = sc.canonical_id
FROM "streams" s
INNER JOIN _stream_canonical sc
  ON sc."polling_station_id" = s."polling_station_id" AND sc."code" = s."code"
WHERE "stream_results"."stream_id" = s."id"
  AND s."id" != sc.canonical_id;

-- Remove stream_result duplicates that might appear after remap
DELETE FROM "stream_results" a
USING "stream_results" b
WHERE a."stream_id" = b."stream_id"
  AND a."position_id" = b."position_id"
  AND a."id" > b."id";

-- Delete non-canonical streams
DELETE FROM "streams"
WHERE "id" NOT IN (SELECT canonical_id FROM _stream_canonical);

-- ─── Step 6: Drop election_id from wards ──────────────────────────────────
DROP INDEX IF EXISTS "wards_election_id_idx";
ALTER TABLE "wards" DROP CONSTRAINT IF EXISTS "wards_election_id_code_key";
ALTER TABLE "wards" DROP CONSTRAINT IF EXISTS "wards_election_id_fkey";
ALTER TABLE "wards" DROP COLUMN IF EXISTS "election_id";

-- ─── Step 7: Add new master-level unique constraint ─────────────────────────
-- (May already be satisfied after deduplication above)
ALTER TABLE "wards"
  ADD CONSTRAINT "wards_constituency_id_code_key" UNIQUE ("constituency_id", "code");

COMMIT;
