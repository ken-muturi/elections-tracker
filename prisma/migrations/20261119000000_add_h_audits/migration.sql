-- AlterTable
ALTER TABLE "public"."h_reports" ADD COLUMN     "audit_finding_id" VARCHAR(50);

-- CreateTable
CREATE TABLE "public"."h_audits" (
    "id" VARCHAR(50) NOT NULL,
    "county_code" VARCHAR(5) NOT NULL,
    "fiscal_year" VARCHAR(15) NOT NULL,
    "entity" VARCHAR(150) NOT NULL,
    "opinion" VARCHAR(30) NOT NULL,
    "total_findings" INTEGER NOT NULL,
    "source_url" VARCHAR(500) NOT NULL,
    "loaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "h_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."h_audit_findings" (
    "id" VARCHAR(50) NOT NULL,
    "audit_id" VARCHAR(50) NOT NULL,
    "number" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "amount_cited" BIGINT,
    "summary" TEXT NOT NULL,

    CONSTRAINT "h_audit_findings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "h_audits_county_code_fiscal_year_entity_key" ON "public"."h_audits"("county_code", "fiscal_year", "entity");

-- CreateIndex
CREATE UNIQUE INDEX "h_audit_findings_audit_id_number_key" ON "public"."h_audit_findings"("audit_id", "number");

-- CreateIndex
CREATE INDEX "h_reports_audit_finding_id_idx" ON "public"."h_reports"("audit_finding_id");

-- AddForeignKey
ALTER TABLE "public"."h_reports" ADD CONSTRAINT "h_reports_audit_finding_id_fkey" FOREIGN KEY ("audit_finding_id") REFERENCES "public"."h_audit_findings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."h_audit_findings" ADD CONSTRAINT "h_audit_findings_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "public"."h_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

