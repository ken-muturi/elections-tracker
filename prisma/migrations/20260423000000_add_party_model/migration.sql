-- CreateTable
CREATE TABLE "public"."parties" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "abbreviation" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add optional party_id FK to users
ALTER TABLE "public"."users" ADD COLUMN "party_id" VARCHAR(50);

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_party_id_fkey"
  FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
