"use client"

import { useState, useTransition } from "react"
import {
  Box, Text, VStack, HStack, Flex, SimpleGrid, Input,
} from "@chakra-ui/react"
import {
  FiMapPin, FiChevronRight, FiCheck, FiClock, FiAlertCircle,
  FiCheckCircle, FiArrowLeft, FiSend, FiSave, FiX,
} from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import { upsertStreamResult, submitStreamResult } from "@/services/StreamResults"

/* ── Types ─────────────────────────────────────────────────────── */

type Candidate = {
  id: string
  name: string
  party: string | null
  sortOrder: number
}

type Position = {
  id: string
  type: string
  title: string
  aggregationLevel: string
  candidates: Candidate[]
}

type StreamResultVote = {
  candidateId: string
  votes: number
  candidate: Candidate
}

type StreamResult = {
  id: string
  streamId: string
  positionId: string
  status: string
  totalVotes: number | null
  rejectedVotes: number | null
  notes: string | null
  votes: StreamResultVote[]
  position: { id: string; type: string; title: string }
}

type Stream = {
  id: string
  stream: {
    id: string
    name: string
    code: string
    registeredVoters: number | null
    pollingStation: {
      id: string
      name: string
      code: string
      county: string
      constituency: string
      ward: string
      registeredVoters: number | null
    }
  }
}

type ElectionData = {
  election: {
    id: string
    title: string
    year: number
    electionDate: string
  }
  streams: Stream[]
  positions: Position[]
  streamResultsMap: Record<string, StreamResult[]>
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

/* ── Main component ────────────────────────────────────────────── */

export default function EnterResultsClient({
  electionData,
}: {
  electionData: ElectionData[]
}) {
  // Navigation state: election → stream → position
  const [selectedElection, setSelectedElection] = useState<string | null>(
    electionData.length === 1 ? electionData[0].election.id : null
  )
  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null)

  // Form state
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [rejectedVotes, setRejectedVotes] = useState(0)
  const [notes, setNotes] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Local results cache (updated after save)
  const [resultsCache, setResultsCache] = useState<Record<string, StreamResult[]>>(() => {
    const cache: Record<string, StreamResult[]> = {}
    for (const e of electionData) {
      for (const [streamId, results] of Object.entries(e.streamResultsMap)) {
        cache[streamId] = results
      }
    }
    return cache
  })

  const activeElection = electionData.find((e) => e.election.id === selectedElection)
  const activeStream = activeElection?.streams.find((s) => s.stream.id === selectedStream)
  const activePosition = activeElection?.positions.find((p) => p.id === selectedPosition)
  const streamResults = selectedStream ? (resultsCache[selectedStream] ?? []) : []

  /* ── Entering a position form ────────────────────────────── */

  const openPositionForm = (position: Position) => {
    setSelectedPosition(position.id)
    setError("")
    setSuccess("")

    // Prefill if existing result
    const existing = streamResults.find((r) => r.positionId === position.id)
    if (existing) {
      const voteMap: Record<string, number> = {}
      for (const v of existing.votes) {
        voteMap[v.candidateId] = v.votes
      }
      setVotes(voteMap)
      setRejectedVotes(existing.rejectedVotes ?? 0)
      setNotes(existing.notes ?? "")
    } else {
      const voteMap: Record<string, number> = {}
      for (const c of position.candidates) {
        voteMap[c.id] = 0
      }
      setVotes(voteMap)
      setRejectedVotes(0)
      setNotes("")
    }
  }

  const saveResult = (andSubmit: boolean) => {
    if (!selectedStream || !selectedPosition || !activePosition) return
    setError("")
    setSuccess("")

    const candidateVotes = activePosition.candidates.map((c) => ({
      candidateId: c.id,
      votes: votes[c.id] ?? 0,
    }))
    const totalVotes = candidateVotes.reduce((s, v) => s + v.votes, 0)

    startTransition(async () => {
      try {
        const result = await upsertStreamResult({
          streamId: selectedStream,
          positionId: selectedPosition,
          votes: candidateVotes,
          totalVotes: totalVotes + rejectedVotes,
          rejectedVotes,
          notes: notes || undefined,
        }, andSubmit ? "SUBMITTED" : "DRAFT")

        if (andSubmit && result) {
          await submitStreamResult(result.id)
        }

        // Update local cache
        setResultsCache((prev) => {
          const existing = prev[selectedStream] ?? []
          const filtered = existing.filter((r) => r.positionId !== selectedPosition)
          if (result) {
            filtered.push({
              id: result.id,
              streamId: selectedStream,
              positionId: selectedPosition,
              status: andSubmit ? "SUBMITTED" : "DRAFT",
              totalVotes: totalVotes + rejectedVotes,
              rejectedVotes,
              notes: notes || null,
              votes: result.votes.map((v) => ({
                candidateId: v.candidateId,
                votes: v.votes,
                candidate: v.candidate as Candidate,
              })),
              position: activePosition,
            })
          }
          return { ...prev, [selectedStream]: filtered }
        })

        setSuccess(andSubmit ? "Results submitted successfully!" : "Draft saved successfully!")
        if (andSubmit) {
          setTimeout(() => {
            setSelectedPosition(null)
            setSuccess("")
          }, 1500)
        } else {
          setTimeout(() => setSuccess(""), 3000)
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to save results.")
      }
    })
  }

  /* ── Step 1: Election selection ──────────────────────────── */

  if (!selectedElection) {
    return (
      <VStack gap={4} alignItems="stretch">
        <Text fontSize="sm" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wide">
          Select Election
        </Text>
        {electionData.map((e) => (
          <Box
            key={e.election.id}
            as="button"
            onClick={() => setSelectedElection(e.election.id)}
            bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
            boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" p={5} textAlign="left"
            _hover={{ borderColor: "#0ea5e9", boxShadow: "0 0 0 1px #0ea5e9" }}
            transition="all 0.15s" cursor="pointer"
          >
            <HStack justify="space-between">
              <VStack alignItems="flex-start" gap={1}>
                <Text fontWeight="700" fontSize="md" color="gray.900">{e.election.title}</Text>
                <Text fontSize="sm" color="gray.500">
                  {e.election.year} · {e.streams.length} stream{e.streams.length !== 1 ? "s" : ""} assigned
                </Text>
              </VStack>
              <FiChevronRight color="#94a3b8" />
            </HStack>
          </Box>
        ))}
      </VStack>
    )
  }

  /* ── Step 2: Stream selection ────────────────────────────── */

  if (!selectedStream && activeElection) {
    const streams = activeElection.streams
    return (
      <VStack gap={4} alignItems="stretch">
        <HStack gap={2}>
          <Box as="button" onClick={() => setSelectedElection(null)} cursor="pointer" _hover={{ color: "gray.900" }} color="gray.400" transition="color 0.15s">
            <FiArrowLeft />
          </Box>
          <VStack alignItems="flex-start" gap={0}>
            <Text fontSize="sm" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wide">
              {activeElection.election.title}
            </Text>
            <Text fontSize="xs" color="gray.400">Select a stream to enter results</Text>
          </VStack>
        </HStack>

        {streams.map((s) => {
          const ps = s.stream.pollingStation
          const results = resultsCache[s.stream.id] ?? []
          const totalPositions = activeElection.positions.length
          const completedPositions = results.filter(
            (r) => r.status === "SUBMITTED" || r.status === "VERIFIED"
          ).length

          return (
            <Box
              key={s.stream.id}
              as="button"
              onClick={() => setSelectedStream(s.stream.id)}
              bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
              boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" p={5} textAlign="left"
              _hover={{ borderColor: "#0ea5e9", boxShadow: "0 0 0 1px #0ea5e9" }}
              transition="all 0.15s" cursor="pointer"
            >
              <HStack justify="space-between" align="flex-start">
                <VStack alignItems="flex-start" gap={2}>
                  <VStack alignItems="flex-start" gap={0.5}>
                    <Text fontWeight="700" fontSize="md" color="gray.900">
                      {ps.name} — {s.stream.name}
                    </Text>
                    <HStack gap={1.5} flexWrap="wrap">
                      <HStack gap={1}>
                        <FiMapPin fontSize="0.7rem" color="#94a3b8" />
                        <Text fontSize="xs" color="gray.400">{ps.county}</Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.300">›</Text>
                      <Text fontSize="xs" color="gray.400">{ps.constituency}</Text>
                      <Text fontSize="xs" color="gray.300">›</Text>
                      <Text fontSize="xs" color="gray.400">{ps.ward}</Text>
                    </HStack>
                  </VStack>

                  {/* Progress */}
                  <HStack gap={3}>
                    <HStack gap={1}>
                      <FiCheck fontSize="0.75rem" color={completedPositions === totalPositions ? "#16a34a" : "#94a3b8"} />
                      <Text fontSize="xs" color={completedPositions === totalPositions ? "#16a34a" : "gray.500"} fontWeight="600">
                        {completedPositions}/{totalPositions} positions
                      </Text>
                    </HStack>
                    {s.stream.registeredVoters && (
                      <Text fontSize="xs" color="gray.400">
                        {s.stream.registeredVoters.toLocaleString()} voters
                      </Text>
                    )}
                  </HStack>
                </VStack>
                <FiChevronRight color="#94a3b8" />
              </HStack>
            </Box>
          )
        })}
      </VStack>
    )
  }

  /* ── Step 3: Position selection ──────────────────────────── */

  if (!selectedPosition && activeElection && activeStream) {
    const ps = activeStream.stream.pollingStation
    return (
      <VStack gap={4} alignItems="stretch">
        <HStack gap={2}>
          <Box as="button" onClick={() => setSelectedStream(null)} cursor="pointer" _hover={{ color: "gray.900" }} color="gray.400" transition="color 0.15s">
            <FiArrowLeft />
          </Box>
          <VStack alignItems="flex-start" gap={0}>
            <Text fontSize="sm" fontWeight="700" color="gray.900">
              {ps.name} — {activeStream.stream.name}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {ps.county} › {ps.constituency} › {ps.ward}
            </Text>
          </VStack>
        </HStack>

        <Text fontSize="sm" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wide">
          Select Position
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          {activeElection.positions.map((pos) => {
            const existing = streamResults.find((r) => r.positionId === pos.id)
            const status = existing?.status

            return (
              <Box
                key={pos.id}
                as="button"
                onClick={() => openPositionForm(pos)}
                bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
                boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" p={5} textAlign="left"
                _hover={{ borderColor: "#0ea5e9", boxShadow: "0 0 0 1px #0ea5e9" }}
                transition="all 0.15s" cursor="pointer"
              >
                <HStack justify="space-between" mb={2}>
                  <HStack gap={2}>
                    <Flex w={8} h={8} borderRadius="lg" bg="#f1f5f9" align="center" justify="center">
                      <MdHowToVote fontSize="1rem" color="#475569" />
                    </Flex>
                    <VStack alignItems="flex-start" gap={0}>
                      <Text fontWeight="700" fontSize="sm" color="gray.900">{pos.title}</Text>
                      <Text fontSize="xs" color="gray.400">{pos.candidates.length} candidate{pos.candidates.length !== 1 ? "s" : ""}</Text>
                    </VStack>
                  </HStack>
                  {status && <StatusBadge status={status} />}
                </HStack>

                {!status && (
                  <Text fontSize="xs" color="gray.400" fontStyle="italic">Not yet entered</Text>
                )}
              </Box>
            )
          })}
        </SimpleGrid>
      </VStack>
    )
  }

  /* ── Step 4: Vote entry form ─────────────────────────────── */

  if (activePosition && activeStream) {
    const ps = activeStream.stream.pollingStation
    const existing = streamResults.find((r) => r.positionId === activePosition.id)
    const isSubmitted = existing?.status === "SUBMITTED" || existing?.status === "VERIFIED"
    const totalCandidateVotes = activePosition.candidates.reduce((s, c) => s + (votes[c.id] ?? 0), 0)
    const grandTotal = totalCandidateVotes + rejectedVotes

    return (
      <VStack gap={5} alignItems="stretch" maxW="640px">
        {/* Header */}
        <HStack gap={2}>
          <Box as="button" onClick={() => { setSelectedPosition(null); setError(""); setSuccess("") }} cursor="pointer" _hover={{ color: "gray.900" }} color="gray.400" transition="color 0.15s">
            <FiArrowLeft />
          </Box>
          <VStack alignItems="flex-start" gap={0}>
            <Text fontSize="sm" fontWeight="700" color="gray.900">
              {activePosition.title}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {ps.name} — {activeStream.stream.name}
            </Text>
          </VStack>
          {existing?.status && (
            <Box ml="auto"><StatusBadge status={existing.status} /></Box>
          )}
        </HStack>

        {/* Candidates */}
        <Box bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden">
          {/* Heading */}
          <HStack px={5} py={3} bg="#f8fafc" borderBottomWidth="1px" borderBottomColor="gray.100">
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" flex={1}>
              Candidate
            </Text>
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="120px" textAlign="right">
              Votes
            </Text>
          </HStack>

          {activePosition.candidates.map((c, i) => (
            <HStack
              key={c.id}
              px={5} py={3.5} gap={3}
              borderBottomWidth={i < activePosition.candidates.length - 1 ? "1px" : "0"}
              borderBottomColor="gray.50"
            >
              <VStack alignItems="flex-start" gap={0} flex={1}>
                <Text fontSize="sm" fontWeight="600" color="gray.900">{c.name}</Text>
                {c.party && <Text fontSize="xs" color="gray.400">{c.party}</Text>}
              </VStack>
              <Input
                type="number"
                min={0}
                w="120px"
                textAlign="right"
                fontWeight="700"
                fontSize="md"
                value={votes[c.id] ?? 0}
                onChange={(e) => setVotes((prev) => ({ ...prev, [c.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                disabled={isSubmitted}
                borderColor="gray.200"
                _hover={{ borderColor: "gray.300" }}
                _focus={{ borderColor: "#0ea5e9", boxShadow: "0 0 0 1px #0ea5e9" }}
              />
            </HStack>
          ))}

          {/* Rejected votes */}
          <HStack px={5} py={3.5} bg="#fef7ed" borderTopWidth="1px" borderTopColor="gray.100">
            <Text fontSize="sm" fontWeight="600" color="#92400e" flex={1}>Rejected Ballots</Text>
            <Input
              type="number"
              min={0}
              w="120px"
              textAlign="right"
              fontWeight="700"
              fontSize="md"
              value={rejectedVotes}
              onChange={(e) => setRejectedVotes(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={isSubmitted}
              borderColor="#fde68a"
              bg="white"
              _focus={{ borderColor: "#f59e0b", boxShadow: "0 0 0 1px #f59e0b" }}
            />
          </HStack>

          {/* Total */}
          <HStack px={5} py={3} bg="#f1f5f9" borderTopWidth="1px" borderTopColor="gray.200">
            <Text fontSize="sm" fontWeight="800" color="gray.700" flex={1}>TOTAL</Text>
            <Text fontSize="lg" fontWeight="800" color="gray.900" w="120px" textAlign="right">
              {grandTotal.toLocaleString()}
            </Text>
          </HStack>
        </Box>

        {/* Notes */}
        <Box>
          <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1.5}>Notes (optional)</Text>
          <Input
            placeholder="Any observations or notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitted}
            fontSize="sm"
            borderColor="gray.200"
          />
        </Box>

        {/* Messages */}
        {error && (
          <Box px={4} py={3} bg="#fef2f2" borderRadius="lg">
            <HStack gap={1.5}>
              <FiAlertCircle fontSize="0.8rem" color="#dc2626" />
              <Text fontSize="sm" color="#dc2626">{error}</Text>
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
              onClick={() => saveResult(false)}
              px={5} py={2.5} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
              fontSize="sm" fontWeight="600" color="gray.600" cursor="pointer"
              _hover={{ bg: "gray.50" }} transition="all 0.15s"
              opacity={isPending ? 0.6 : 1}
            >
              <HStack gap={1.5}>
                <FiSave fontSize="0.85rem" />
                <Text>Save Draft</Text>
              </HStack>
            </Box>

            <Box
              as="button"
              onClick={() => saveResult(true)}
              px={5} py={2.5} borderRadius="lg" bg="#0f172a" color="white"
              fontSize="sm" fontWeight="700" cursor="pointer"
              _hover={{ bg: "#1e293b" }} transition="all 0.15s"
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
      </VStack>
    )
  }

  return null
}
