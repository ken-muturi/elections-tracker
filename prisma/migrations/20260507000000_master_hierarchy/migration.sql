-- Migration: Convert election-scoped Ward hierarchy to permanent master records
-- Wards, PollingStations, and Streams become master geographic data.
-- A new junction table (election_polling_stations) records which stations
-- participate in each election.
--
-- NOTE: Prisma wraps each migration in a transaction automatically.

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
INSERT INTO "election_polling_stations" ("id", "election_id", "polling_station_id", "is_active")
SELECT
  gen_random_uuid()::varchar(50),
  w."election_id",
  ps."id",
  ps."is_active"
FROM "polling_stations" ps
INNER JOIN "wards" w ON w."id" = ps."ward_id"
WHERE ps."deleted_at" IS NULL
  AND w."election_id" IS NOT NULL
ON CONFLICT DO NOTHING;

-- ─── Step 3: Deduplicate wards ─────────────────────────────────────────────
CREATE TEMP TABLE _ward_canonical AS
SELECT DISTINCT ON ("constituency_id", "code")
  "id"               AS canonical_id,
  "constituency_id",
  "code"
FROM "wards"
ORDER BY "constituency_id", "code", "id";

-- ─── Step 3a: Pre-merge conflicting stations + their streams ───────────────
-- For each non-canonical ward, find its stations that conflict with stations
-- already under the canonical ward. For each conflicting station pair, first
-- merge their streams (handling stream conflicts too), then merge the stations.
DO $$
DECLARE
  ps_r RECORD;
  s_r  RECORD;
BEGIN
  FOR ps_r IN
    SELECT
      ps_dup.id    AS dup_id,
      ps_canon.id  AS canon_id
    FROM _ward_canonical wc
    JOIN wards w_dup
      ON w_dup.constituency_id = wc.constituency_id
     AND w_dup.code            = wc.code
     AND w_dup.id             != wc.canonical_id
    JOIN polling_stations ps_dup   ON ps_dup.ward_id   = w_dup.id
    JOIN polling_stations ps_canon ON ps_canon.ward_id  = wc.canonical_id
                                  AND ps_canon.code     = ps_dup.code
  LOOP
    -- 3a-i: For each stream in dup_station that conflicts with a stream in
    --       canon_station (same code), merge it into the canonical stream.
    FOR s_r IN
      SELECT
        s_dup.id   AS dup_stream_id,
        s_canon.id AS canon_stream_id
      FROM streams s_dup
      JOIN streams s_canon ON s_canon.polling_station_id = ps_r.canon_id
                          AND s_canon.code               = s_dup.code
      WHERE s_dup.polling_station_id = ps_r.dup_id
    LOOP
      UPDATE agent_streams  SET stream_id = s_r.canon_stream_id WHERE stream_id = s_r.dup_stream_id;
      UPDATE stream_results SET stream_id = s_r.canon_stream_id WHERE stream_id = s_r.dup_stream_id;
      DELETE FROM streams WHERE id = s_r.dup_stream_id;
    END LOOP;

    -- 3a-ii: Remap remaining (non-conflicting) streams to the canonical station
    UPDATE streams
      SET polling_station_id = ps_r.canon_id
      WHERE polling_station_id = ps_r.dup_id;

    -- 3a-iii: Merge election activation junction rows
    INSERT INTO election_polling_stations (id, election_id, polling_station_id, is_active)
      SELECT gen_random_uuid()::varchar(50), election_id, ps_r.canon_id, is_active
      FROM election_polling_stations
      WHERE polling_station_id = ps_r.dup_id
      ON CONFLICT (election_id, polling_station_id) DO NOTHING;

    DELETE FROM election_polling_stations WHERE polling_station_id = ps_r.dup_id;

    -- 3a-iv: Delete the now-empty duplicate station
    DELETE FROM polling_stations WHERE id = ps_r.dup_id;
  END LOOP;
END $$;

-- ─── Step 3b: Remap remaining stations to canonical ward (no conflicts left) ─
UPDATE "polling_stations"
SET "ward_id" = wc.canonical_id
FROM "wards" w
INNER JOIN _ward_canonical wc
  ON wc."constituency_id" = w."constituency_id" AND wc."code" = w."code"
WHERE "polling_stations"."ward_id" = w."id"
  AND w."id" != wc.canonical_id;

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

UPDATE "streams"
SET "polling_station_id" = sc.canonical_id
FROM "polling_stations" ps
INNER JOIN _station_canonical sc
  ON sc."ward_id" = ps."ward_id" AND sc."code" = ps."code"
WHERE "streams"."polling_station_id" = ps."id"
  AND ps."id" != sc.canonical_id;

UPDATE "election_polling_stations"
SET "polling_station_id" = sc.canonical_id
FROM "polling_stations" ps
INNER JOIN _station_canonical sc
  ON sc."ward_id" = ps."ward_id" AND sc."code" = ps."code"
WHERE "election_polling_stations"."polling_station_id" = ps."id"
  AND ps."id" != sc.canonical_id;

DELETE FROM "election_polling_stations" a
USING "election_polling_stations" b
WHERE a."election_id" = b."election_id"
  AND a."polling_station_id" = b."polling_station_id"
  AND a."id" > b."id";

DELETE FROM "polling_stations"
WHERE "id" NOT IN (SELECT canonical_id FROM _station_canonical);

-- ─── Step 5: Deduplicate streams ──────────────────────────────────────────
CREATE TEMP TABLE _stream_canonical AS
SELECT DISTINCT ON ("polling_station_id", "code")
  "id"                  AS canonical_id,
  "polling_station_id",
  "code"
FROM "streams"
ORDER BY "polling_station_id", "code", "id";

UPDATE "agent_streams"
SET "stream_id" = sc.canonical_id
FROM "streams" s
INNER JOIN _stream_canonical sc
  ON sc."polling_station_id" = s."polling_station_id" AND sc."code" = s."code"
WHERE "agent_streams"."stream_id" = s."id"
  AND s."id" != sc.canonical_id;

UPDATE "stream_results"
SET "stream_id" = sc.canonical_id
FROM "streams" s
INNER JOIN _stream_canonical sc
  ON sc."polling_station_id" = s."polling_station_id" AND sc."code" = s."code"
WHERE "stream_results"."stream_id" = s."id"
  AND s."id" != sc.canonical_id;

DELETE FROM "stream_results" a
USING "stream_results" b
WHERE a."stream_id" = b."stream_id"
  AND a."position_id" = b."position_id"
  AND a."id" > b."id";

DELETE FROM "streams"
WHERE "id" NOT IN (SELECT canonical_id FROM _stream_canonical);

-- ─── Step 6: Drop election_id from wards ──────────────────────────────────
DROP INDEX IF EXISTS "wards_election_id_idx";
ALTER TABLE "wards" DROP CONSTRAINT IF EXISTS "wards_election_id_code_key";
ALTER TABLE "wards" DROP CONSTRAINT IF EXISTS "wards_election_id_fkey";
ALTER TABLE "wards" DROP COLUMN IF EXISTS "election_id";

-- ─── Step 7: Add new master-level unique constraint ─────────────────────────
ALTER TABLE "wards"
  ADD CONSTRAINT "wards_constituency_id_code_key" UNIQUE ("constituency_id", "code");
