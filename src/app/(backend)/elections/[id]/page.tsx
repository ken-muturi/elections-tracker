import {
  Box, Heading, Text, VStack, HStack, SimpleGrid,
  Flex, Badge, Separator,
} from "@chakra-ui/react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getElectionById } from "@/services/Elections"
import { getElectionResults } from "@/services/LevelResults"

import { KNOWN_POSITIONS } from "@/constants/elections"
import {
  FiArrowLeft, FiUsers, FiBarChart2, FiCheckCircle,
  FiAlertCircle, FiEdit,
} from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import { ElectionActions } from "@/components/Elections"
import { LEVEL_COLOR } from "@/components/Elections/constants"

export default async function ElectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [election, results] = await Promise.all([
    getElectionById(id).catch(() => null),
    getElectionResults(id).catch(() => []),
  ])

  if (!election) notFound()

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Back + header */}
      <VStack alignItems="flex-start" gap={3}>
        <Link href="/elections">
          <HStack
            gap={1.5}
            color="gray.500"
            fontSize="sm"
            _hover={{ color: "gray.800" }}
            transition="color 0.15s"
          >
            <FiArrowLeft />
            <Text>All Elections</Text>
          </HStack>
        </Link>
        <HStack
          justify="space-between"
          align="flex-end"
          w="full"
          flexWrap="wrap"
          gap={3}
        >
          <VStack alignItems="flex-start" gap={0.5}>
            <HStack gap={2}>
              <Heading
                fontWeight="800"
                fontSize={{ base: "xl", md: "2xl" }}
                color="gray.900"
                lineHeight="1.2"
              >
                {election.title}
              </Heading>
              <Box
                px={2}
                py={0.5}
                bg="#eff9d1"
                color="#798217"
                borderRadius="md"
                fontSize="sm"
                fontWeight="700"
              >
                {election.year}
              </Box>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              {new Date(election.electionDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </VStack>
          <HStack gap={2}>
            <ElectionActions election={election} variant="detail" />
            <Link href={`/elections/${id}/results`}>
              <HStack
                gap={2}
                px={4}
                py={2}
                bg="#eff9d1"
                color="#798217"
                borderRadius="lg"
                fontSize="sm"
                fontWeight="600"
                cursor="pointer"
                _hover={{ bg: "#e5f0a0" }}
                transition="background 0.15s"
              >
                <FiBarChart2 />
                <Text>View Results</Text>
              </HStack>
            </Link>
            <Link href={`/enter-results?electionId=${id}`}>
              <HStack
                gap={2}
                px={4}
                py={2}
                bg="white"
                color="gray.700"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.200"
                fontSize="sm"
                fontWeight="600"
                cursor="pointer"
                _hover={{ bg: "gray.50", borderColor: "gray.300" }}
                transition="all 0.15s"
              >
                <MdHowToVote />
                <Text>Enter Results</Text>
              </HStack>
            </Link>
            <Link href={`/elections/${id}/candidates`}>
              <HStack
                gap={2}
                px={4}
                py={2}
                bg="#0f172a"
                color="white"
                borderRadius="lg"
                fontSize="sm"
                fontWeight="600"
                cursor="pointer"
                _hover={{ bg: "#1e293b" }}
                transition="background 0.15s"
              >
                <FiEdit />
                <Text>Manage Candidates</Text>
              </HStack>
            </Link>
          </HStack>
        </HStack>
      </VStack>

      {/* Position cards */}
      <Box>
        <Heading fontWeight="700" fontSize="lg" color="gray.800" mb={4}>
          Positions ({election.positions.length})
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {election.positions.map((position) => {
            const meta = KNOWN_POSITIONS[position.type];
            const levelColor = LEVEL_COLOR[position.aggregationLevel];
            const resultData = results.find(
              (r) => r.positionId === position.id,
            );
            const allCandidates =
              resultData?.entities.flatMap((e) => e.candidates) ?? [];
            const aggregated = new Map<
              string,
              { name: string; party: string | null; streamVotes: number }
            >();
            for (const c of allCandidates) {
              const existing = aggregated.get(c.id);
              aggregated.set(c.id, {
                name: c.name,
                party: c.party,
                streamVotes: (existing?.streamVotes ?? 0) + c.streamVotes,
              });
            }
            const topCandidate = [...aggregated.values()].sort(
              (a, b) => b.streamVotes - a.streamVotes,
            )[0];

            return (
              <Link
                key={position.id}
                href={`/election-results/${id}/drill/${position.id}`}
              >
                <Box
                  bg="white"
                  p={5}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                  boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
                  cursor="pointer"
                  _hover={{
                    borderColor: "#0ea5e9",
                    boxShadow: "0 0 0 1px #0ea5e9",
                  }}
                  transition="all 0.15s"
                  h="full"
                >
                  <HStack justify="space-between" mb={3}>
                    <Flex
                      w={9}
                      h={9}
                      borderRadius="lg"
                      bg={levelColor.bg}
                      align="center"
                      justify="center"
                    >
                      <MdHowToVote fontSize="1rem" color={levelColor.color} />
                    </Flex>
                    <Badge
                      px={2.5}
                      py={1}
                      borderRadius="full"
                      bg={levelColor.bg}
                      color={levelColor.color}
                      fontSize="9px"
                      fontWeight="700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      {position.aggregationLevel}
                    </Badge>
                  </HStack>

                  <Text
                    fontWeight="700"
                    fontSize="sm"
                    color="gray.900"
                    mb={0.5}
                  >
                    {position.title}
                  </Text>
                  <Text fontSize="xs" color="gray.500" mb={3}>
                    {meta?.description ?? position.description ?? ""}
                  </Text>

                  <Separator borderColor="gray.100" mb={3} />

                  <HStack justify="space-between">
                    <HStack gap={1.5}>
                      <FiUsers fontSize="0.75rem" color="#9ca3af" />
                      <Text fontSize="xs" color="gray.500">
                        {position.candidates.length} candidates
                      </Text>
                    </HStack>
                    {resultData && resultData.streamStats.totalReported > 0 && (
                      <HStack gap={1.5}>
                        <FiCheckCircle fontSize="0.75rem" color="#10b981" />
                        <Text fontSize="xs" color="#10b981" fontWeight="600">
                          {resultData.streamStats.totalReported} streams in
                        </Text>
                      </HStack>
                    )}
                  </HStack>

                  {topCandidate && topCandidate.streamVotes > 0 && (
                    <Box mt={3} p={2.5} bg="#f8fafc" borderRadius="lg">
                      <Text
                        fontSize="9px"
                        color="gray.400"
                        fontWeight="600"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        mb={0.5}
                      >
                        Leading
                      </Text>
                      <HStack justify="space-between">
                        <Text fontSize="xs" fontWeight="700" color="gray.800">
                          {topCandidate.name}
                        </Text>
                        <Text fontSize="xs" fontWeight="700" color="#798217">
                          {topCandidate.streamVotes.toLocaleString()} votes
                        </Text>
                      </HStack>
                      {topCandidate.party && (
                        <Text fontSize="9px" color="gray.400">
                          {topCandidate.party}
                        </Text>
                      )}
                    </Box>
                  )}
                </Box>
              </Link>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* Quick stats */}
      <Box>
        <Heading fontWeight="700" fontSize="lg" color="gray.800" mb={4}>
          Results Summary
        </Heading>
        <SimpleGrid columns={{ base: 2, md: 3 }} gap={4}>
          {results.map((r) => (
            <Link
              key={r.positionId}
              href={`/election-results/${id}/drill/${r.positionId}`}
            >
              <Box
                bg="white"
                p={4}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="gray.100"
                boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
                cursor="pointer"
                _hover={{
                  borderColor: "#0ea5e9",
                  boxShadow: "0 0 0 1px #0ea5e9",
                }}
                transition="all 0.15s"
                h="full"
              >
                <Text
                  fontSize="xs"
                  color="gray.500"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  mb={1}
                >
                  {r.positionTitle}
                </Text>
                <Text
                  fontSize="2xl"
                  fontWeight="800"
                  color="gray.900"
                  lineHeight="1.1"
                >
                  {r.streamStats.totalVotes.toLocaleString()}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {r.streamStats.totalReported} streams · {r.levelValidations}{" "}
                  validations
                </Text>
              </Box>
            </Link>
          ))}
        </SimpleGrid>
      </Box>
    </VStack>
  );
}
