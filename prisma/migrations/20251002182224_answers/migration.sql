-- CreateTable
CREATE TABLE "public"."answers" (
    "id" VARCHAR(50) NOT NULL,
    "data_entry_number" VARCHAR(50) NOT NULL,
    "question_id" VARCHAR(50) NOT NULL,
    "answer" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
