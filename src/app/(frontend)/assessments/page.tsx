import { Box } from "@chakra-ui/react";
import GenericPage from "@/components/Generic/Page";
import { getQuestionnaires } from "@/services/Questionnaires";
import Assessments from "@/components/AssessmentCards";
import { Questionnaire } from "@prisma/client";
import { dictionary } from "@/components/AssessmentCards/dictionary";

async function getAssessmentDetails() {
  try {
    const [questionnaires] = await Promise.all([getQuestionnaires()]);
    return { questionnaires };
  } catch (error) {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return "An unknown error occurred";
  }
}

export default async function Page() {
  const data = await getAssessmentDetails();
  if (typeof data === "string") {
    return (
      <GenericPage title={dictionary.error}>
        <Box>{data}</Box>
      </GenericPage>
    );
  }
  const { questionnaires } = data;
  return (
    <GenericPage title={dictionary.assessments}>
      <Assessments assessments={questionnaires as Questionnaire[]} />
    </GenericPage>
  );
}
