"use client"

import {
  Box, Text, VStack, HStack, Flex,
} from "@chakra-ui/react"
import {
  FiMapPin, FiClock, FiSend, FiCheckCircle, FiAlertCircle, FiX, FiChevronDown, FiChevronUp,
} from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import { useState } from "react"

/* ── Types ─────────────────────────────────────────────────────── */

type CandidateVote = {
  candidateId: string
  votes: number
  candidate: { id: string; name: string; party: string | null }
}

type Result = {
  id: string
  streamId: string
  positionId: string
  status: string
  totalVotes: number | null
  rejectedVotes: number | null
  notes: string | null
  submittedAt: string
  stream: {
    id: string
    name: string
    code: string
    pollingStation: {
      name: string
      code: string
      county: string
      constituency: string
      ward: string
    }
  }
  position: { type: string; title: string }
  votes: CandidateVote[]
}

type ElectionResult = {
  election: {
    id: string
    title: string
    year: number
    electionDate: string
  }
  results: Result[]
}

/* ── Status helpers ────────────────────────────────────────────── */

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
  DRAFT: { bg: "#fef3c7", color: "#92400e", icon: <FiClock fontSize="0.7rem" />, label: "Draft" },
  SUBMITTED: { bg: "#dbeafe", color: "#1e40af", icon: <FiSend fontSize="0.7rem" />, label: "Submitted" },
  VERIFIED: { bg: "#d1fae5", color: "#065f46", icon: <FiCheckCircle fontSize="0.7rem" />, label: "Verified" },
  DISPUTED: { bg: "#fef2f2", color: "#dc2626", icon: <FiAlertCircle fontSize="0.7rem" />, label: "Disputed" },
  REJECTED: { bg: "#fef2f2", color: "#991b1b", icon: <FiX fontSize="0.7rem" />, label: "Rejected" },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
  return (
    <HStack gap={1} px={2} py={0.5} borderRadius="full" bg={s.bg}>
      {s.icon}
      <Text fontSize="10px" fontWeight="700" color={s.color}>{s.label}</Text>
    </HStack>
  )
}

/* ── Expandable result card ────────────────────────────────────── */

function ResultCard({ result }: { result: Result }) {
  const [expanded, setExpanded] = useState(false)
  const ps = result.stream.pollingStation
  const date = new Date(result.submittedAt)

  return (
    <Box
      bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden"
    >
      {/* Card header — clickable */}
      <Box
        as="button" onClick={() => setExpanded(!expanded)}
        w="full" px={5} py={4} textAlign="left" cursor="pointer"
        _hover={{ bg: "#fafbfc" }} transition="background 0.1s"
      >
        <HStack justify="space-between" align="flex-start">
          <VStack alignItems="flex-start" gap={2} flex={1}>
            <HStack gap={2} flexWrap="wrap">
              <Flex w={7} h={7} borderRadius="lg" bg="#f1f5f9" align="center" justify="center" flexShrink={0}>
                <MdHowToVote fontSize="0.9rem" color="#475569" />
              </Flex>
              <VStack alignItems="flex-start" gap={0}>
                <Text fontWeight="700" fontSize="sm" color="gray.900">{result.position.title}</Text>
                <Text fontSize="xs" color="gray.400">
                  {ps.name} — {result.stream.name}
                </Text>
              </VStack>
            </HStack>

            <HStack gap={1.5} flexWrap="wrap">
              <HStack gap={1}>
                <FiMapPin fontSize="0.65rem" color="#94a3b8" />
                <Text fontSize="xs" color="gray.400">{ps.county} › {ps.constituency} › {ps.ward}</Text>
              </HStack>
              <Text fontSize="xs" color="gray.300">·</Text>
              <Text fontSize="xs" color="gray.400">
                {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </HStack>
          </VStack>

          <HStack gap={2}>
            <StatusBadge status={result.status} />
            {expanded ? <FiChevronUp color="#94a3b8" /> : <FiChevronDown color="#94a3b8" />}
          </HStack>
        </HStack>
      </Box>

      {/* Expanded vote details */}
      {expanded && (
        <Box borderTopWidth="1px" borderTopColor="gray.100">
          {/* Column headers */}
          <HStack px={5} py={2} bg="#f8fafc" borderBottomWidth="1px" borderBottomColor="gray.100">
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" flex={1}>
              Candidate
            </Text>
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="100px" textAlign="right">
              Votes
            </Text>
          </HStack>

          {result.votes
            .sort((a, b) => b.votes - a.votes)
            .map((v, i) => (
              <HStack
                key={v.candidateId}
                px={5} py={2.5}
                borderBottomWidth={i < result.votes.length - 1 ? "1px" : "0"}
                borderBottomColor="gray.50"
              >
                <VStack alignItems="flex-start" gap={0} flex={1}>
                  <Text fontSize="sm" fontWeight="600" color="gray.900">{v.candidate.name}</Text>
                  {v.candidate.party && <Text fontSize="xs" color="gray.400">{v.candidate.party}</Text>}
                </VStack>
                <Text fontSize="md" fontWeight="700" color="gray.900" w="100px" textAlign="right">
                  {v.votes.toLocaleString()}
                </Text>
              </HStack>
            ))}

          {/* Rejected + Total */}
          {(result.rejectedVotes ?? 0) > 0 && (
            <HStack px={5} py={2.5} bg="#fef7ed" borderTopWidth="1px" borderTopColor="gray.100">
              <Text fontSize="sm" fontWeight="600" color="#92400e" flex={1}>Rejected Ballots</Text>
              <Text fontSize="md" fontWeight="700" color="#92400e" w="100px" textAlign="right">
                {(result.rejectedVotes ?? 0).toLocaleString()}
              </Text>
            </HStack>
          )}

          <HStack px={5} py={2.5} bg="#f1f5f9" borderTopWidth="1px" borderTopColor="gray.200">
            <Text fontSize="sm" fontWeight="800" color="gray.700" flex={1}>TOTAL</Text>
            <Text fontSize="md" fontWeight="800" color="gray.900" w="100px" textAlign="right">
              {(result.totalVotes ?? 0).toLocaleString()}
            </Text>
          </HStack>

          {result.notes && (
            <Box px={5} py={2.5} bg="#f8fafc" borderTopWidth="1px" borderTopColor="gray.100">
              <Text fontSize="xs" color="gray.500"><strong>Notes:</strong> {result.notes}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

/* ── Main component ────────────────────────────────────────────── */

export default function MyResultsClient({
  electionResults,
}: {
  electionResults: ElectionResult[]
}) {
  return (
    <VStack gap={6} alignItems="stretch">
      {electionResults.map((er) => {
        const submitted = er.results.filter((r) => r.status === "SUBMITTED" || r.status === "VERIFIED").length
        const drafts = er.results.filter((r) => r.status === "DRAFT").length
        const disputed = er.results.filter((r) => r.status === "DISPUTED" || r.status === "REJECTED").length

        return (
          <VStack key={er.election.id} gap={4} alignItems="stretch">
            {/* Election header */}
            <VStack alignItems="flex-start" gap={1}>
              <Text fontWeight="700" fontSize="lg" color="gray.900">{er.election.title}</Text>
              <HStack gap={3} flexWrap="wrap">
                <HStack gap={1}>
                  <FiCheckCircle fontSize="0.75rem" color="#16a34a" />
                  <Text fontSize="xs" color="gray.500">{submitted} submitted</Text>
                </HStack>
                {drafts > 0 && (
                  <HStack gap={1}>
                    <FiClock fontSize="0.75rem" color="#d97706" />
                    <Text fontSize="xs" color="gray.500">{drafts} draft{drafts !== 1 ? "s" : ""}</Text>
                  </HStack>
                )}
                {disputed > 0 && (
                  <HStack gap={1}>
                    <FiAlertCircle fontSize="0.75rem" color="#dc2626" />
                    <Text fontSize="xs" color="gray.500">{disputed} disputed</Text>
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
