import { getServerSession } from "next-auth"
import { AuthOptions } from "@/app/auth"
import { getMyAssignments } from "@/services/AgentAssignments"
import { getAgentResults } from "@/services/StreamResults"
import { VStack, Heading, Text, HStack } from "@chakra-ui/react"
import { FiBarChart2 } from "react-icons/fi"
import MyResultsClient from "./MyResultsClient"


export default async function ResultsPage() {
  const session = await getServerSession(AuthOptions)
  if (!session?.user) return null

  const assignments = await getMyAssignments()

  // Get unique active election IDs
  const electionIds = [...new Set(
    assignments
      .filter((a) => a.election.isActive)
      .map((a) => a.election.id)
  )]

  // Fetch results for each election
  const electionResults = await Promise.all(
    electionIds.map(async (electionId) => {
      const results = await getAgentResults(electionId, session.user.id)
      const election = assignments.find((a) => a.election.id === electionId)!.election
      return { election, results }
    })
  )

  const hasResults = electionResults.some((e) => e.results.length > 0)

  if (!hasResults) {
    return (
      <VStack gap={6} alignItems="center" justifyContent="center" minH="60vh">
        <FiBarChart2 fontSize="3rem" color="#94a3b8" />
        <VStack gap={1}>
          <Heading fontSize="xl" fontWeight="700" color="gray.700">No Results Yet</Heading>
          <Text fontSize="sm" color="gray.500" textAlign="center" maxW="400px">
            You haven&apos;t submitted any results yet. Go to &quot;Enter Results&quot;
            to start recording vote counts for your assigned streams.
          </Text>
        </VStack>
      </VStack>
    )
  }

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      <HStack gap={3}>
        <VStack alignItems="flex-start" gap={0.5}>
          <Heading fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} color="gray.900" lineHeight="1.2">
            My Results
          </Heading>
          <Text fontSize="sm" color="gray.500">View and track your submitted results</Text>
        </VStack>
      </HStack>

      <MyResultsClient electionResults={JSON.parse(JSON.stringify(electionResults))} />
    </VStack>
  )
}
