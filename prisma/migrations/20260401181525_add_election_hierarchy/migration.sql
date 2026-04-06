-- CreateEnum
CREATE TYPE "public"."PositionType" AS ENUM ('MCA', 'MP', 'WOMEN_REP', 'SENATOR', 'GOVERNOR', 'PRESIDENT');

-- CreateEnum
CREATE TYPE "public"."AggregationLevel" AS ENUM ('WARD', 'CONSTITUENCY', 'COUNTY', 'NATIONAL');

-- CreateEnum
CREATE TYPE "public"."ResultStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED', 'DISPUTED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."polling_stations" ADD COLUMN     "ward_id" VARCHAR(50);

-- DropEnum
DROP TYPE "public"."OrganizationStatus";

-- CreateTable
CREATE TABLE "public"."counties" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,

    CONSTRAINT "counties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."constituencies" (
    "id" VARCHAR(50) NOT NULL,
    "county_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,

    CONSTRAINT "constituencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wards" (
    "id" VARCHAR(50) NOT NULL,
    "constituency_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."streams" (
    "id" VARCHAR(50) NOT NULL,
    "polling_station_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "registered_voters" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."elections" (
    "id" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "year" INTEGER NOT NULL,
    "election_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."election_positions" (
    "id" VARCHAR(50) NOT NULL,
    "election_id" VARCHAR(50) NOT NULL,
    "type" "public"."PositionType" NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "aggregation_level" "public"."AggregationLevel" NOT NULL,

    CONSTRAINT "election_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."candidates" (
    "id" VARCHAR(50) NOT NULL,
    "position_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "party" VARCHAR(100),
    "photo_url" VARCHAR(500),
    "entity_id" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_streams" (
    "id" VARCHAR(50) NOT NULL,
    "election_id" VARCHAR(50) NOT NULL,
    "stream_id" VARCHAR(50) NOT NULL,
    "agent_id" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "agent_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stream_results" (
    "id" VARCHAR(50) NOT NULL,
    "stream_id" VARCHAR(50) NOT NULL,
    "position_id" VARCHAR(50) NOT NULL,
    "agent_id" VARCHAR(50) NOT NULL,
    "status" "public"."ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "total_votes" INTEGER,
    "rejected_votes" INTEGER,
    "notes" TEXT,
    "image_url" VARCHAR(500),
    "voice_url" VARCHAR(500),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "stream_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stream_candidate_votes" (
    "id" VARCHAR(50) NOT NULL,
    "stream_result_id" VARCHAR(50) NOT NULL,
    "candidate_id" VARCHAR(50) NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stream_candidate_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."level_results" (
    "id" VARCHAR(50) NOT NULL,
    "position_id" VARCHAR(50) NOT NULL,
    "level" "public"."AggregationLevel" NOT NULL,
    "entity_id" VARCHAR(50) NOT NULL,
    "validator_id" VARCHAR(50) NOT NULL,
    "status" "public"."ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "total_votes" INTEGER,
    "rejected_votes" INTEGER,
    "notes" TEXT,
    "image_url" VARCHAR(500),
    "voice_url" VARCHAR(500),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "level_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."level_candidate_votes" (
    "id" VARCHAR(50) NOT NULL,
    "level_result_id" VARCHAR(50) NOT NULL,
    "candidate_id" VARCHAR(50) NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "level_candidate_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "counties_code_key" ON "public"."counties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "constituencies_code_key" ON "public"."constituencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wards_code_key" ON "public"."wards"("code");

-- CreateIndex
CREATE UNIQUE INDEX "streams_code_key" ON "public"."streams"("code");

-- CreateIndex
CREATE UNIQUE INDEX "election_positions_election_id_type_key" ON "public"."election_positions"("election_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "agent_streams_election_id_stream_id_agent_id_key" ON "public"."agent_streams"("election_id", "stream_id", "agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "stream_results_stream_id_position_id_key" ON "public"."stream_results"("stream_id", "position_id");

-- CreateIndex
CREATE UNIQUE INDEX "stream_candidate_votes_stream_result_id_candidate_id_key" ON "public"."stream_candidate_votes"("stream_result_id", "candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "level_results_position_id_level_entity_id_key" ON "public"."level_results"("position_id", "level", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "level_candidate_votes_level_result_id_candidate_id_key" ON "public"."level_candidate_votes"("level_result_id", "candidate_id");

-- AddForeignKey
ALTER TABLE "public"."constituencies" ADD CONSTRAINT "constituencies_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wards" ADD CONSTRAINT "wards_constituency_id_fkey" FOREIGN KEY ("constituency_id") REFERENCES "public"."constituencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."polling_stations" ADD CONSTRAINT "polling_stations_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."streams" ADD CONSTRAINT "streams_polling_station_id_fkey" FOREIGN KEY ("polling_station_id") REFERENCES "public"."polling_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."elections" ADD CONSTRAINT "elections_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."election_positions" ADD CONSTRAINT "election_positions_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidates" ADD CONSTRAINT "candidates_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."election_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_streams" ADD CONSTRAINT "agent_streams_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_streams" ADD CONSTRAINT "agent_streams_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_streams" ADD CONSTRAINT "agent_streams_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stream_results" ADD CONSTRAINT "stream_results_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stream_results" ADD CONSTRAINT "stream_results_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."election_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stream_results" ADD CONSTRAINT "stream_results_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stream_candidate_votes" ADD CONSTRAINT "stream_candidate_votes_stream_result_id_fkey" FOREIGN KEY ("stream_result_id") REFERENCES "public"."stream_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stream_candidate_votes" ADD CONSTRAINT "stream_candidate_votes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."level_results" ADD CONSTRAINT "level_results_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."election_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."level_results" ADD CONSTRAINT "level_results_validator_id_fkey" FOREIGN KEY ("validator_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."level_candidate_votes" ADD CONSTRAINT "level_candidate_votes_level_result_id_fkey" FOREIGN KEY ("level_result_id") REFERENCES "public"."level_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."level_candidate_votes" ADD CONSTRAINT "level_candidate_votes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
