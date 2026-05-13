-- Add missing index on polling_station_id in election_polling_stations
-- (the column was added to the schema but the index was only declared in SQL,
--  not in schema.prisma — this migration is idempotent via IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "election_polling_stations_polling_station_id_idx"
    ON "election_polling_stations"("polling_station_id");
