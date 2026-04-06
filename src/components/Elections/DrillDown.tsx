"use client"

import React, { useState } from "react"
import {
  Box, VStack, HStack, Text, Heading, SimpleGrid, Flex, Badge,
} from "@chakra-ui/react"
import { FiChevronRight, FiMapPin } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import type { DrillDownResult } from "@/services/PublicResults"
import { LEVEL_COLOR, NEXT_ACTION } from "./constants"
import useSyncMutation from "@/hooks/hooks/useSyncMutation"

export default function DrillDown({
  initial,
  electionId,
}: {
  initial: DrillDownResult
  electionId: string
}) {
  const [data, setData] = useState<DrillDownResult>(initial)
  const [history, setHistory] = useState<DrillDownResult[]>([])

  const drillMutation = useSyncMutation(
    async (childId: string) => {
      const nextAction = NEXT_ACTION[data.level]
      if (!nextAction) throw new Error("Already at leaf level")
      const qs = new URLSearchParams({
        action: nextAction,
        id: childId,
        positionId: data.positionId,
        electionId,
      })
      const res = await fetch(`/api/public-results?${qs}`)
      return res.json() as Promise<DrillDownResult>
    },
    {
      onSuccess: (json) => {
        setHistory((prev) => [...prev, data])
        setData(json)
      },
    },
  )

  /** Navigate deeper into a child entity. */
  const drill = (childId: string) => {
    if (!NEXT_ACTION[data.level]) return
    drillMutation.mutate(childId)
  }

  /** Navigate up via breadcrumb. */
  const goBack = (idx: number) => {
    if (idx >= history.length) return
    setData(history[idx])
    setHistory((prev) => prev.slice(0, idx))
  }

  const canDrill = !!NEXT_ACTION[data.level]
  const lc = LEVEL_COLOR[data.level] ?? LEVEL_COLOR.NATIONAL

  return (
    <VStack gap={5} align="stretch">
      {/* ── Breadcrumb ──────────────────────────────────── */}
      <HStack gap={1} flexWrap="wrap">
        {history.map((h, idx) => (
          <HStack key={h.level + idx} gap={1}>
            <Text
              as="button"
              fontSize="sm"
              color="blue.600"
              fontWeight="600"
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
              onClick={() => goBack(idx)}
            >
              {h.parentName ?? "National"}
            </Text>
            <FiChevronRight fontSize="0.75rem" color="#9ca3af" />
          </HStack>
        ))}
        <Text fontSize="sm" fontWeight="700" color="gray.800">
          {data.parentName ?? "National"}
        </Text>
      </HStack>

      {/* ── Header ──────────────────────────────────────── */}
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        <HStack gap={3}>
          <Flex
            w={10} h={10} borderRadius="lg" bg={lc.bg}
            align="center" justify="center" flexShrink={0}
          >
            <MdHowToVote fontSize="1.2rem" color={lc.color} />
          </Flex>
          <VStack align="flex-start" gap={0}>
            <Heading fontSize="lg" fontWeight="800" color="gray.900">
              {data.positionTitle}
            </Heading>
            <Text fontSize="xs" color="gray.500">
              Showing {data.levelLabel.toLowerCase()} ·{" "}
              {data.reportedStreams}/{data.totalStreams} streams reported
            </Text>
          </VStack>
        </HStack>
        <Badge
          px={2.5} py={1} borderRadius="full" bg={lc.bg} color={lc.color}
          fontSize="9px" fontWeight="700" textTransform="uppercase"
          letterSpacing="wide"
        >
          {data.levelLabel}
        </Badge>
      </HStack>

      {/* ── Overall leaders ─────────────────────────────── */}
      <Box
        bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100"
        boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden"
      >
        <Box px={5} py={3} bg="gray.50" borderBottomWidth="1px" borderBottomColor="gray.100">
          <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="wide">
            Overall Totals — {data.totalVotes.toLocaleString()} votes
          </Text>
        </Box>
        <VStack gap={0} align="stretch">
          {data.candidates.slice(0, 5).map((cand, idx) => {
            const pct = data.totalVotes > 0 ? (cand.votes / data.totalVotes) * 100 : 0
            const isLeader = idx === 0 && cand.votes > 0
            return (
              <Box
                key={cand.candidateId} px={5} py={2.5}
                bg={isLeader ? "#fafff0" : "white"}
                borderBottomWidth="1px" borderBottomColor="gray.50"
              >
                <HStack gap={3}>
                  <Flex
                    w={6} h={6} borderRadius="full" flexShrink={0}
                    align="center" justify="center"
                    bg={isLeader ? "#C9D927" : "gray.100"}
                    fontSize="xs" fontWeight="800"
                    color={isLeader ? "#0f172a" : "gray.500"}
                  >
                    {idx + 1}
                  </Flex>
                  <Box flex={1}>
                    <HStack justify="space-between" mb={0.5}>
                      <HStack gap={2}>
                        <Text fontSize="sm" fontWeight={isLeader ? "700" : "600"} color="gray.900">
                          {cand.name}
                        </Text>
                        {cand.party && (
                          <Text fontSize="xs" color="gray.400">{cand.party}</Text>
                        )}
                      </HStack>
                      <HStack gap={2} flexShrink={0}>
                        <Text fontSize="sm" fontWeight="700" color={isLeader ? "#798217" : "gray.700"}>
                          {cand.votes.toLocaleString()}
                        </Text>
                        <Text fontSize="xs" color="gray.400" w="36px" textAlign="right">
                          {pct.toFixed(1)}%
                        </Text>
                      </HStack>
                    </HStack>
                    <Box h="4px" bg="gray.100" borderRadius="full" overflow="hidden">
                      <Box
                        h="full" w={`${pct}%`}
                        bg={isLeader ? "#C9D927" : lc.border}
                        borderRadius="full" transition="width 0.4s ease"
                      />
                    </Box>
                  </Box>
                </HStack>
              </Box>
            )
          })}
        </VStack>
      </Box>

      {/* ── Children cards ──────────────────────────────── */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {data.children.map((child) => {
          const maxVotes = child.candidates[0]?.votes ?? 1
          const childTotal = child.candidates.reduce((s, c) => s + c.votes, 0)

          return (
            <Box
              key={child.entityId}
              bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100"
              boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden"
              cursor={canDrill ? "pointer" : "default"}
              _hover={canDrill ? { borderColor: lc.border, boxShadow: `0 0 0 1px ${lc.border}` } : {}}
              transition="all 0.15s"
              onClick={canDrill ? () => drill(child.entityId) : undefined}
              opacity={drillMutation.isPending ? 0.6 : 1}
            >
              {/* Child header */}
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

              {/* Candidates */}
              <VStack gap={0} align="stretch">
                {child.candidates.slice(0, 4).map((cand, idx) => {
                  const pct = maxVotes > 0 ? (cand.votes / maxVotes) * 100 : 0
                  const isLeader = idx === 0 && cand.votes > 0
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
                          <Text fontSize="xs" fontWeight="700" color={isLeader ? "#798217" : "gray.600"}>
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
                          bg={isLeader ? "#C9D927" : lc.border}
                          borderRadius="full" transition="width 0.4s ease"
                        />
                      </Box>
                    </Box>
                  )
                })}
              </VStack>

              {/* Footer */}
              <Box px={5} py={2} borderTopWidth="1px" borderTopColor="gray.100">
                <Text fontSize="xs" fontWeight="600" color="gray.500">
                  {childTotal.toLocaleString()} total votes
                </Text>
              </Box>
            </Box>
          )
        })}
      </SimpleGrid>

      {data.rejectedVotes > 0 && (
        <Box px={5} py={3} bg="#fef9f0" borderRadius="xl" borderWidth="1px" borderColor="#fef3c7">
          <Text fontSize="xs" color="#92400e">
            {data.rejectedVotes.toLocaleString()} rejected votes not counted above
          </Text>
        </Box>
      )}
    </VStack>
  )
}
