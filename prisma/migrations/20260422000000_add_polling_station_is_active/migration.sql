-- AddColumn: Add isActive to polling_stations
ALTER TABLE "polling_stations" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex: Add index on isActive for filtering
CREATE INDEX "polling_stations_is_active_idx" ON "polling_stations"("is_active");
