import { Prisma } from "@prisma/client";

export type SectionWithRelations = Prisma.SectionGetPayload<{
  include: { units: { include: { questions: true } } };
}>;

export type AssementAnswer = {
  answer: string;
  questionId: string;
};

export type SubmissionWithRelations = Prisma.SubmissionGetPayload<{
  include: {
    pollingStation: true;
    answers: { include: { question: true } };
    user: true;
  };
}>;