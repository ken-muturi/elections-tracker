-- CreateTable
CREATE TABLE "public"."h_projects" (
    "id" VARCHAR(50) NOT NULL,
    "county_code" VARCHAR(5) NOT NULL,
    "fiscal_year" VARCHAR(15) NOT NULL,
    "card_name" VARCHAR(150),
    "location_text" VARCHAR(300),
    "matched_on" VARCHAR(150),
    "title" VARCHAR(500) NOT NULL,
    "sector" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "budget_allocated" BIGINT,
    "budget_spent" BIGINT,
    "summary" TEXT NOT NULL,
    "confidence" VARCHAR(20) NOT NULL,
    "primary_source" VARCHAR(30) NOT NULL,
    "sources" JSONB NOT NULL,
    "source_date" VARCHAR(20),
    "dedup_key" VARCHAR(64) NOT NULL,
    "scraped_at" TIMESTAMP(3) NOT NULL,
    "loaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "h_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "h_projects_county_code_fiscal_year_card_name_idx" ON "public"."h_projects"("county_code", "fiscal_year", "card_name");

-- CreateIndex
CREATE UNIQUE INDEX "h_projects_county_code_dedup_key_key" ON "public"."h_projects"("county_code", "dedup_key");

