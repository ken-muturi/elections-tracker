"use client"

import { Text, VStack, HStack } from "@chakra-ui/react"
import { FiClock, FiCheckCircle, FiAlertCircle } from "react-icons/fi"
import ResultCard from "./ResultCard"
import type { ElectionResult } from "./types"

export default function MyResultsClient({
  electionResults,
}: {
  electionResults: ElectionResult[]
}) {
  return (
    <VStack gap={6} alignItems="stretch">
      {electionResults.map((er) => {
        const submitted = er.results.filter(
          (r) => r.status === "SUBMITTED" || r.status === "VERIFIED",
        ).length
        const drafts = er.results.filter(
          (r) => r.status === "DRAFT",
        ).length
        const disputed = er.results.filter(
          (r) => r.status === "DISPUTED" || r.status === "REJECTED",
        ).length

        return (
          <VStack key={er.election.id} gap={4} alignItems="stretch">
            {/* Election header */}
            <VStack alignItems="flex-start" gap={1}>
              <Text fontWeight="700" fontSize="lg" color="gray.900">
                {er.election.title}
              </Text>
              <HStack gap={3} flexWrap="wrap">
                <HStack gap={1}>
                  <FiCheckCircle fontSize="0.75rem" color="#16a34a" />
                  <Text fontSize="xs" color="gray.500">
                    {submitted} submitted
                  </Text>
                </HStack>
                {drafts > 0 && (
                  <HStack gap={1}>
                    <FiClock fontSize="0.75rem" color="#d97706" />
                    <Text fontSize="xs" color="gray.500">
                      {drafts} draft{drafts !== 1 ? "s" : ""}
                    </Text>
                  </HStack>
                )}
                {disputed > 0 && (
                  <HStack gap={1}>
                    <FiAlertCircle fontSize="0.75rem" color="#dc2626" />
                    <Text fontSize="xs" color="gray.500">
                      {disputed} disputed
                    </Text>
                  </HStack>
                )}
              </HStack>
            </VStack>

            {/* Result cards */}
            <VStack gap={3} alignItems="stretch">
              {er.results.map((r) => (
                <ResultCard key={r.id} result={r} />
              ))}
            </VStack>
          </VStack>
        )
      })}
    </VStack>
  )
}
