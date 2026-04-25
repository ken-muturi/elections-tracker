-- Hesabu: Kenya County Budget Transparency & Citizen Accountability Platform
-- Creates h_counties, h_sectors, h_wards, h_reports, h_votes

CREATE TYPE "HReportStatus" AS ENUM ('UNRESOLVED', 'INVESTIGATING', 'RESOLVED');

CREATE TABLE "h_counties" (
  "id"                       VARCHAR(50)  NOT NULL,
  "name"                     VARCHAR(100) NOT NULL,
  "code"                     VARCHAR(5)   NOT NULL,
  "fiscal_year"              VARCHAR(15)  NOT NULL,
  "total_budget"             BIGINT       NOT NULL,
  "recurrent_expenditure"    BIGINT       NOT NULL,
  "development_expenditure"  BIGINT       NOT NULL,
  "equitable_share"          BIGINT       NOT NULL,
  "revenue_target"           BIGINT       NOT NULL,
  "revenue_collected"        BIGINT       NOT NULL,
  "dev_absorption_rate"      DOUBLE PRECISION,
  "is_data_available"        BOOLEAN      NOT NULL DEFAULT false,
  "data_source"              TEXT,
  "updated_at"               TIMESTAMP(3) NOT NULL,
  CONSTRAINT "h_counties_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "h_counties_code_fiscal_year_key" ON "h_counties"("code", "fiscal_year");
CREATE INDEX "h_counties_fiscal_year_idx" ON "h_counties"("fiscal_year");

CREATE TABLE "h_sectors" (
  "id"               VARCHAR(50)  NOT NULL,
  "county_id"        VARCHAR(50)  NOT NULL,
  "fiscal_year"      VARCHAR(15)  NOT NULL,
  "name"             VARCHAR(150) NOT NULL,
  "icon"             VARCHAR(10),
  "description"      TEXT,
  "allocated_amount" BIGINT       NOT NULL,
  "spent_amount"     BIGINT       NOT NULL DEFAULT 0,
  CONSTRAINT "h_sectors_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "h_sectors_county_id_idx" ON "h_sectors"("county_id");

ALTER TABLE "h_sectors"
  ADD CONSTRAINT "h_sectors_county_id_fkey"
  FOREIGN KEY ("county_id") REFERENCES "h_counties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "h_wards" (
  "id"                         VARCHAR(50)  NOT NULL,
  "county_id"                  VARCHAR(50)  NOT NULL,
  "name"                       VARCHAR(150) NOT NULL,
  "sub_county"                 VARCHAR(150) NOT NULL,
  "population"                 INTEGER      NOT NULL,
  "total_projects"             INTEGER      NOT NULL DEFAULT 0,
  "completed_projects"         INTEGER      NOT NULL DEFAULT 0,
  "pending_projects"           INTEGER      NOT NULL DEFAULT 0,
  "stalled_projects"           INTEGER      NOT NULL DEFAULT 0,
  "citizen_satisfaction_score" INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT "h_wards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "h_wards_county_id_idx" ON "h_wards"("county_id");

ALTER TABLE "h_wards"
  ADD CONSTRAINT "h_wards_county_id_fkey"
  FOREIGN KEY ("county_id") REFERENCES "h_counties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "h_reports" (
  "id"          VARCHAR(50)     NOT NULL,
  "county_id"   VARCHAR(50)     NOT NULL,
  "ward_id"     VARCHAR(50)     NOT NULL,
  "sector_id"   VARCHAR(50)     NOT NULL,
  "title"       VARCHAR(300)    NOT NULL,
  "description" TEXT,
  "status"      "HReportStatus" NOT NULL DEFAULT 'UNRESOLVED',
  "votes"       INTEGER         NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3)    NOT NULL,
  CONSTRAINT "h_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "h_reports_county_id_status_idx" ON "h_reports"("county_id", "status");
CREATE INDEX "h_reports_ward_id_idx" ON "h_reports"("ward_id");

ALTER TABLE "h_reports"
  ADD CONSTRAINT "h_reports_county_id_fkey"
  FOREIGN KEY ("county_id") REFERENCES "h_counties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "h_reports"
  ADD CONSTRAINT "h_reports_ward_id_fkey"
  FOREIGN KEY ("ward_id") REFERENCES "h_wards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "h_reports"
  ADD CONSTRAINT "h_reports_sector_id_fkey"
  FOREIGN KEY ("sector_id") REFERENCES "h_sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "h_votes" (
  "id"          VARCHAR(50)  NOT NULL,
  "report_id"   VARCHAR(50)  NOT NULL,
  "fingerprint" VARCHAR(100) NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "h_votes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "h_votes_report_id_fingerprint_key" ON "h_votes"("report_id", "fingerprint");
CREATE INDEX "h_votes_report_id_idx" ON "h_votes"("report_id");

ALTER TABLE "h_votes"
  ADD CONSTRAINT "h_votes_report_id_fkey"
  FOREIGN KEY ("report_id") REFERENCES "h_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
