/**
 * Reusable position-level results visualisation.
 * Entities are rendered as cards in a responsive grid.
 *
 * When entities carry countyName / constituencyName, rendering is hierarchical:
 *   - CONSTITUENCY (MP): collapsible county sections → constituency cards
 *   - WARD (MCA):        collapsible county → collapsible constituency → ward cards
 */
"use client";

import {
  Box, Text, VStack, HStack, Flex, Badge, SimpleGrid,
} from "@chakra-ui/react"
import Link from "next/link";
import { FiCheckCircle, FiAlertCircle, FiBarChart2 } from "react-icons/fi";
import { MdHowToVote } from "react-icons/md"
import { LEVEL_COLOR, LEVEL_LABEL, POSITION_ORDER } from "../constants"
import type { ResultStat } from "../ResultsSummary"
import { groupByParent } from "./helpers"
import CollapsibleCounty from "./CollapsibleCounty"
import EntityCard from "./EntityCard"

type PositionResultsProps = {
  results: ResultStat[];
  electionId?: string;
};

export default function PositionResults({ results, electionId }: PositionResultsProps) {
  const sortedResults = [...results].sort(
    (a, b) =>
      POSITION_ORDER.indexOf(a.positionType) -
      POSITION_ORDER.indexOf(b.positionType),
  );

  const totalStreamsReported = results.reduce(
    (s, r) => s + r.streamStats.totalReported, 0,
  );

  if (totalStreamsReported === 0) {
    return (
      <Box
        bg="white" borderRadius="xl" p={12} textAlign="center"
        borderWidth="2px" borderStyle="dashed" borderColor="gray.200"
      >
        <Flex w={16} h={16} borderRadius="2xl" bg="#eff9d1" align="center"
          justify="center" mx="auto" mb={4}>
          <MdHowToVote fontSize="2rem" color="#798217" />
        </Flex>
        <Text fontWeight="700" fontSize="lg" color="gray.700" mb={1}>No results yet</Text>
        <Text fontSize="sm" color="gray.400">
          Results will appear here once agents start submitting stream data.
        </Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} alignItems="stretch">
      {sortedResults.map((position) => {
        const lc = LEVEL_COLOR[position.aggregationLevel] ?? LEVEL_COLOR.NATIONAL;
        const hasVotes = position.streamStats.totalVotes > 0;
        const unitLabel = LEVEL_LABEL[position.aggregationLevel] ?? position.aggregationLevel;
        const groups = groupByParent(position.entities);
        const canExplore = electionId && hasVotes &&
          ["COUNTY", "CONSTITUENCY", "WARD", "STATION"].includes(position.aggregationLevel);
        const exploreProps = canExplore
          ? { electionId, positionId: position.positionId, aggregationLevel: position.aggregationLevel }
          : undefined;

        return (
          <Box
            key={position.positionId}
            bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100"
            boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden"
          >
            {/* ── Position header ─────────────────────────────────── */}
            <Box px={6} py={4} borderBottomWidth="1px" borderBottomColor="gray.100">
              <HStack justify="space-between" flexWrap="wrap" gap={3}>
                <HStack gap={3}>
                  <Flex w={9} h={9} borderRadius="lg" bg={lc.bg} align="center"
                    justify="center" flexShrink={0}>
                    <MdHowToVote fontSize="1rem" color={lc.color} />
                  </Flex>
                  <Box>
                    <Text fontWeight="700" fontSize="sm" color="gray.900">
                      {position.positionTitle}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {position.streamStats.totalReported.toLocaleString()} streams ·{" "}
                      {position.streamStats.totalVotes.toLocaleString()} votes ·{" "}
                      {position.entities.length} {unitLabel.toLowerCase()}
                      {position.entities.length !== 1 ? "s" : ""}
                    </Text>
                  </Box>
                </HStack>
                <HStack gap={2}>
                  <Badge
                    px={2.5} py={1} borderRadius="full" bg={lc.bg} color={lc.color}
                    fontSize="9px" fontWeight="700" textTransform="uppercase" letterSpacing="wide"
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
                      <Text fontSize="xs" color="gray.400">No data</Text>
                    </HStack>
                  )}
                  {electionId && hasVotes && (
                    <Link href={`/election-results/${electionId}/drill/${position.positionId}`}>
                      <HStack
                        gap={1.5} px={3} py={1.5} borderRadius="full"
                        bg="#eff9d1" color="#798217" fontSize="xs" fontWeight="700"
                        _hover={{ bg: "#e4f0b8" }} transition="background 0.15s" cursor="pointer"
                      >
                        <FiBarChart2 fontSize="0.8rem" />
                        <Text>Explore</Text>
                      </HStack>
                    </Link>
                  )}
                </HStack>
              </HStack>
            </Box>

            {/* ── Entity cards ────────────────────────────────────── */}
            <Box p={5}>
              {groups ? (
                <VStack gap={3} alignItems="stretch">
                  {groups.map((countyGroup) => (
                    <CollapsibleCounty
                      key={countyGroup.countyName}
                      countyGroup={countyGroup}
                      lc={lc}
                      exploreProps={exploreProps}
                    />
                  ))}
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                  {position.entities.map((entity) => (
                    <EntityCard
                      key={entity.entityId} entity={entity} lc={lc}
                      exploreHref={exploreProps
                        ? `/election-results/${exploreProps.electionId}/drill/${exploreProps.positionId}?entityId=${entity.entityId}&entityLevel=${exploreProps.aggregationLevel}`
                        : undefined}
                    />
                  ))}
                  {position.entities.length === 0 && (
                    <Box gridColumn="1 / -1" py={5} textAlign="center">
                      <Text fontSize="sm" color="gray.400">
                        No candidates registered for this position.
                      </Text>
                    </Box>
                  )}
                </SimpleGrid>
              )}
            </Box>

            {/* Rejected votes footer */}
            {position.streamStats.rejectedVotes > 0 && (
              <Box px={6} py={3} bg="#fef9f0" borderTopWidth="1px" borderTopColor="#fef3c7">
                <Text fontSize="xs" color="#92400e">
                  {position.streamStats.rejectedVotes.toLocaleString()} rejected votes not counted above
                </Text>
              </Box>
            )}
          </Box>
        );
      })}
    </VStack>
  );
}
