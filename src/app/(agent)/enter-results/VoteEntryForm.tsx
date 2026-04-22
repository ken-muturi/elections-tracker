"use client"

import { useState } from "react"
import { Box, Text, VStack, HStack } from "@chakra-ui/react"
import { FiArrowLeft } from "react-icons/fi"
import { upsertStreamResult } from "@/services/StreamResults"
import useSyncMutation from "@/hooks/hooks/useSyncMutation"
import StatusBadge from "./StatusBadge"
import FormImageUpload from "./FormImageUpload"
import VoteTable from "./VoteTable"
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

      <VoteTable
        candidates={position.candidates}
        votes={votes}
        onVoteChange={(id, val) => setVotes((prev) => ({ ...prev, [id]: val }))}
        rejectedVotes={rejectedVotes}
        onRejectedVotesChange={setRejectedVotes}
        notes={notes}
        onNotesChange={setNotes}
        isSubmitted={isSubmitted}
        grandTotal={grandTotal}
        error={saveMutation.error}
        success={success}
        isPending={saveMutation.isPending}
        onSaveDraft={() => saveResult(false)}
        onSubmit={() => saveResult(true)}
        formImageUpload={
          <FormImageUpload
            positionId={position.id}
            positionType={position.type}
            level="POLLING_STATION"
            entityId={ps.id}
          />
        }
      />
    </VStack>
  )
}
