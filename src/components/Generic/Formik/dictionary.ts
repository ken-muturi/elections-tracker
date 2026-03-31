import { PartialTranslation } from "@/types";

export const dictionary: Record<string, PartialTranslation[]> = {
  search: [
    { body: { language: "en", text: "Search" } },
    { body: { language: "fr", text: "Rechercher" } },
    { body: { language: "es", text: "Buscar" } },
    { body: { language: "ar", text: "بحث" } },
  ],
  selectOption: [
    { body: { language: "en", text: "Select option" } },
    { body: { language: "fr", text: "Sélectionner une option" } },
    { body: { language: "es", text: "Seleccionar una opción" } },
    { body: { language: "ar", text: "اختر خيارا" } },
  ],
  other: [
    { body: { language: "en", text: "Other" } },
    { body: { language: "fr", text: "Autre" } },
    { body: { language: "es", text: "Otro" } },
    { body: { language: "ar", text: "آخر" } },
  ]
}