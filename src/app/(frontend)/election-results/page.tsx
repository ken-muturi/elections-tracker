import { Box, Text, VStack } from "@chakra-ui/react";
import GenericPage from "@/components/Generic/Page";
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

export default async function Page() {
  const forms = await getElectionForms();

  return (
    <GenericPage title="Election Results">
      <VStack gap={3} w="full" alignItems="start">
        <Text color="gray.500">Select an election to view live results</Text>
        {forms.length === 0 ? (
          <Text color="gray.400">No elections available.</Text>
        ) : (
          forms.map((form) => (
            <Link
              key={form.id}
              href={`/results/${form.id}`}
              style={{ width: "100%", maxWidth: "600px" }}
            >
              <Box
                p={4}
                borderWidth="1px"
                borderRadius="md"
                w="full"
                _hover={{ shadow: "md", borderColor: "green.300" }}
                cursor="pointer"
                transition="all 0.2s"
              >
                <Text fontWeight="bold">
                  {((form.title as unknown as Array<{ body: { text: string; language: string } }>)?.[0]?.body?.text) || "Untitled"}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {((form.description as unknown as Array<{ body: { text: string; language: string } }>)?.[0]?.body?.text) || ""}
                </Text>
              </Box>
            </Link>
          ))
        )}
      </VStack>
    </GenericPage>
  );
}
