/*
  Warnings:

  - You are about to drop the column `data_entry_number` on the `answers` table. All the data in the column will be lost.
  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `registrations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `submission_id` to the `answers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "public"."events" DROP CONSTRAINT "events_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."events" DROP CONSTRAINT "events_deleted_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."events" DROP CONSTRAINT "events_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."registrations" DROP CONSTRAINT "registrations_eventId_fkey";

-- AlterTable
ALTER TABLE "public"."answers" DROP COLUMN "data_entry_number",
ADD COLUMN     "submission_id" VARCHAR(50) NOT NULL,
ALTER COLUMN "answer" SET DATA TYPE VARCHAR(500);

-- DropTable
DROP TABLE "public"."events";

-- DropTable
DROP TABLE "public"."registrations";

-- DropEnum
DROP TYPE "public"."RegistrationStatus";

-- CreateTable
CREATE TABLE "public"."polling_stations" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "county" VARCHAR(100) NOT NULL,
    "constituency" VARCHAR(100) NOT NULL,
    "ward" VARCHAR(100) NOT NULL,
    "registered_voters" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL,
    "updated_at" TIMESTAMP(3),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(50),

    CONSTRAINT "polling_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."submissions" (
    "id" VARCHAR(50) NOT NULL,
    "questionnaire_id" VARCHAR(50) NOT NULL,
    "polling_station_id" VARCHAR(50),
    "data_entry_number" VARCHAR(50) NOT NULL,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" VARCHAR(50) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "polling_stations_code_key" ON "public"."polling_stations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_data_entry_number_key" ON "public"."submissions"("data_entry_number");

-- AddForeignKey
ALTER TABLE "public"."polling_stations" ADD CONSTRAINT "polling_stations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."polling_stations" ADD CONSTRAINT "polling_stations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."polling_stations" ADD CONSTRAINT "polling_stations_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_polling_station_id_fkey" FOREIGN KEY ("polling_station_id") REFERENCES "public"."polling_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."submissions" ADD CONSTRAINT "submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
