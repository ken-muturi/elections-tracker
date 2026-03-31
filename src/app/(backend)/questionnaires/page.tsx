import { Box } from "@chakra-ui/react";
import { getQuestionnaires } from "@/services/Questionnaires";
import Questionnaires from "@/components/Builder/Questionnaires/Details/Table";
import { QuestionnaireWithRelations } from "@/components/Builder/Questionnaires/type";

async function getQuestionnaireDetails() {
  try {
    return (await getQuestionnaires(
      undefined,
      true
    )) as QuestionnaireWithRelations[];
  } catch (error) {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return "An unknown error occurred";
  }
}

const Page = async () => {
  const forms = await getQuestionnaireDetails();
  if (typeof forms === "string") {
    return <Box>{forms}</Box>;
  }

  return <Questionnaires forms={forms} />;
};

export default Page;
