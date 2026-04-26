"use client"

import { Box, VStack, HStack, Text, Badge } from "@chakra-ui/react"
import type { ChildResult, CandidateVoteSummary } from "@/services/PublicResults"
import { getIEBCFormRef } from "../constants"

type ComparisonPanelProps = {
  aggregatedTotal: number
  aggregatedRejected: number
  aggregatedCandidates: CandidateVoteSummary[]
  enteredVotes: NonNullable<ChildResult["enteredVotes"]>
  positionType: string
  level: string
}

export default function ComparisonPanel({
  aggregatedTotal,
  aggregatedRejected,
  aggregatedCandidates,
  enteredVotes,
  positionType,
  level,
}: ComparisonPanelProps) {
  const enteredTotal = enteredVotes.totalVotes ?? 0
  const enteredRejected = enteredVotes.rejectedVotes ?? 0
  const diff = enteredTotal - aggregatedTotal
  const hasDiff = diff !== 0
  const formRef = getIEBCFormRef(positionType, level)

  const enteredMap = new Map(
    enteredVotes.candidates.map((c) => [c.candidateId, c.votes]),
  )

  return (
    <Box borderTopWidth="1px" borderTopColor="gray.200">
      <Box px={5} py={3} bg="blue.50" borderBottomWidth="1px" borderBottomColor="blue.100">
        <HStack justify="space-between">
          <HStack gap={2} align="baseline">
            <Badge
              px={2} py={0.5} borderRadius="md" fontSize="xs" fontWeight="800"
              bg="blue.100" color="blue.800" letterSpacing="wide"
            >
              {formRef.form}
            </Badge>
            <Text fontSize="xs" fontWeight="600" color="blue.700">
              {formRef.label}
            </Text>
          </HStack>
          <HStack gap={3}>
            <Text fontSize="xs" fontWeight="600" color="blue.600">
              {enteredTotal.toLocaleString()} votes
            </Text>
            {hasDiff && (
              <Badge
                px={1.5} py={0.5} borderRadius="md" fontSize="2xs" fontWeight="700"
                bg={diff > 0 ? "orange.100" : "red.100"}
                color={diff > 0 ? "orange.700" : "red.700"}
              >
                {diff > 0 ? "+" : ""}{diff.toLocaleString()} vs aggregated
              </Badge>
            )}
          </HStack>
        </HStack>
      </Box>

      <VStack gap={0} align="stretch">
        {aggregatedCandidates.slice(0, 5).map((cand) => {
          const enteredCandVotes = enteredMap.get(cand.candidateId) ?? 0
          const candDiff = enteredCandVotes - cand.votes
          return (
            <Box
              key={cand.candidateId} px={5} py={1.5}
              borderBottomWidth="1px" borderBottomColor="gray.50"
            >
              <HStack justify="space-between">
                <Text fontSize="xs" fontWeight="600" color="gray.700">
                  {cand.name}
                </Text>
                <HStack gap={3}>
                  <Text fontSize="xs" color="gray.500" minW="60px" textAlign="right">
                    Agg: {cand.votes.toLocaleString()}
                  </Text>
                  <Text fontSize="xs" fontWeight="600" color="blue.600" minW="60px" textAlign="right">
                    Ent: {enteredCandVotes.toLocaleString()}
                  </Text>
                  {candDiff !== 0 && (
                    <Text
                      fontSize="2xs" fontWeight="700" minW="40px" textAlign="right"
                      color={candDiff > 0 ? "orange.600" : "red.600"}
                    >
                      {candDiff > 0 ? "+" : ""}{candDiff.toLocaleString()}
                    </Text>
                  )}
                </HStack>
              </HStack>
            </Box>
          )
        })}
      </VStack>

      {(aggregatedRejected > 0 || enteredRejected > 0) && (
        <Box px={5} py={1.5} bg="gray.50">
          <HStack justify="space-between">
            <Text fontSize="xs" color="gray.500">Rejected</Text>
            <HStack gap={3}>
              <Text fontSize="xs" color="gray.500" minW="60px" textAlign="right">
                Agg: {aggregatedRejected.toLocaleString()}
              </Text>
              <Text fontSize="xs" fontWeight="600" color="blue.600" minW="60px" textAlign="right">
                Ent: {enteredRejected.toLocaleString()}
              </Text>
            </HStack>
          </HStack>
        </Box>
      )}
    </Box>
  )
}
