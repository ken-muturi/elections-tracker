-- Drop legacy tables
DROP TABLE IF EXISTS "answers" CASCADE;
DROP TABLE IF EXISTS "files" CASCADE;
DROP TABLE IF EXISTS "notes" CASCADE;
DROP TABLE IF EXISTS "questionnaire_permissions" CASCADE;
DROP TABLE IF EXISTS "questionnaires" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TABLE IF EXISTS "sections" CASCADE;
DROP TABLE IF EXISTS "submissions" CASCADE;
DROP TABLE IF EXISTS "tabs" CASCADE;
DROP TABLE IF EXISTS "units" CASCADE;
DROP TABLE IF EXISTS "modules" CASCADE;
DROP TABLE IF EXISTS "permissions" CASCADE;

-- Drop legacy enums
DROP TYPE IF EXISTS "PositionType";
DROP TYPE IF EXISTS "QuestionnairePermissionStatus";
DROP TYPE IF EXISTS "SubmissionStatus";

-- Add election_id to wards
ALTER TABLE "wards" ADD COLUMN "election_id" VARCHAR(50);

-- Temporarily allow NULL for the FK while we wire it up (will enforce after data migration)
-- For a fresh-seeded dev DB this is fine as wards table is empty after reset

-- Add FK constraint for wards.election_id
ALTER TABLE "wards" ADD CONSTRAINT "wards_election_id_fkey"
  FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Make election_id NOT NULL now (table is empty after reset)
ALTER TABLE "wards" ALTER COLUMN "election_id" SET NOT NULL;

-- Drop old unique index on wards.code, add new composite
DROP INDEX IF EXISTS "wards_code_key";
CREATE UNIQUE INDEX "wards_election_id_code_key" ON "wards"("election_id", "code");

-- Change election_positions.type from enum to varchar
ALTER TABLE "election_positions" ALTER COLUMN "type" TYPE VARCHAR(100);

-- Add description and sort_order to election_positions
ALTER TABLE "election_positions" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "election_positions" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Drop old unique index on election_positions (election_id, type) if different, re-add
DROP INDEX IF EXISTS "election_positions_election_id_type_key";
CREATE UNIQUE INDEX "election_positions_election_id_type_key" ON "election_positions"("election_id", "type");

-- Make polling_stations.ward_id NOT NULL (table is empty after reset)
ALTER TABLE "polling_stations" ALTER COLUMN "ward_id" SET NOT NULL;

-- Update FK for polling_stations.ward_id to cascade from ward
ALTER TABLE "polling_stations" DROP CONSTRAINT IF EXISTS "polling_stations_ward_id_fkey";
ALTER TABLE "polling_stations" ADD CONSTRAINT "polling_stations_ward_id_fkey"
  FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old unique on polling_stations.code, add composite
DROP INDEX IF EXISTS "polling_stations_code_key";
CREATE UNIQUE INDEX "polling_stations_ward_id_code_key" ON "polling_stations"("ward_id", "code");

-- Add composite unique on streams
DROP INDEX IF EXISTS "streams_code_key";
CREATE UNIQUE INDEX "streams_polling_station_id_code_key" ON "streams"("polling_station_id", "code");
