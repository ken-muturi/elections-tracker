"use client"

import { useState } from "react"
import { Box, Text, VStack, HStack, Input } from "@chakra-ui/react"
import {
  FiArrowLeft, FiSave, FiSend,
  FiAlertCircle, FiCheckCircle,
} from "react-icons/fi"
import { upsertStreamResult, submitStreamResult } from "@/services/StreamResults"
import useSyncMutation from "@/hooks/hooks/useSyncMutation"
import StatusBadge from "./StatusBadge"
import FormImageUpload from "./FormImageUpload"
import type { Position, StreamResult, StreamInfo, Candidate } from "./types"

type VoteEntryFormProps = {
  position: Position
  stream: StreamInfo
  existingResult?: StreamResult
  onBack: () => void
  /** Called after a successful save/submit so the parent can update its cache. */
  onSaved: (result: StreamResult, submitted: boolean) => void
}

export default function VoteEntryForm({
  position,
  stream,
  existingResult,
  onBack,
  onSaved,
}: VoteEntryFormProps) {
  const ps = stream.pollingStation
  const isSubmitted =
    existingResult?.status === "SUBMITTED" ||
    existingResult?.status === "VERIFIED"

  // Pre-fill votes from existing result or zeros
  const [votes, setVotes] = useState<Record<string, number>>(() => {
    if (existingResult) {
      const m: Record<string, number> = {}
      for (const v of existingResult.votes) m[v.candidateId] = v.votes
      return m
    }
    const m: Record<string, number> = {}
    for (const c of position.candidates) m[c.id] = 0
    return m
  })
  const [rejectedVotes, setRejectedVotes] = useState(
    existingResult?.rejectedVotes ?? 0,
  )
  const [notes, setNotes] = useState(existingResult?.notes ?? "")
  const [success, setSuccess] = useState("")

  const totalCandidateVotes = position.candidates.reduce(
    (s, c) => s + (votes[c.id] ?? 0),
    0,
  )
  const grandTotal = totalCandidateVotes + rejectedVotes

  const saveMutation = useSyncMutation(
    async ({ andSubmit }: { andSubmit: boolean }) => {
      const candidateVotes = position.candidates.map((c) => ({
        candidateId: c.id,
        votes: votes[c.id] ?? 0,
      }))

      const result = await upsertStreamResult(
        {
          streamId: stream.id,
          positionId: position.id,
          votes: candidateVotes,
          totalVotes: grandTotal,
          rejectedVotes,
          notes: notes || undefined,
        },
        andSubmit ? "SUBMITTED" : "DRAFT",
      )

      if (andSubmit && result) {
        await submitStreamResult(result.id)
      }

      return { result, andSubmit }
    },
    {
      onSuccess: ({ result, andSubmit }) => {
        if (result) {
          const saved: StreamResult = {
            id: result.id,
            streamId: stream.id,
            positionId: position.id,
            status: andSubmit ? "SUBMITTED" : "DRAFT",
            totalVotes: grandTotal,
            rejectedVotes,
            notes: notes || null,
            votes: result.votes.map((v) => ({
              candidateId: v.candidateId,
              votes: v.votes,
              candidate: v.candidate as Candidate,
            })),
            position,
          }
          onSaved(saved, andSubmit)
        }

        setSuccess(
          andSubmit
            ? "Results submitted successfully!"
            : "Draft saved successfully!",
        )
        if (andSubmit) {
          setTimeout(() => {
            onBack()
            setSuccess("")
          }, 1500)
        } else {
          setTimeout(() => setSuccess(""), 3000)
        }
      },
    },
  )

  const saveResult = (andSubmit: boolean) => {
    setSuccess("")
    saveMutation.mutate({ andSubmit })
  }

  return (
    <VStack gap={5} alignItems="stretch" maxW="640px">
      {/* Header */}
      <HStack gap={2}>
        <Box
          as="button"
          onClick={() => {
            saveMutation.reset()
            setSuccess("")
            onBack()
          }}
          cursor="pointer"
          _hover={{ color: "gray.900" }}
          color="gray.400"
          transition="color 0.15s"
        >
          <FiArrowLeft />
        </Box>
        <VStack alignItems="flex-start" gap={0}>
          <Text fontSize="sm" fontWeight="700" color="gray.900">
            {position.title}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {ps.name} — {stream.name}
          </Text>
        </VStack>
        {existingResult?.status && (
          <Box ml="auto">
            <StatusBadge status={existingResult.status} />
          </Box>
        )}
      </HStack>

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
        <HStack
          px={5}
          py={3}
          bg="#f8fafc"
          borderBottomWidth="1px"
          borderBottomColor="gray.100"
        >
          <Text
            fontSize="xs"
            fontWeight="700"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="wide"
            flex={1}
          >
            Candidate
          </Text>
          <Text
            fontSize="xs"
            fontWeight="700"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="wide"
            w="120px"
            textAlign="right"
          >
            Votes
          </Text>
        </HStack>

        {position.candidates.map((c, i) => (
          <HStack
            key={c.id}
            px={5}
            py={3.5}
            gap={3}
            borderBottomWidth={
              i < position.candidates.length - 1 ? "1px" : "0"
            }
            borderBottomColor="gray.50"
          >
            <VStack alignItems="flex-start" gap={0} flex={1}>
              <Text fontSize="sm" fontWeight="600" color="gray.900">
                {c.name}
              </Text>
              {c.party && (
                <Text fontSize="xs" color="gray.400">
                  {c.party}
                </Text>
              )}
            </VStack>
            <Input
              type="number"
              min={0}
              w="120px"
              textAlign="right"
              fontWeight="700"
              fontSize="md"
              value={votes[c.id] ?? 0}
              onChange={(e) =>
                setVotes((prev) => ({
                  ...prev,
                  [c.id]: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              disabled={isSubmitted}
              borderColor="gray.200"
              _hover={{ borderColor: "gray.300" }}
              _focus={{
                borderColor: "#0ea5e9",
                boxShadow: "0 0 0 1px #0ea5e9",
              }}
            />
          </HStack>
        ))}

        {/* Rejected votes */}
        <HStack
          px={5}
          py={3.5}
          bg="#fef7ed"
          borderTopWidth="1px"
          borderTopColor="gray.100"
        >
          <Text fontSize="sm" fontWeight="600" color="#92400e" flex={1}>
            Rejected Ballots
          </Text>
          <Input
            type="number"
            min={0}
            w="120px"
            textAlign="right"
            fontWeight="700"
            fontSize="md"
            value={rejectedVotes}
            onChange={(e) =>
              setRejectedVotes(Math.max(0, parseInt(e.target.value) || 0))
            }
            disabled={isSubmitted}
            borderColor="#fde68a"
            bg="white"
            _focus={{
              borderColor: "#f59e0b",
              boxShadow: "0 0 0 1px #f59e0b",
            }}
          />
        </HStack>

        {/* Total */}
        <HStack
          px={5}
          py={3}
          bg="#f1f5f9"
          borderTopWidth="1px"
          borderTopColor="gray.200"
        >
          <Text fontSize="sm" fontWeight="800" color="gray.700" flex={1}>
            TOTAL
          </Text>
          <Text
            fontSize="lg"
            fontWeight="800"
            color="gray.900"
            w="120px"
            textAlign="right"
          >
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
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitted}
          fontSize="sm"
          borderColor="gray.200"
        />
      </Box>

      {/* Form image upload */}
      <FormImageUpload
        positionId={position.id}
        positionType={position.type}
        level="POLLING_STATION"
        entityId={ps.id}
      />

      {/* Messages */}
      {saveMutation.error && (
        <Box px={4} py={3} bg="#fef2f2" borderRadius="lg">
          <HStack gap={1.5}>
            <FiAlertCircle fontSize="0.8rem" color="#dc2626" />
            <Text fontSize="sm" color="#dc2626">
              {saveMutation.error.message}
            </Text>
          </HStack>
        </Box>
      )}
      {success && (
        <Box px={4} py={3} bg="#d1fae5" borderRadius="lg">
          <HStack gap={1.5}>
            <FiCheckCircle fontSize="0.8rem" color="#065f46" />
            <Text fontSize="sm" color="#065f46" fontWeight="600">
              {success}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Actions */}
      {!isSubmitted && (
        <HStack gap={3} justify="flex-end">
          <Box
            as="button"
            onClick={() => saveResult(false)}
            px={5}
            py={2.5}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            fontSize="sm"
            fontWeight="600"
            color="gray.600"
            cursor="pointer"
            _hover={{ bg: "gray.50" }}
            transition="all 0.15s"
            opacity={saveMutation.isPending ? 0.6 : 1}
          >
            <HStack gap={1.5}>
              <FiSave fontSize="0.85rem" />
              <Text>Save Draft</Text>
            </HStack>
          </Box>

          <Box
            as="button"
            onClick={() => saveResult(true)}
            px={5}
            py={2.5}
            borderRadius="lg"
            bg="#0f172a"
            color="white"
            fontSize="sm"
            fontWeight="700"
            cursor="pointer"
            _hover={{ bg: "#1e293b" }}
            transition="all 0.15s"
            opacity={saveMutation.isPending ? 0.6 : 1}
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
