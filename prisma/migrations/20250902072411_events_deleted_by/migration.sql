-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" VARCHAR(50);

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
