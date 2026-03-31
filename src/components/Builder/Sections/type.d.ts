import { Prisma } from "@prisma/client";
import { PartialTranslation, TranslationText } from "@/types";

export type SectionWithRelations = Prisma.SectionGetPayload<{
  include: { questionnaire: true; units: { include: { questions: true } } };
}>;

export type SectionDetail = {
  id: string;
  title: TranslationText[];
  description: TranslationText[];
  questionnaireId: string;
};
export type SectionForm = {
  id?: string;
} & Omit<SectionDetail, "id">;

export type SectionSaveFields = {
  id?: string;
  title: PartialTranslation[];
  description: PartialTranslation[];
  questionnaireId: string;
};