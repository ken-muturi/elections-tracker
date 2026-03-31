import { PartialTranslation } from "@/types";

export const dictionary: Record<string, PartialTranslation[]> = {
  search: [
    { body: { language: "en", text: "Search" } },
    { body: { language: "fr", text: "Rechercher" } },
    { body: { language: "es", text: "Buscar" } },
    { body: { language: "ar", text: "بحث" } },
  ],
  selectGroups: [
    { body: { language: "en", text: "Select Groups" } },
    { body: { language: "fr", text: "Sélectionner des groupes" } },
    { body: { language: "es", text: "Seleccionar grupos" } },
    { body: { language: "ar", text: "اختر مجموعات" } },
  ],
  clickToClear: [
    {
      body: {
        language: "en",
        text: "Click to clear. Double click to show all columns filter.",
      },
    },
    {
      body: {
        language: "fr",
        text: "Cliquez pour effacer. Double-cliquez pour afficher tous les filtres de colonne.",
      },
    },
    {
      body: {
        language: "es",
        text: "Haga clic para borrar. Haga doble clic para mostrar todos los filtros de columnas.",
      },
    },
    {
      body: {
        language: "ar",
        text: "انقر للمسح. انقر نقرًا مزدوجًا لعرض جميع عوامل التصفية للأعمدة.",
      },
    },
  ],
};
