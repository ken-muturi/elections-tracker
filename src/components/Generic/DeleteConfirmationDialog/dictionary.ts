import { PartialTranslation } from "@/types";

export const dictionary: Record<string, PartialTranslation[]> = {
  confirmText: [
    { body: { language: "en", text: 'Type "Confirm" to continue.' } },
    { body: { language: "fr", text: 'Tapez "Confirm" pour continuer.' } },
    { body: { language: "es", text: 'Escribe "Confirm" para continuar.' } },
    { body: { language: "ar", text: 'اكتب "تأكيد" للمتابعة.' } },
  ],
  confirm: [
    { body: { language: "en", text: "Confirm" } },
    { body: { language: "fr", text: "Confirmer" } },
    { body: { language: "es", text: "Confirmar" } },
    { body: { language: "ar", text: "تأكيد" } },
  ],
  cancel: [
    { body: { language: "en", text: "Cancel" } },
    { body: { language: "fr", text: "Annuler" } },
    { body: { language: "es", text: "Cancelar" } },
    { body: { language: "ar", text: "إلغاء" } },
  ],
};
