import { Prisma } from "@prisma/client";
import { TranslationText } from "@/types";

export type QuestionWithRelations = Prisma.QuestionGetPayload<object>;

// Updated Option type to support multilingual labels
type Option = { 
  label: TranslationText[]; 
  value: string; 
};

// Legacy Option type for backward compatibility during migration
type LegacyOption = { language: string; text: string; value: string };

export type QuestionForm = {
  id?: string;
  title: TranslationText[];
  description: TranslationText[];
  unitId: string;
  note: string;
  options?: Option[]; // New multilingual option format
  legacyOptions?: LegacyOption[]; // For backward compatibility during migration
  required: boolean;
  type:
    | "email"
    | "password"
    | "text"
    | "select"
    | "checkbox"
    | "radio"
    | "date"
    | "number"
    | "textarea"
    | "multi-select";
  conditions?: Array<{
    questionId: string;
    operator:
      | "equals"
      | "notEquals"
      | "contains"
      | "notContains"
      | "greaterThan"
      | "lessThan";
    value: boolean | string | number;
  }>;
};

export type QuestionFormSaveFields = {
  title: PartialTranslation[];
  description: PartialTranslation[];
  unitId: string;
  details: PrismaJson.QuestionDetail;
};