"use client"

import { Box, Text, VStack, HStack, Input } from "@chakra-ui/react"
import {
  FiSave, FiSend, FiAlertCircle, FiCheckCircle,
} from "react-icons/fi"
import type { Candidate } from "./types"

/* ── Types ──────────────────────────────────────────────────── */

export type AggregateInfo = {
  streamCount: number
  totalVotes: number
  rejectedVotes: number
  candidateTotals: Map<string, number>
}

export type VoteTableProps = {
  candidates: Candidate[]
  votes: Record<string, number>
  onVoteChange: (candidateId: string, value: number) => void
  rejectedVotes: number
  onRejectedVotesChange: (value: number) => void
  notes: string
  onNotesChange: (value: string) => void
  isSubmitted: boolean
  grandTotal: number
  error?: Error | null
  success: string
  isPending: boolean
  onSaveDraft: () => void
  onSubmit: () => void
  /** Slot for <FormImageUpload /> — each caller passes its own props */
  formImageUpload?: React.ReactNode
  /** Optional aggregate comparison column (used in level entry) */
  aggregate?: AggregateInfo
  /** Column header for the votes input column (default: "Votes") */
  votesColumnLabel?: string
}

/* ── Component ─────────────────────────────────────────────── */

export default function VoteTable({
  candidates,
  votes,
  onVoteChange,
  rejectedVotes,
  onRejectedVotesChange,
  notes,
  onNotesChange,
  isSubmitted,
  grandTotal,
  error,
  success,
  isPending,
  onSaveDraft,
  onSubmit,
  formImageUpload,
  aggregate,
  votesColumnLabel = "Votes",
}: VoteTableProps) {
  const showAggregate = aggregate && aggregate.streamCount > 0

  return (
    <>
      {/* Aggregate comparison banner (level entry only) */}
      {showAggregate && (
        <Box bg="#f0f9ff" borderRadius="xl" p={4} borderWidth="1px" borderColor="#bae6fd">
          <Text fontSize="xs" fontWeight="700" color="#0369a1" mb={2}>
            System Aggregate ({aggregate.streamCount} stream{aggregate.streamCount !== 1 ? "s" : ""})
          </Text>
          <HStack gap={6} flexWrap="wrap">
            <VStack gap={0} alignItems="flex-start">
              <Text fontSize="2xs" color="#0284c7">Total Votes</Text>
              <Text fontSize="md" fontWeight="800" color="#0c4a6e">
                {aggregate.totalVotes.toLocaleString()}
              </Text>
            </VStack>
            <VStack gap={0} alignItems="flex-start">
              <Text fontSize="2xs" color="#0284c7">Rejected</Text>
              <Text fontSize="md" fontWeight="800" color="#0c4a6e">
                {aggregate.rejectedVotes.toLocaleString()}
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}

      {/* Candidates table */}
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.100"
        boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        overflow="hidden"
      >
        {/* Heading */}
        <HStack px={5} py={3} bg="#f8fafc" borderBottomWidth="1px" borderBottomColor="gray.100">
          <Text
            fontSize="xs" fontWeight="700" color="gray.500"
            textTransform="uppercase" letterSpacing="wide" flex={1}
          >
            Candidate
          </Text>
          {showAggregate && (
            <Text
              fontSize="xs" fontWeight="700" color="#0284c7"
              textTransform="uppercase" letterSpacing="wide" w="90px" textAlign="right"
            >
              Aggregated
            </Text>
          )}
          <Text
            fontSize="xs" fontWeight="700" color="gray.500"
            textTransform="uppercase" letterSpacing="wide" w="120px" textAlign="right"
          >
            {votesColumnLabel}
          </Text>
        </HStack>

        {candidates.map((c, i) => {
          const aggVotes = showAggregate ? aggregate.candidateTotals.get(c.id) : undefined
          const enteredVotes = votes[c.id] ?? 0
          const mismatch = aggVotes != null && enteredVotes > 0 && enteredVotes !== aggVotes

          return (
            <HStack
              key={c.id} px={5} py={3.5} gap={3}
              borderBottomWidth={i < candidates.length - 1 ? "1px" : "0"}
              borderBottomColor="gray.50"
              bg={mismatch ? "#fffbeb" : undefined}
            >
              <VStack alignItems="flex-start" gap={0} flex={1}>
                <Text fontSize="sm" fontWeight="600" color="gray.900">{c.name}</Text>
                {c.party && <Text fontSize="xs" color="gray.400">{c.party}</Text>}
              </VStack>
              {showAggregate && (
                <Text fontSize="sm" fontWeight="600" color="#0284c7" w="90px" textAlign="right">
                  {aggVotes != null ? aggVotes.toLocaleString() : "—"}
                </Text>
              )}
              <Input
                type="number" min={0} w="120px" textAlign="right"
                fontWeight="700" fontSize="md"
                value={votes[c.id] ?? 0}
                onChange={(e) =>
                  onVoteChange(c.id, Math.max(0, parseInt(e.target.value) || 0))
                }
                disabled={isSubmitted}
                borderColor={mismatch ? "#f59e0b" : "gray.200"}
                _hover={{ borderColor: mismatch ? "#d97706" : "gray.300" }}
                _focus={{
                  borderColor: mismatch ? "#f59e0b" : "#0ea5e9",
                  boxShadow: `0 0 0 1px ${mismatch ? "#f59e0b" : "#0ea5e9"}`,
                }}
              />
            </HStack>
          )
        })}

        {/* Rejected votes */}
        <HStack px={5} py={3.5} bg="#fef7ed" borderTopWidth="1px" borderTopColor="gray.100">
          <Text fontSize="sm" fontWeight="600" color="#92400e" flex={1}>
            Rejected Ballots
          </Text>
          {showAggregate && (
            <Text fontSize="sm" fontWeight="600" color="#0284c7" w="90px" textAlign="right">
              {aggregate.rejectedVotes.toLocaleString()}
            </Text>
          )}
          <Input
            type="number" min={0} w="120px" textAlign="right"
            fontWeight="700" fontSize="md" value={rejectedVotes}
            onChange={(e) =>
              onRejectedVotesChange(Math.max(0, parseInt(e.target.value) || 0))
            }
            disabled={isSubmitted}
            borderColor="#fde68a" bg="white"
            _focus={{ borderColor: "#f59e0b", boxShadow: "0 0 0 1px #f59e0b" }}
          />
        </HStack>

        {/* Total */}
        <HStack px={5} py={3} bg="#f1f5f9" borderTopWidth="1px" borderTopColor="gray.200">
          <Text fontSize="sm" fontWeight="800" color="gray.700" flex={1}>TOTAL</Text>
          {showAggregate && (
            <Text fontSize="md" fontWeight="800" color="#0284c7" w="90px" textAlign="right">
              {aggregate.totalVotes.toLocaleString()}
            </Text>
          )}
          <Text fontSize="lg" fontWeight="800" color="gray.900" w="120px" textAlign="right">
            {grandTotal.toLocaleString()}
          </Text>
        </HStack>
      </Box>

      {/* Notes */}
      <Box>
        <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1.5}>
          Notes (optional)
        </Text>
        <Input
          placeholder="Any observations or notes…"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={isSubmitted}
          fontSize="sm"
          borderColor="gray.200"
        />
      </Box>

      {/* Form image upload slot */}
      {formImageUpload}

      {/* Messages */}
      {error && (
        <Box px={4} py={3} bg="#fef2f2" borderRadius="lg">
          <HStack gap={1.5}>
            <FiAlertCircle fontSize="0.8rem" color="#dc2626" />
            <Text fontSize="sm" color="#dc2626">{error.message}</Text>
          </HStack>
        </Box>
      )}
      {success && (
        <Box px={4} py={3} bg="#d1fae5" borderRadius="lg">
          <HStack gap={1.5}>
            <FiCheckCircle fontSize="0.8rem" color="#065f46" />
            <Text fontSize="sm" color="#065f46" fontWeight="600">{success}</Text>
          </HStack>
        </Box>
      )}

      {/* Actions */}
      {!isSubmitted && (
        <HStack gap={3} justify="flex-end">
          <Box
            as="button"
            onClick={onSaveDraft}
            px={5} py={2.5} borderRadius="lg"
            borderWidth="1px" borderColor="gray.200"
            fontSize="sm" fontWeight="600" color="gray.600"
            cursor="pointer"
            _hover={{ bg: "gray.50" }}
            transition="all 0.15s"
            opacity={isPending ? 0.6 : 1}
          >
            <HStack gap={1.5}>
              <FiSave fontSize="0.85rem" />
              <Text>Save Draft</Text>
            </HStack>
          </Box>
          <Box
            as="button"
            onClick={onSubmit}
            px={5} py={2.5} borderRadius="lg"
            bg="#0f172a" color="white"
            fontSize="sm" fontWeight="700"
            cursor="pointer"
            _hover={{ bg: "#1e293b" }}
            transition="all 0.15s"
            opacity={isPending ? 0.6 : 1}
          >
            <HStack gap={1.5}>
              <FiSend fontSize="0.85rem" />
              <Text>Submit Results</Text>
            </HStack>
          </Box>
        </HStack>
      )}

      {isSubmitted && (
        <Box px={4} py={3} bg="#dbeafe" borderRadius="lg">
          <HStack gap={1.5}>
            <FiCheckCircle fontSize="0.8rem" color="#1e40af" />
            <Text fontSize="sm" color="#1e40af" fontWeight="600">
              These results have been submitted and cannot be edited.
            </Text>
          </HStack>
        </Box>
      )}
    </>
  )
}
