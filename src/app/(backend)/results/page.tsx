import { Box, Text, VStack } from "@chakra-ui/react";
import { getQuestionnaires } from "@/services/Questionnaires";
import { Questionnaire } from "@prisma/client";
import Link from "next/link";

async function getElectionForms() {
  try {
    return (await getQuestionnaires()) as Questionnaire[];
  } catch {
    return [];
  }
}

const Page = async () => {
  const forms = await getElectionForms();

  return (
    <VStack gap={4} w="full" alignItems="start" p={4}>
      <Text fontSize="2xl" fontWeight="bold">
        Election Results
      </Text>
      <Text color="gray.500">Select an election form to view results</Text>

      {forms.length === 0 ? (
        <Text color="gray.400">No election forms available yet.</Text>
      ) : (
        <VStack gap={3} w="full" alignItems="start">
          {forms.map((form) => (
            <Link key={form.id} href={`/results/${form.id}`} style={{ width: "100%", maxWidth: "600px" }}>
              <Box
                p={4}
                borderWidth="1px"
                borderRadius="md"
                w="full"
                _hover={{ shadow: "md", borderColor: "blue.300" }}
                cursor="pointer"
                transition="all 0.2s"
              >
                <Text fontWeight="bold">
                  {((form.title as unknown as Array<{ body: { text: string; language: string } }>)?.[0]?.body?.text) || "Untitled Election"}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {((form.description as unknown as Array<{ body: { text: string; language: string } }>)?.[0]?.body?.text) || ""}
                </Text>
              </Box>
            </Link>
          ))}
        </VStack>
      )}
    </VStack>
  );
};

export default Page;
