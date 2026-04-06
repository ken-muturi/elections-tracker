import { useCallback, useState } from "react";
import { TranslationText } from "@/types";

type SetFieldValue = (field: string, value: TranslationText[]) => void;

export function useMultilingualForm<T>(
  defaultLanguage: string,
  supportedLocales: string[],
  _fieldNames: string[]
) {
  const [currentLanguage] = useState(defaultLanguage);

  const getCurrentText = useCallback(
    (fieldName: string, values: T): string => {
      const translations = (values as Record<string, TranslationText[]>)[
        fieldName
      ];
      if (!Array.isArray(translations)) return "";
      const found = translations.find((t) => t.language === currentLanguage);
      return found?.text ?? "";
    },
    [currentLanguage]
  );

  const updateTranslation = useCallback(
    (
      fieldName: string,
      value: string,
      values: T,
      setFieldValue: SetFieldValue
    ) => {
      const translations = [
        ...((values as Record<string, TranslationText[]>)[fieldName] ?? []),
      ];
      const idx = translations.findIndex(
        (t) => t.language === currentLanguage
      );
      if (idx >= 0) {
        translations[idx] = { ...translations[idx], text: value };
      } else {
        translations.push({
          language: currentLanguage as TranslationText["language"],
          text: value,
        });
      }
      setFieldValue(fieldName, translations);
    },
    [currentLanguage]
  );

  return {
    currentLanguage,
    getCurrentText,
    updateTranslation,
    supportedLocales,
  };
}
