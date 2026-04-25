"use client";

import { Box, VStack, HStack, Text } from "@chakra-ui/react"
import Link from "next/link"
import { FiMapPin, FiBarChart2 } from "react-icons/fi"
import type { Entity, LcColors } from "./types"

export default function EntityCard({
  entity,
  lc,
  exploreHref,
}: {
  entity: Entity;
  lc: LcColors;
  exploreHref?: string;
}) {
  const maxVotes = entity.candidates[0]?.streamVotes ?? 1;
  const entityTotal = entity.candidates.reduce((s, c) => s + c.streamVotes, 0);

  return (
    <Box
      borderRadius="xl" borderWidth="1px" borderColor="gray.100"
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.04)" overflow="hidden"
    >
      <Box px={4} py={2.5} bg="gray.50" borderBottomWidth="1px" borderBottomColor="gray.100">
        <HStack justify="space-between">
          <HStack gap={1.5} minW={0}>
            <FiMapPin fontSize="0.7rem" color={lc.color} style={{ flexShrink: 0 }} />
            <Text fontSize="xs" fontWeight="700" color="gray.800"
              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {entity.entityName}
            </Text>
          </HStack>
          <HStack gap={2} flexShrink={0}>
            {entityTotal > 0 && (
              <Text fontSize="xs" color="gray.400" fontWeight="500">
                {entityTotal.toLocaleString()}
              </Text>
            )}
            {exploreHref && (
              <Link href={exploreHref}>
                <HStack
                  gap={1} px={2} py={0.5} borderRadius="full"
                  bg="#eff9d1" color="#798217" fontSize="9px" fontWeight="700"
                  _hover={{ bg: "#e4f0b8" }} transition="background 0.15s" cursor="pointer"
                >
                  <FiBarChart2 fontSize="0.65rem" />
                  <Text>Explore</Text>
                </HStack>
              </Link>
            )}
          </HStack>
        </HStack>
      </Box>

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
