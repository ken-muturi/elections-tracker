import { useState } from 'react';
import { SupportedLocale } from '@/context/UXContext';
import { TranslationText } from '@/types';

// Generic interface for any multilingual form
export interface MultilingualFormValues {
  [key: string]: TranslationText[];
}

export const useMultilingualForm = <T extends MultilingualFormValues>(
  initialLanguage: SupportedLocale = 'en',
  availableLanguages: SupportedLocale[],
  fieldNames: (keyof T)[] // Array of field names that contain translations
) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLocale>(initialLanguage);

  // Get all languages that have at least one translation across all fields
  const getActiveLanguages = (values: T): SupportedLocale[] => {
    const allLanguages = fieldNames.flatMap(field => 
      values[field]?.map(t => t.language) || []
    );
    return [...new Set(allLanguages)] as SupportedLocale[];
  };

  // Check if a specific field has content in a language
  const hasContent = (langCode: SupportedLocale, field: keyof T, values: T): boolean => {
    const translation = values[field]?.find(t => t.language === langCode);
    return Boolean(translation?.text?.trim());
  };

  // Check if any field has content in a language
  const hasAnyContent = (langCode: SupportedLocale, values: T): boolean => {
    return fieldNames.some(field => hasContent(langCode, field, values));
  };

  // Get current translation text for a field
  const getCurrentText = (field: keyof T, values: T): string => {
    const translation = values[field]?.find(t => t.language === currentLanguage);
    return translation?.text || '';
  };

  // Add a new language to all translation fields
  const addLanguage = (
    langCode: SupportedLocale, 
    values: T, 
    setFieldValue: (field: string, value: unknown) => void
  ) => {
    const activeLanguages = getActiveLanguages(values);
    if (activeLanguages.includes(langCode)) return;

    // Add empty translation for each field
    fieldNames.forEach(field => {
      const currentTranslations = values[field] || [];
      setFieldValue(field as string, [...currentTranslations, { language: langCode, text: '' }]);
    });
  };

  // Update translation for current language in a specific field
  const updateTranslation = (
    field: keyof T,
    text: string,
    values: T,
    setFieldValue: (field: string, value: unknown) => void
  ) => {
    const currentTranslations = values[field] || [];
    const updated = currentTranslations.map(t => 
      t.language === currentLanguage ? { ...t, text } : t
    );
    setFieldValue(field as string, updated);
  };

  // Get available languages for adding (not yet added)
  const getAvailableLanguages = (values: T): SupportedLocale[] => {
    const activeLanguages = getActiveLanguages(values);
    return availableLanguages.filter(lang => !activeLanguages.includes(lang));
  };

  // Initialize a field with the current language if it doesn't exist
  const initializeField = (
    field: keyof T,
    values: T,
    setFieldValue: (field: string, value: unknown) => void
  ) => {
    if (!values[field] || values[field].length === 0) {
      setFieldValue(field as string, [{ language: currentLanguage, text: '' }]);
    }
  };

  // Get completion status for all fields
  const getCompletionStatus = (values: T) => {
    const activeLanguages = getActiveLanguages(values);
    const completedLanguages = activeLanguages.filter(lang => hasAnyContent(lang, values));
    
    return {
      total: activeLanguages.length,
      completed: completedLanguages.length,
      progress: activeLanguages.length > 0 ? (completedLanguages.length / activeLanguages.length) * 100 : 0,
      byField: fieldNames.reduce((acc, field) => {
        acc[field as string] = activeLanguages.filter(lang => hasContent(lang, field, values)).length;
        return acc;
      }, {} as Record<string, number>)
    };
  };

  return {
    currentLanguage,
    setCurrentLanguage,
    getActiveLanguages,
    hasContent,
    hasAnyContent,
    getCurrentText,
    addLanguage,
    updateTranslation,
    getAvailableLanguages,
    initializeField,
    getCompletionStatus,
  };
};
