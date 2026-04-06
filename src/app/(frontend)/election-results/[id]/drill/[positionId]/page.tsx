import { Box, Heading, Text, VStack, HStack, Flex } from "@chakra-ui/react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicElectionById } from "@/services/Elections"
import DrillDownClient from "@/components/Elections/DrillDownClient"
import { FiArrowLeft } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; positionId: string }>
}) {
  const { id } = await params
  const election = await getPublicElectionById(id).catch(() => null)
  return {
    title: election
      ? `${election.title} — Drill Down Results`
      : "Drill Down Results",
    description: election
      ? `Detailed results breakdown for ${election.title} (${election.year})`
      : "Detailed election results breakdown",
  }
}

export default async function DrillDownPage({
  params,
}: {
  params: Promise<{ id: string; positionId: string }>
}) {
  const { id, positionId } = await params
  const election = await getPublicElectionById(id).catch(() => null)

  if (!election) notFound()

  return (
    <Box
      maxW="7xl"
      mx="auto"
      px={{ base: 4, md: 8 }}
      py={{ base: 6, md: 10 }}
    >
      <VStack gap={6} alignItems="stretch" w="full">
        {/* ── Back + header ──────────────────────────────── */}
        <VStack alignItems="flex-start" gap={3}>
          <Link href={`/election-results/${id}`}>
            <HStack
              gap={1.5}
              color="gray.500"
              fontSize="sm"
              _hover={{ color: "gray.800" }}
              transition="color 0.15s"
            >
              <FiArrowLeft />
              <Text>Back to Results</Text>
            </HStack>
          </Link>

          <HStack gap={2}>
            <Flex
              w={10}
              h={10}
              borderRadius="lg"
              bg="#eff9d1"
              align="center"
              justify="center"
            >
              <MdHowToVote fontSize="1.2rem" color="#798217" />
            </Flex>
            <VStack alignItems="flex-start" gap={0}>
              <Heading
                fontWeight="800"
                fontSize={{ base: "xl", md: "2xl" }}
                color="gray.900"
                lineHeight="1.2"
              >
                {election.title}
              </Heading>
              <Text fontSize="sm" color="gray.500">
                Drill down into detailed results by geographic area
              </Text>
            </VStack>
          </HStack>
        </VStack>

        {/* ── Drill-down component ───────────────────────── */}
        <DrillDownClient electionId={id} positionId={positionId} />

        {/* ── Disclaimer ─────────────────────────────────── */}
        <Box textAlign="center" pt={4}>
          <Text fontSize="xs" color="gray.400">
            Results are unofficial and updated in real-time as data is submitted
            from polling stations.
          </Text>
        </Box>
      </VStack>
    </Box>
  )
}
