-- AlterEnum: add POLLING_STATION to AggregationLevel
ALTER TYPE "AggregationLevel" ADD VALUE 'POLLING_STATION';

-- CreateTable
CREATE TABLE "result_form_images" (
    "id" VARCHAR(50) NOT NULL,
    "position_id" VARCHAR(50) NOT NULL,
    "level" "AggregationLevel" NOT NULL,
    "entity_id" VARCHAR(50) NOT NULL,
    "form_type" VARCHAR(20) NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "uploaded_by" VARCHAR(50) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "result_form_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "result_form_images_position_id_level_entity_id_idx" ON "result_form_images"("position_id", "level", "entity_id");

-- AddForeignKey
ALTER TABLE "result_form_images" ADD CONSTRAINT "result_form_images_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "election_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_form_images" ADD CONSTRAINT "result_form_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
