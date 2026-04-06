/**
 * Reusable position-level results visualisation.
 * Renders position cards with entity breakdowns and candidate vote bars.
 * Used on both the admin results page and the public results page.
 */
import {
  Box, Text, VStack, HStack, Flex, Badge,
} from "@chakra-ui/react"
import Link from "next/link";
import { FiCheckCircle, FiAlertCircle, FiBarChart2 } from "react-icons/fi";
import { MdHowToVote } from "react-icons/md"
import { LEVEL_COLOR, LEVEL_LABEL, POSITION_ORDER } from "./constants"
import type { ResultStat } from "./ResultsSummary"

type PositionResultsProps = {
  results: ResultStat[];
  /** When provided, each position card shows an "Explore Results" link. */
  electionId?: string;
};

export default function PositionResults({
  results,
  electionId,
}: PositionResultsProps) {
  const sortedResults = [...results].sort(
    (a, b) =>
      POSITION_ORDER.indexOf(a.positionType) -
      POSITION_ORDER.indexOf(b.positionType),
  );

  const totalStreamsReported = results.reduce(
    (s, r) => s + r.streamStats.totalReported,
    0,
  );

  if (totalStreamsReported === 0) {
    return (
      <Box
        bg="white"
        borderRadius="xl"
        p={12}
        textAlign="center"
        borderWidth="2px"
        borderStyle="dashed"
        borderColor="gray.200"
      >
        <Flex
          w={16}
          h={16}
          borderRadius="2xl"
          bg="#eff9d1"
          align="center"
          justify="center"
          mx="auto"
          mb={4}
        >
          <MdHowToVote fontSize="2rem" color="#798217" />
        </Flex>
        <Text fontWeight="700" fontSize="lg" color="gray.700" mb={1}>
          No results yet
        </Text>
        <Text fontSize="sm" color="gray.400">
          Results will appear here once agents start submitting stream data.
        </Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} alignItems="stretch">
      {sortedResults.map((position) => {
        const lc =
          LEVEL_COLOR[position.aggregationLevel] ?? LEVEL_COLOR.NATIONAL;
        const hasVotes = position.streamStats.totalVotes > 0;
        const unitLabel =
          LEVEL_LABEL[position.aggregationLevel] ?? position.aggregationLevel;

        return (
          <Box
            key={position.positionId}
            bg="white"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="gray.100"
            boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
            overflow="hidden"
          >
            {/* ── Position header ─────────────────────────────────── */}
            <Box
              px={6}
              py={4}
              borderBottomWidth="1px"
              borderBottomColor="gray.100"
            >
              <HStack justify="space-between" flexWrap="wrap" gap={3}>
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
                  <Box>
                    <Text fontWeight="700" fontSize="sm" color="gray.900">
                      {position.positionTitle}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {position.streamStats.totalReported.toLocaleString()}{" "}
                      streams ·{" "}
                      {position.streamStats.totalVotes.toLocaleString()} votes ·{" "}
                      {position.entities.length} {unitLabel.toLowerCase()}
                      {position.entities.length !== 1 ? "s" : ""}
                    </Text>
                  </Box>
                </HStack>
                <HStack gap={2}>
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
                    {unitLabel}
                  </Badge>
                  {position.levelValidations > 0 && (
                    <HStack gap={1}>
                      <FiCheckCircle fontSize="0.75rem" color="#10b981" />
                      <Text fontSize="xs" color="#10b981" fontWeight="600">
                        {position.levelValidations} validated
                      </Text>
                    </HStack>
                  )}
                  {!hasVotes && (
                    <HStack gap={1}>
                      <FiAlertCircle fontSize="0.75rem" color="#9ca3af" />
                      <Text fontSize="xs" color="gray.400">
                        No data
                      </Text>
                    </HStack>
                  )}
                  {electionId && hasVotes && (
                    <Link
                      href={`/election-results/${electionId}/drill/${position.positionId}`}
                    >
                      <HStack
                        gap={1.5}
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        bg="#eff9d1"
                        color="#798217"
                        fontSize="xs"
                        fontWeight="700"
                        _hover={{ bg: "#e4f0b8" }}
                        transition="background 0.15s"
                        cursor="pointer"
                      >
                        <FiBarChart2 fontSize="0.8rem" />
                        <Text>Explore</Text>
                      </HStack>
                    </Link>
                  )}
                </HStack>
              </HStack>
            </Box>

            {/* ── Entity groups ───────────────────────────────────── */}
            <VStack gap={0} alignItems="stretch" divideY="1px">
              {position.entities.map((entity) => {
                const maxVotes = entity.candidates[0]?.streamVotes ?? 1;
                const entityTotal = entity.candidates.reduce(
                  (s, c) => s + c.streamVotes,
                  0,
                );

                return (
                  <Box key={entity.entityId}>
                    {/* Entity label row */}
                    <Box
                      px={6}
                      py={2.5}
                      bg="gray.50"
                      borderBottomWidth="1px"
                      borderBottomColor="gray.100"
                    >
                      <HStack justify="space-between">
                        <HStack gap={2}>
                          <Box
                            w={1.5}
                            h={4}
                            bg={lc.border}
                            borderRadius="full"
                          />
                          <Text
                            fontSize="xs"
                            fontWeight="700"
                            color="gray.700"
                            textTransform="uppercase"
                            letterSpacing="wide"
                          >
                            {entity.entityName}
                          </Text>
                        </HStack>
                        {entityTotal > 0 && (
                          <Text fontSize="xs" color="gray.400" fontWeight="500">
                            {entityTotal.toLocaleString()} votes
                          </Text>
                        )}
                      </HStack>
                    </Box>

                    {/* Candidates within entity */}
                    <VStack gap={0} alignItems="stretch">
                      {entity.candidates.map((candidate, idx) => {
                        const pct =
                          maxVotes > 0
                            ? (candidate.streamVotes / maxVotes) * 100
                            : 0;
                        const isLeader = idx === 0 && candidate.streamVotes > 0;

                        return (
                          <Box
                            key={candidate.id}
                            px={6}
                            py={3}
                            borderBottomWidth={
                              idx < entity.candidates.length - 1 ? "1px" : "0"
                            }
                            borderBottomColor="gray.50"
                            bg={isLeader ? "#fafff0" : "white"}
                          >
                            <HStack gap={4} align="center">
                              {/* Rank */}
                              <Flex
                                w={6}
                                h={6}
                                borderRadius="full"
                                flexShrink={0}
                                align="center"
                                justify="center"
                                bg={isLeader ? "#C9D927" : "gray.100"}
                                fontSize="xs"
                                fontWeight="800"
                                color={isLeader ? "#0f172a" : "gray.500"}
                              >
                                {idx + 1}
                              </Flex>

                              {/* Name + party + bar */}
                              <Box flex={1} minW={0}>
                                <HStack justify="space-between" mb={1}>
                                  <HStack gap={2} minW={0}>
                                    <Text
                                      fontSize="sm"
                                      fontWeight={isLeader ? "700" : "600"}
                                      color="gray.900"
                                      style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {candidate.name}
                                    </Text>
                                    {candidate.party && (
                                      <Text
                                        fontSize="xs"
                                        color="gray.400"
                                        flexShrink={0}
                                      >
                                        {candidate.party}
                                      </Text>
                                    )}
                                  </HStack>
                                  <HStack gap={2} flexShrink={0}>
                                    <Text
                                      fontSize="sm"
                                      fontWeight="700"
                                      color={isLeader ? "#798217" : "gray.700"}
                                    >
                                      {candidate.streamVotes.toLocaleString()}
                                    </Text>
                                    {entityTotal > 0 && (
                                      <Text
                                        fontSize="xs"
                                        color="gray.400"
                                        w="36px"
                                        textAlign="right"
                                      >
                                        {(
                                          (candidate.streamVotes /
                                            entityTotal) *
                                          100
                                        ).toFixed(1)}
                                        %
                                      </Text>
                                    )}
                                  </HStack>
                                </HStack>
                                <Box
                                  h="4px"
                                  bg="gray.100"
                                  borderRadius="full"
                                  overflow="hidden"
                                >
                                  <Box
                                    h="full"
                                    w={`${pct}%`}
                                    bg={isLeader ? "#C9D927" : lc.border}
                                    borderRadius="full"
                                    transition="width 0.4s ease"
                                  />
                                </Box>
                              </Box>
                            </HStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  </Box>
                );
              })}

              {position.entities.length === 0 && (
                <Box px={6} py={5} textAlign="center">
                  <Text fontSize="sm" color="gray.400">
                    No candidates registered for this position.
                  </Text>
                </Box>
              )}
            </VStack>

            {/* Rejected votes footer */}
            {position.streamStats.rejectedVotes > 0 && (
              <Box
                px={6}
                py={3}
                bg="#fef9f0"
                borderTopWidth="1px"
                borderTopColor="#fef3c7"
              >
                <Text fontSize="xs" color="#92400e">
                  {position.streamStats.rejectedVotes.toLocaleString()} rejected
                  votes not counted above
                </Text>
              </Box>
            )}
          </Box>
        );
      })}
    </VStack>
  );
}
