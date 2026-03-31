import { PartialTranslation } from "@/types";

export const dictionary: Record<string, PartialTranslation[]> = {
  completed: [
    { body: { language: "en", text: "Completed" } },
    { body: { language: "fr", text: "Terminé" } },
    { body: { language: "es", text: "Completado" } },
    { body: { language: "ar", text: "اكتمل" } },
  ],
  assessments: [
    { body: { language: "en", text: "Enter Election Results" } },
    { body: { language: "fr", text: "Saisir les résultats des élections" } },
    { body: { language: "es", text: "Ingresar resultados electorales" } },
    { body: { language: "ar", text: "إدخال نتائج الانتخابات" } },
  ],
  previewAssessment: [
    { body: { language: "en", text: "Preview Form" } },
    { body: { language: "fr", text: "Aperçu du formulaire" } },
    { body: { language: "es", text: "Vista previa del formulario" } },
    { body: { language: "ar", text: "معاينة النموذج" } },
  ],
  preview: [
    { body: { language: "en", text: "Preview" } },
    { body: { language: "fr", text: "Aperçu" } },
    { body: { language: "es", text: "Vista previa" } },
    { body: { language: "ar", text: "معاينة" } },
  ],
  reports: [
    { body: { language: "en", text: "Results" } },
    { body: { language: "fr", text: "Résultats" } },
    { body: { language: "es", text: "Resultados" } },
    { body: { language: "ar", text: "نتائج" } },
  ],
  assessment: [
    { body: { language: "en", text: "Enter Results" } },
    { body: { language: "fr", text: "Saisir les résultats" } },
    { body: { language: "es", text: "Ingresar resultados" } },
    { body: { language: "ar", text: "إدخال النتائج" } },
  ],
  error: [
    { body: { language: "en", text: "Error" } },
    { body: { language: "fr", text: "Erreur" } },
    { body: { language: "es", text: "Error" } },
    { body: { language: "ar", text: "خطأ" } },
  ],
};