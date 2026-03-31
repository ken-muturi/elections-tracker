import { Box } from "@chakra-ui/react";
import { getSections } from "@/services/Sections";
import { SectionWithRelations } from "@/components/Builder/Sections/type";
import { getQuestionnaireById } from "@/services/Questionnaires";
import { Questionnaire } from "@prisma/client";
import Assessment from "@/components/Assessment";
import GenericPage from "@/components/Generic/Page";
import { PartialTranslation } from "@/types";
import { getPollingStations } from "@/services/PollingStations";

async function getQuestionnaireDetails(questionnaireId: string) {
  try {
    const [sections, questionnaire, pollingStations] = await Promise.all([
      getSections({ questionnaireId }, true),
      getQuestionnaireById(questionnaireId, false),
      getPollingStations(),
    ]);
    return { sections, questionnaire, pollingStations };
  } catch (error) {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return "An unknown error occurred";
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getQuestionnaireDetails(id);

  if (typeof data === "string") {
    return <Box>{data}</Box>;
  }
  const { sections, questionnaire, pollingStations } = data;
  return (
    <GenericPage title={questionnaire?.title as PartialTranslation[]}>
      <Assessment
        sections={sections as SectionWithRelations[]}
        questionnaire={questionnaire as Questionnaire}
        pollingStations={pollingStations}
      />
    </GenericPage>
  );
}
