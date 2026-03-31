import { PartialTranslation } from "@/types";

export const dictionary: Record<string, PartialTranslation[]> = {
  zoom: [
    {
      body: {
        language: "en",
        text: "Zoom and click on the map to mark the location",
      },
    },
    {
      body: {
        language: "fr",
        text: "Zoomer et cliquer sur la carte pour marquer l'emplacement",
      },
    },
    {
      body: {
        language: "es",
        text: "Acércate y haz clic en el mapa para marcar la ubicación",
      },
    },
    {
      body: {
        language: "ny",
        text: "Zungulira ndikudina pa ramapulo kuti muwone malo",
      },
    },
  ],
  cancel: [
    { body: { language: "en", text: "Cancel" } },
    { body: { language: "fr", text: "Annuler" } },
    { body: { language: "es", text: "Cancelar" } },
    { body: { language: "ny", text: "Siyani" } },
    { body: { language: "ar", text: "إلغاء" } },
  ],
  save: [
    { body: { language: "en", text: "Save" } },
    { body: { language: "fr", text: "Enregistrer" } },
    { body: { language: "es", text: "Guardar" } },
    { body: { language: "ny", text: "Sungani" } },
    { body: { language: "ar", text: "حفظ" } },
  ],
};
