import { PrismaClient } from "@prisma/client";

// import { withOptimize } from "@prisma/extension-optimize";

declare global {
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type DataObject<T> = {
      id: string;
      type: string;
      body: T;
    };

    type TranslationText = {
      language: "en" | "es" | "fr" | "ar" | "ny";
      text: string;
    };

    type PartialTranslation = Pick<DataObject<TranslationText>, "body">;

    type Option = {
      label: PartialTranslation[];
      value: string;
    };

    type Condition = {
      questionId: string;
      operator:
        | "equals"
        | "notEquals"
        | "contains"
        | "notContains"
        | "greaterThan"
        | "lessThan";
      value: string | string[] | number;
    };

    type DynamicOptionsConfig = {
      sourceQuestionId: string;
      mapping: {
        [sourceValue: string]: Option[];
      };
    };

    type QuestionDetail = {
      note?: string;
      options?: Option[];
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
      conditions?: Condition[];
      dynamicOptions?: DynamicOptionsConfig;
    };
  }
}

const prisma = new PrismaClient({
  log: [
    "query",
    // { level: 'warn', emit: 'event' },
    // { level: 'info', emit: 'event' },
    { level: "error", emit: "event" },
  ],
  errorFormat: "pretty",
});

if (process.env.NODE_ENV !== "production") {
  // prisma.$extends(withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY || '' }));
  global.prisma = prisma;
}

export default prisma;
