"use client"

import { useState } from "react";
import { Box, VStack, HStack, Text, Badge } from "@chakra-ui/react"
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
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

  const hasCandDiff = aggregatedCandidates.some(
    (c) => (enteredMap.get(c.candidateId) ?? 0) !== c.votes,
  );
  const hasAnyDiff = hasDiff || hasCandDiff;

  // Auto-expand when there are discrepancies, collapse by default when all match
  const [open, setOpen] = useState(hasAnyDiff);

  return (
    <Box borderTopWidth="1px" borderTopColor="gray.200">
      {/* ── Collapsed / header row ── */}
      <HStack
        as="button"
        w="full"
        px={5}
        py={2}
        bg="blue.50"
        justify="space-between"
        cursor="pointer"
        onClick={() => setOpen((o) => !o)}
        _hover={{ bg: "blue.100" }}
        transition="background 0.15s"
      >
        <HStack gap={2} align="center">
          <Badge
            px={1.5}
            py={0.5}
            borderRadius="md"
            fontSize="2xs"
            fontWeight="800"
            bg="blue.100"
            color="blue.800"
            letterSpacing="wide"
          >
            {formRef.form}
          </Badge>
          <Text fontSize="xs" fontWeight="600" color="blue.700">
            {formRef.label}
          </Text>
          {hasDiff && (
            <Badge
              px={1.5}
              py={0.5}
              borderRadius="md"
              fontSize="2xs"
              fontWeight="700"
              bg={diff > 0 ? "orange.100" : "red.100"}
              color={diff > 0 ? "orange.700" : "red.700"}
            >
              {diff > 0 ? "+" : ""}
              {diff.toLocaleString()} vs agg
            </Badge>
          )}
        </HStack>
        <HStack gap={2} flexShrink={0}>
          <Text fontSize="xs" fontWeight="600" color="blue.600">
            {enteredTotal.toLocaleString()} votes
          </Text>
          {open ? (
            <FiChevronUp
              fontSize="0.75rem"
              color="var(--chakra-colors-blue-500)"
            />
          ) : (
            <FiChevronDown
              fontSize="0.75rem"
              color="var(--chakra-colors-blue-500)"
            />
          )}
        </HStack>
      </HStack>

      {/* ── Expanded rows ── */}
      {open && (
        <>
          <VStack gap={0} align="stretch">
            {aggregatedCandidates.slice(0, 5).map((cand) => {
              const enteredCandVotes = enteredMap.get(cand.candidateId) ?? 0;
              const candDiff = enteredCandVotes - cand.votes;
              return (
                <Box
                  key={cand.candidateId}
                  px={5}
                  py={1}
                  borderBottomWidth="1px"
                  borderBottomColor="gray.50"
                >
                  <HStack justify="space-between">
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.700"
                      flex={1}
                      truncate
                    >
                      {cand.name}
                    </Text>
                    <HStack gap={3} flexShrink={0}>
                      <Text
                        fontSize="xs"
                        color="gray.400"
                        minW="60px"
                        textAlign="right"
                      >
                        Agg: {cand.votes.toLocaleString()}
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="600"
                        color="blue.600"
                        minW="60px"
                        textAlign="right"
                      >
                        Ent: {enteredCandVotes.toLocaleString()}
                      </Text>
                      {candDiff !== 0 && (
                        <Text
                          fontSize="2xs"
                          fontWeight="700"
                          minW="40px"
                          textAlign="right"
                          color={candDiff > 0 ? "orange.600" : "red.600"}
                        >
                          {candDiff > 0 ? "+" : ""}
                          {candDiff.toLocaleString()}
                        </Text>
                      )}
                    </HStack>
                  </HStack>
                </Box>
              );
            })}
          </VStack>

          {(aggregatedRejected > 0 || enteredRejected > 0) && (
            <Box px={5} py={1} bg="gray.50">
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">
                  Rejected
                </Text>
                <HStack gap={3}>
                  <Text
                    fontSize="xs"
                    color="gray.400"
                    minW="60px"
                    textAlign="right"
                  >
                    Agg: {aggregatedRejected.toLocaleString()}
                  </Text>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="blue.600"
                    minW="60px"
                    textAlign="right"
                  >
                    Ent: {enteredRejected.toLocaleString()}
                  </Text>
                </HStack>
              </HStack>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
