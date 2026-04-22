/**
 * Reusable position-level results visualisation.
 * Entities are rendered as cards in a responsive grid.
 *
 * When entities carry countyName / constituencyName, rendering is hierarchical:
 *   - CONSTITUENCY (MP): collapsible county sections → constituency cards
 *   - WARD (MCA):        collapsible county → collapsible constituency → ward cards
 */
"use client";

import { useState } from "react";
import {
  Box, Text, VStack, HStack, Flex, Badge, SimpleGrid,
} from "@chakra-ui/react"
import Link from "next/link";
import { FiCheckCircle, FiAlertCircle, FiBarChart2, FiMapPin, FiChevronDown } from "react-icons/fi";
import { MdHowToVote } from "react-icons/md"
import { LEVEL_COLOR, LEVEL_LABEL, POSITION_ORDER } from "./constants"
import type { ResultStat } from "./ResultsSummary"

type Entity = ResultStat["entities"][number]

type ConstituencyGroup = { constituencyName: string | null; entities: Entity[] }
type CountyGroup = { countyName: string; constituencies: ConstituencyGroup[] }

function groupByParent(entities: Entity[]): CountyGroup[] | null {
  if (!entities.some((e) => e.countyName)) return null;

  const countyMap = new Map<string, Map<string, Entity[]>>();
  for (const entity of entities) {
    const county = entity.countyName ?? "Other";
    const constituency = entity.constituencyName ?? "";
    if (!countyMap.has(county)) countyMap.set(county, new Map());
    const constMap = countyMap.get(county)!;
    if (!constMap.has(constituency)) constMap.set(constituency, []);
    constMap.get(constituency)!.push(entity);
  }

  return Array.from(countyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([countyName, constMap]) => ({
      countyName,
      constituencies: Array.from(constMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([constituencyName, ents]) => ({
          constituencyName: constituencyName || null,
          entities: ents,
        })),
    }));
}

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
                  {electionId && hasVotes && position.aggregationLevel !== "WARD" && (
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
                    />
                  ))}
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                  {position.entities.map((entity) => (
                    <EntityCard key={entity.entityId} entity={entity} lc={lc} />
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

type LcColors = { bg: string; color: string; border: string };

function CollapsibleCounty({
  countyGroup,
  lc,
}: {
  countyGroup: CountyGroup;
  lc: LcColors;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const entityCount = countyGroup.constituencies.reduce(
    (s, c) => s + c.entities.length, 0,
  );

  return (
    <Box borderWidth="1px" borderColor="gray.100" borderRadius="xl" overflow="hidden">
      {/* County toggle header */}
      <HStack
        px={4} py={2.5}
        bg="gray.100"
        cursor="pointer"
        userSelect="none"
        onClick={() => setIsOpen((o) => !o)}
        justify="space-between"
        _hover={{ bg: "gray.200" }}
        transition="background 0.1s"
      >
        <HStack gap={2}>
          <Box w={2} h={4} bg="gray.400" borderRadius="full" />
          <Text fontSize="9px" fontWeight="800" color="gray.500"
            textTransform="uppercase" letterSpacing="widest">
            {countyGroup.countyName}
          </Text>
          <Box
            px={1.5} py={0.5} borderRadius="full"
            bg="gray.200" fontSize="9px" fontWeight="700" color="gray.500"
          >
            {entityCount}
          </Box>
        </HStack>
        <Box
          color="gray.400"
          transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
          transition="transform 0.2s"
        >
          <FiChevronDown fontSize="0.85rem" />
        </Box>
      </HStack>

      {isOpen && (
        <Box p={4}>
          <VStack gap={3} alignItems="stretch">
            {countyGroup.constituencies.map((constGroup) =>
              constGroup.constituencyName ? (
                <CollapsibleConstituency
                  key={constGroup.constituencyName}
                  constGroup={constGroup}
                  lc={lc}
                />
              ) : (
                <SimpleGrid key="direct" columns={{ base: 1, md: 2 }} gap={3}>
                  {constGroup.entities.map((entity) => (
                    <EntityCard key={entity.entityId} entity={entity} lc={lc} />
                  ))}
                </SimpleGrid>
              ),
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
}

function CollapsibleConstituency({
  constGroup,
  lc,
}: {
  constGroup: ConstituencyGroup;
  lc: LcColors;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box borderWidth="1px" borderColor="gray.100" borderRadius="lg" overflow="hidden">
      {/* Constituency toggle header */}
      <HStack
        px={4} py={2}
        bg="gray.50"
        cursor="pointer"
        userSelect="none"
        onClick={() => setIsOpen((o) => !o)}
        justify="space-between"
        _hover={{ bg: "gray.100" }}
        transition="background 0.1s"
      >
        <HStack gap={2}>
          <Box w={1.5} h={3} bg={lc.border} borderRadius="full" />
          <Text fontSize="9px" fontWeight="700" color="gray.500"
            textTransform="uppercase" letterSpacing="wide">
            {constGroup.constituencyName}
          </Text>
          <Box
            px={1.5} py={0.5} borderRadius="full"
            bg={lc.bg} fontSize="9px" fontWeight="700" color={lc.color}
          >
            {constGroup.entities.length}
          </Box>
        </HStack>
        <Box
          color="gray.400"
          transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
          transition="transform 0.2s"
        >
          <FiChevronDown fontSize="0.8rem" />
        </Box>
      </HStack>

      {isOpen && (
        <Box p={3}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
            {constGroup.entities.map((entity) => (
              <EntityCard key={entity.entityId} entity={entity} lc={lc} />
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
}

function EntityCard({
  entity,
  lc,
}: {
  entity: Entity;
  lc: { bg: string; color: string; border: string };
}) {
  const maxVotes = entity.candidates[0]?.streamVotes ?? 1;
  const entityTotal = entity.candidates.reduce((s, c) => s + c.streamVotes, 0);

  return (
    <Box
      borderRadius="xl" borderWidth="1px" borderColor="gray.100"
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.04)" overflow="hidden"
    >
      {/* Card header */}
      <Box px={4} py={2.5} bg="gray.50" borderBottomWidth="1px" borderBottomColor="gray.100">
        <HStack justify="space-between">
          <HStack gap={1.5}>
            <FiMapPin fontSize="0.7rem" color={lc.color} />
            <Text fontSize="xs" fontWeight="700" color="gray.800">
              {entity.entityName}
            </Text>
          </HStack>
          {entityTotal > 0 && (
            <Text fontSize="xs" color="gray.400" fontWeight="500">
              {entityTotal.toLocaleString()}
            </Text>
          )}
        </HStack>
      </Box>

      {/* Candidates */}
      <VStack gap={0} alignItems="stretch">
        {entity.candidates.map((candidate, idx) => {
          const pct = maxVotes > 0 ? (candidate.streamVotes / maxVotes) * 100 : 0;
          const isLeader = idx === 0 && candidate.streamVotes > 0;

          return (
            <Box
              key={candidate.id}
              px={4} py={2.5}
              bg={isLeader ? "#fafff0" : "white"}
              borderBottomWidth={idx < entity.candidates.length - 1 ? "1px" : "0"}
              borderBottomColor="gray.50"
            >
              <HStack justify="space-between" mb={1}>
                <HStack gap={1.5} minW={0}>
                  <Text
                    fontSize="xs" fontWeight={isLeader ? "700" : "500"} color="gray.900"
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {candidate.name}
                  </Text>
                  {candidate.party && (
                    <Text fontSize="2xs" color="gray.400" flexShrink={0}>
                      {candidate.party}
                    </Text>
                  )}
                </HStack>
                <HStack gap={1.5} flexShrink={0}>
                  <Text fontSize="xs" fontWeight="700" color={isLeader ? "#798217" : "gray.600"}>
                    {candidate.streamVotes.toLocaleString()}
                  </Text>
                  {entityTotal > 0 && (
                    <Text fontSize="2xs" color="gray.400" w="32px" textAlign="right">
                      {((candidate.streamVotes / entityTotal) * 100).toFixed(1)}%
                    </Text>
                  )}
                </HStack>
              </HStack>
              <Box h="3px" bg="gray.100" borderRadius="full" overflow="hidden">
                <Box
                  h="full" w={`${pct}%`}
                  bg={isLeader ? "#C9D927" : lc.border}
                  borderRadius="full" transition="width 0.4s ease"
                />
              </Box>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
