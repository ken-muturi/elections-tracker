import {
  Box, Heading, Text, VStack, HStack, Flex, Badge, Separator,
} from "@chakra-ui/react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers";
import { getElectionById } from "@/services/Elections"
import { LEVEL_COLOR } from "@/components/Elections/constants"

import { FiArrowLeft, FiUsers } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import CandidateManager from "./CandidateManager"

export default async function CandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await cookies(); // dynamic — requires auth session
  const { id } = await params;
  const election = await getElectionById(id).catch(() => null);

  if (!election) notFound();

  // Positions are already ordered by sortOrder from the service
  const sortedPositions = election.positions;

  const totalCandidates = election.positions.reduce(
    (s, p) => s + p.candidates.length,
    0,
  );

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Back + header */}
      <VStack alignItems="flex-start" gap={3}>
        <Link href={`/elections/${id}`}>
          <HStack
            gap={1.5}
            color="gray.500"
            fontSize="sm"
            _hover={{ color: "gray.800" }}
            transition="color 0.15s"
          >
            <FiArrowLeft />
            <Text>{election.title}</Text>
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
                Manage Candidates
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
            <HStack gap={1.5}>
              <FiUsers fontSize="0.8rem" color="#9ca3af" />
              <Text fontSize="sm" color="gray.500">
                {totalCandidates} candidates across {election.positions.length}{" "}
                positions
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </VStack>

      {/* Positions */}
      <VStack gap={4} alignItems="stretch">
        {sortedPositions.map((position) => {
          const lc = LEVEL_COLOR[position.aggregationLevel];
          return (
            <Box
              key={position.id}
              bg="white"
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="gray.100"
              boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
              overflow="hidden"
            >
              {/* Position header */}
              <Box
                px={6}
                py={4}
                borderBottomWidth="1px"
                borderBottomColor="gray.100"
              >
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack gap={3}>
                    <Flex
                      w={9}
                      h={9}
                      borderRadius="lg"
                      bg={lc.bg}
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <MdHowToVote fontSize="1rem" color={lc.color} />
                    </Flex>
                    <VStack alignItems="flex-start" gap={0}>
                      <Text fontWeight="700" fontSize="sm" color="gray.900">
                        {position.title}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {position.candidates.length} candidates
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge
                    px={2.5}
                    py={1}
                    borderRadius="full"
                    bg={lc.bg}
                    color={lc.color}
                    fontSize="9px"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {position.aggregationLevel}
                  </Badge>
                </HStack>
              </Box>

              {/* Candidate list + add form — client component */}
              <CandidateManager
                positionId={position.id}
                positionType={position.type}
                aggregationLevel={position.aggregationLevel}
                initialCandidates={position.candidates}
              />
            </Box>
          );
        })}
      </VStack>
    </VStack>
  );
}
