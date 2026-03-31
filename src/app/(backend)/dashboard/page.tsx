import { Box, Heading, Text, VStack, HStack, SimpleGrid } from '@chakra-ui/react'
import React from 'react'
import { getQuestionnaires } from "@/services/Questionnaires"
import { Questionnaire } from "@prisma/client"
import Link from 'next/link'

async function getElectionForms() {
  try {
    return (await getQuestionnaires()) as Questionnaire[]
  } catch {
    return []
  }
}

const page = async () => {
  const forms = await getElectionForms()

  return (
    <VStack gap={6} alignItems="start" w="full" p={4}>
      <Box>
        <Heading size="lg">Election Dashboard</Heading>
        <Text color="gray.500" mt={1}>
          Overview of all election forms and their results
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} w="full">
        <Box p={5} borderWidth="1px" borderRadius="lg" bg="blue.50">
          <Text fontSize="sm" color="gray.500">Total Election Forms</Text>
          <Text fontSize="3xl" fontWeight="bold" color="blue.600">
            {forms.length}
          </Text>
        </Box>
      </SimpleGrid>

      <Box w="full">
        <Heading size="md" mb={4}>Election Forms</Heading>
        {forms.length === 0 ? (
          <Text color="gray.500">No election forms created yet. Go to Election Forms to create one.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {forms.map((form) => (
              <Link key={form.id} href={`/results/${form.id}`}>
                <Box
                  p={5}
                  borderWidth="1px"
                  borderRadius="lg"
                  _hover={{ shadow: "md", borderColor: "blue.300" }}
                  cursor="pointer"
                  transition="all 0.2s"
                >
                  <Text fontWeight="bold" fontSize="lg">
                    {((form.title as unknown as Array<{ body: { text: string; language: string } }>)?.[0]?.body?.text) || "Untitled"}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {((form.description as unknown as Array<{ body: { text: string; language: string } }>)?.[0]?.body?.text) || "No description"}
                  </Text>
                  <HStack mt={3} gap={4}>
                    <Text fontSize="xs" color="gray.400">
                      Start: {new Date(form.startDate).toLocaleDateString()}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      End: {new Date(form.endDate).toLocaleDateString()}
                    </Text>
                  </HStack>
                </Box>
              </Link>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </VStack>
  )
}

export default page