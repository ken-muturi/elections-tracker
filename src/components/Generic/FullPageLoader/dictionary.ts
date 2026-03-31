import { type PartialTranslation } from "@/types";

export const dictionary: Record<string, PartialTranslation[]> = {
  pleaseWait: [
    { body: { language: "en", text: "Please wait..." } },
    { body: { language: "fr", text: "Veuillez patienter..." } },
    { body: { language: "es", text: "Por favor, espere..." } },
    { body: { language: "ar", text: "يرجى الانتظار..." } },
  ],
};
