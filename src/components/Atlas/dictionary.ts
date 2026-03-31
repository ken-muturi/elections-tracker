import { type PartialTranslation } from "@/types";

export const dictionary: Record<string, PartialTranslation[]> = {
  atlas: [
    { body: { language: "en", text: "Advisories" } },
    { body: { language: "fr", text: "Avis" } },
    { body: { language: "es", text: "Avisos" } },
    { body: { language: "ny", text: "Mafunso" } },
  ],
  extensionOfficer: [
    { body: { language: "en", text: "Extension Officer" } },
    { body: { language: "fr", text: "Agent d’extension" } },
    { body: { language: "es", text: "Agente de extensión" } },
    { body: { language: "ny", text: "Wothandizira" } },
  ],
  farmerOrganisation: [
    { body: { language: "en", text: "Farmer Organisation" } },
    { body: { language: "fr", text: "Organisation de producteurs" } },
    { body: { language: "es", text: "Organización de agricultores" } },
    { body: { language: "ny", text: "Gulu la Otsatsa" } },
  ],
  cadre: [
    { body: { language: "en", text: "Cadre" } },
    { body: { language: "fr", text: "Cadre" } },
    { body: { language: "es", text: "Marco" } },
    { body: { language: "ny", text: "Chitsanzo" } },
  ],
  location: [
    { body: { language: "en", text: "Location" } },
    { body: { language: "fr", text: "Emplacement" } },
    { body: { language: "es", text: "Ubicación" } },
    { body: { language: "ny", text: "Chikhalidwe" } },
  ],
};
