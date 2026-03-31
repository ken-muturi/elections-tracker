import { Prisma } from "@prisma/client";
import { PartialTranslation, TranslationText } from "@/types";

export type UnitWithRelation = Prisma.UnitGetPayload<{
  include: { questions: true };
}>;

export type UnitDetail = {
  id: string;
  title: TranslationText[];
  description: TranslationText[];
  sectionId: string;
};
export type UnitForm = {
  id?: string;
} & Omit<UnitDetail, "id">;

export type UnitSaveFields = {
  id?: string;
  title: PartialTranslation[];
  description: PartialTranslation[];
  sectionId: string;
};