"use client"

import { Box, VStack, HStack, Text } from "@chakra-ui/react"
import { FiChevronRight, FiMapPin, FiAlertTriangle } from "react-icons/fi"
import type { ChildResult } from "@/services/PublicResults"

type LcColors = { bg: string; color: string; border: string }

export default function ChildCard({
  child,
  canDrill,
  lc,
  colorMap,
  onDrill,
}: {
  child: ChildResult
  canDrill: boolean
  lc: LcColors
  colorMap: Map<string, string>
  onDrill: (id: string) => void
}) {
  const maxVotes = child.candidates[0]?.votes ?? 1
  const childTotal = child.candidates.reduce((s, c) => s + c.votes, 0)

  return (
    <Box
      bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100"
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden"
      cursor={canDrill ? "pointer" : "default"}
      _hover={canDrill ? { borderColor: lc.border, boxShadow: `0 0 0 1px ${lc.border}` } : {}}
      transition="all 0.15s"
      onClick={canDrill ? () => onDrill(child.entityId) : undefined}
    >
      <Box px={5} py={3} bg="gray.50" borderBottomWidth="1px" borderBottomColor="gray.100">
        <HStack justify="space-between">
          <HStack gap={2}>
            <FiMapPin fontSize="0.8rem" color={lc.color} />
            <Text fontSize="sm" fontWeight="700" color="gray.800">
              {child.entityName}
            </Text>
          </HStack>
          <HStack gap={2}>
            <Text fontSize="xs" color="gray.400">
              {child.reportedStreams}/{child.totalStreams} streams
            </Text>
            {canDrill && <FiChevronRight fontSize="0.9rem" color={lc.color} />}
          </HStack>
        </HStack>
      </Box>

      <VStack gap={0} align="stretch">
        {child.candidates.slice(0, 4).map((cand, idx) => {
          const pct = maxVotes > 0 ? (cand.votes / maxVotes) * 100 : 0
          const isLeader = idx === 0 && cand.votes > 0
          const candColor = colorMap.get(cand.candidateId) ?? lc.border
          return (
            <Box
              key={cand.candidateId} px={5} py={2}
              bg={isLeader ? "#fafff0" : "white"}
              borderBottomWidth="1px" borderBottomColor="gray.50"
            >
              <HStack justify="space-between" mb={0.5}>
                <HStack gap={2}>
                  <Text fontSize="xs" fontWeight={isLeader ? "700" : "500"} color="gray.800">
                    {cand.name}
                  </Text>
                  {cand.party && (
                    <Text fontSize="2xs" color="gray.400">{cand.party}</Text>
                  )}
                </HStack>
                <HStack gap={2} flexShrink={0}>
                  <Text fontSize="xs" fontWeight="700" color="gray.700">
                    {cand.votes.toLocaleString()}
                  </Text>
                  {childTotal > 0 && (
                    <Text fontSize="2xs" color="gray.400" w="32px" textAlign="right">
                      {((cand.votes / childTotal) * 100).toFixed(1)}%
                    </Text>
                  )}
                </HStack>
              </HStack>
              <Box h="3px" bg="gray.100" borderRadius="full" overflow="hidden">
                <Box
                  h="full" w={`${pct}%`}
                  bg={candColor}
                  borderRadius="full" transition="width 0.4s ease"
                />
              </Box>
            </Box>
          )
        })}
      </VStack>

      <Box px={5} py={2} borderTopWidth="1px" borderTopColor="gray.100">
        <HStack justify="space-between">
          <Text fontSize="xs" fontWeight="600" color="gray.500">
            {childTotal.toLocaleString()} aggregated votes
          </Text>
          {child.enteredVotes && (
            <HStack gap={1.5}>
              <Text fontSize="xs" fontWeight="600" color="blue.600">
                Entered: {(child.enteredVotes.totalVotes ?? 0).toLocaleString()}
              </Text>
              {child.enteredVotes.totalVotes !== null &&
                child.enteredVotes.totalVotes !== childTotal && (
                  <FiAlertTriangle fontSize="0.7rem" color="#d97706" />
                )}
            </HStack>
          )}
        </HStack>
      </Box>
    </Box>
  )
}
