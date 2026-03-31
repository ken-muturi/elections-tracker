import { PartialTranslation } from "@/types";

export const dictionary: Record<string, PartialTranslation[]> = {
  save: [
    { body: { language: "en", text: "Save" } },
    { body: { language: "fr", text: "Enregistrer" } },
    { body: { language: "es", text: "Guardar" } },
    { body: { language: "ny", text: "Sungani" } },
    { body: { language: "ar", text: "حفظ" } },
  ],
  clickToUploadFile: [
    { body: { language: "en", text: "Click to upload file" } },
    { body: { language: "fr", text: "Cliquez pour télécharger le fichier" } },
    { body: { language: "es", text: "Haga clic para subir el archivo" } },
    { body: { language: "ny", text: "Dinani kuti mupereke fayilo" } },
    { body: { language: "ar", text: "انقر لتحميل الملف" } },
  ],
  dragAndDrop: [
    { body: { language: "en", text: "drag and drop" } },
    { body: { language: "fr", text: "glisser-déposer" } },
    { body: { language: "es", text: "arrastrar y soltar" } },
    { body: { language: "ny", text: "kudina ndi kusiya" } },
    { body: { language: "ar", text: "اسحب وأفلت" } },
  ],
  removeFile: [
    { body: { language: "en", text: "Remove file" } },
    { body: { language: "fr", text: "Supprimer le fichier" } },
    { body: { language: "es", text: "Eliminar archivo" } },
    { body: { language: "ny", text: "Chotsani fayilo" } },
    { body: { language: "ar", text: "إزالة الملف" } },
  ]
};
