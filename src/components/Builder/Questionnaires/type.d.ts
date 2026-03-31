import { Prisma } from "@prisma/client";

export type QuestionnaireWithRelations = Prisma.QuestionnaireGetPayload<{
  include: { sections: true };
}>;

export type QuestionnaireDetail = {
  id: string;
  title: TranslationText[];
  description: TranslationText[];
  startDate: string;
  endDate: string;
  hasSections: boolean;
};
export type QuestionnaireForm = {
  id?: string;
} & Omit<QuestionnaireDetail, "id" | "hasSections">;