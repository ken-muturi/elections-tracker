import {
  Box, Heading, Text, VStack, HStack,
} from "@chakra-ui/react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { getElectionById } from "@/services/Elections"
import { FiArrowLeft, FiUsers } from "react-icons/fi"
import CandidatesFilter from "./CandidatesFilter"

export default async function CandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await cookies()
  const { id } = await params
  const election = await getElectionById(id).catch(() => null)

  if (!election) notFound()

  const totalCandidates = election.positions.reduce(
    (s, p) => s + p.candidates.length,
    0,
  )

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Back + header */}
      <VStack alignItems="flex-start" gap={3}>
        <Link href={`/elections/${id}`}>
          <HStack
            gap={1.5} color="gray.500" fontSize="sm"
            _hover={{ color: "gray.800" }} transition="color 0.15s"
          >
            <FiArrowLeft />
            <Text>{election.title}</Text>
          </HStack>
        </Link>
        <HStack
          justify="space-between" align="flex-end"
          w="full" flexWrap="wrap" gap={3}
        >
          <VStack alignItems="flex-start" gap={0.5}>
            <HStack gap={2}>
              <Heading
                fontWeight="800"
                fontSize={{ base: "xl", md: "2xl" }}
                color="gray.900"
                lineHeight="1.2"
              >
                Manage Candidates
              </Heading>
              <Box
                px={2} py={0.5}
                bg="#eff9d1" color="#798217"
                borderRadius="md" fontSize="sm" fontWeight="700"
              >
                {election.year}
              </Box>
            </HStack>
            <HStack gap={1.5}>
              <FiUsers fontSize="0.8rem" color="#9ca3af" />
              <Text fontSize="sm" color="gray.500">
                {totalCandidates} candidates across {election.positions.length} positions
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </VStack>

      {/* Filter + positions — client component */}
      <CandidatesFilter positions={election.positions} />
    </VStack>
  )
}
