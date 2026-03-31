import { PartialTranslation } from "@/types";

export const dictionary: Record<string, PartialTranslation[]> = {
  name: [
    { body: { language: "en", text: "Name" } },
    { body: { language: "fr", text: "Nom" } },
    { body: { language: "es", text: "Nombre" } },
    { body: { language: "ar", text: "اسم" } },
  ],
  nextMonth: [
    { body: { language: "en", text: "Next month" } },
    { body: { language: "fr", text: "Mois prochain" } },
    { body: { language: "es", text: "Próximo mes" } },
    { body: { language: "ar", text: "الشهر القادم" } },
  ],
  previousMonth: [
    { body: { language: "en", text: "Previous month" } },
    { body: { language: "fr", text: "Mois précédent" } },
    { body: { language: "es", text: "Mes anterior" } },
    { body: { language: "ar", text: "الشهر السابق" } },
  ],
};
