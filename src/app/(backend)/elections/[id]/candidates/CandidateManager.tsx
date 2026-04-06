"use client"

import { useState } from "react"
import { Box, Text, VStack, HStack } from "@chakra-ui/react"
import {
  FiPlus, FiUpload, FiCheckCircle,
} from "react-icons/fi"
import { createCandidate, updateCandidate, deleteCandidate } from "@/services/Elections"
import type { Candidate } from "@prisma/client"
import useSyncMutation from "@/hooks/hooks/useSyncMutation"
import CandidateRow from "./CandidateRow"
import AddCandidateForm from "./AddCandidateForm"
import CsvImportDialog from "./CsvImportDialog"
import type { CandidateManagerProps } from "./types"

export default function CandidateManager({
  positionId,
  aggregationLevel,
  initialCandidates,
}: CandidateManagerProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
  const [showAdd, setShowAdd] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)
  const [importCount, setImportCount] = useState(0)

  const needsEntityId = aggregationLevel !== "NATIONAL"

  /* ── Mutations ─────────────────────────────────────────── */

  const addMutation = useSyncMutation(
    async (data: { name: string; party?: string; entityId?: string }) => {
      return createCandidate({
        positionId,
        name: data.name,
        party: data.party,
        entityId: data.entityId,
        sortOrder: candidates.length,
      })
    },
    {
      onSuccess: (created) => {
        setCandidates((prev) => [...prev, created])
        setShowAdd(false)
      },
    },
  )

  const editMutation = useSyncMutation(
    async ({ id, data }: { id: string; data: { name: string; party?: string; entityId?: string } }) => {
      return updateCandidate(id, {
        name: data.name,
        party: data.party,
        entityId: needsEntityId ? data.entityId : undefined,
      })
    },
    {
      onSuccess: (updated) => {
        setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      },
    },
  )

  const deleteMutation = useSyncMutation(
    async (id: string) => {
      await deleteCandidate(id)
      return id
    },
    {
      onSuccess: (id) => {
        setCandidates((prev) => prev.filter((c) => c.id !== id))
      },
    },
  )

  /* ── Handlers ──────────────────────────────────────────── */

  const handleAdd = (data: { name: string; party?: string; entityId?: string }) => {
    if (!data.name) return
    if (needsEntityId && !data.entityId) return
    addMutation.mutate(data)
  }

  const handleEdit = (
    id: string,
    data: { name: string; party?: string; entityId?: string },
  ) => {
    if (!data.name) return
    editMutation.mutate({ id, data })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleCsvImported = (created: Candidate[]) => {
    setCandidates((prev) => [...prev, ...created])
    setImportCount(created.length)
    setTimeout(() => setImportCount(0), 5000)
  }

  const isPending = addMutation.isPending || editMutation.isPending || deleteMutation.isPending
  const error = addMutation.error?.message || editMutation.error?.message || deleteMutation.error?.message || ""

  /* ── Render ────────────────────────────────────────────── */

  return (
    <Box>
      {/* Candidate list */}
      <VStack gap={0} alignItems="stretch">
        {candidates.map((candidate, idx) => (
          <CandidateRow
            key={candidate.id}
            candidate={candidate}
            index={idx}
            needsEntityId={needsEntityId}
            aggregationLevel={aggregationLevel}
            isPending={isPending}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        {candidates.length === 0 && !showAdd && (
          <Box px={6} py={5} textAlign="center">
            <Text fontSize="sm" color="gray.400">
              No candidates yet. Add the first one below.
            </Text>
          </Box>
        )}

        {showAdd && (
          <AddCandidateForm
            aggregationLevel={aggregationLevel}
            needsEntityId={needsEntityId}
            isPending={isPending}
            onAdd={handleAdd}
            onCancel={() => {
              setShowAdd(false)
              addMutation.reset()
            }}
          />
        )}
      </VStack>

      {/* Success message */}
      {importCount > 0 && (
        <Box px={6} py={2} bg="#d1fae5">
          <HStack gap={1.5}>
            <FiCheckCircle fontSize="0.8rem" color="#065f46" />
            <Text fontSize="xs" fontWeight="600" color="#065f46">
              Successfully imported {importCount} candidate
              {importCount !== 1 ? "s" : ""}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Box px={6} py={2} bg="#fef2f2">
          <Text fontSize="xs" color="#dc2626">
            {error}
          </Text>
        </Box>
      )}

      {/* Footer buttons */}
      {!showAdd && (
        <Box px={6} py={3} borderTopWidth="1px" borderTopColor="gray.50">
          <HStack gap={4}>
            <Box
              as="button"
              onClick={() => {
                setShowAdd(true)
                addMutation.reset()
              }}
              display="inline-flex"
              alignItems="center"
              gap={1.5}
              fontSize="xs"
              fontWeight="600"
              color="gray.500"
              cursor="pointer"
              _hover={{ color: "gray.800" }}
              transition="color 0.15s"
            >
              <FiPlus />
              <Text>Add candidate</Text>
            </Box>

            <Box w="1px" h={4} bg="gray.200" />

            <Box
              as="button"
              onClick={() => setCsvOpen(true)}
              display="inline-flex"
              alignItems="center"
              gap={1.5}
              fontSize="xs"
              fontWeight="600"
              color="gray.500"
              cursor="pointer"
              _hover={{ color: "#0369a1" }}
              transition="color 0.15s"
            >
              <FiUpload />
              <Text>Import CSV</Text>
            </Box>
          </HStack>
        </Box>
      )}

      {/* CSV Import Dialog */}
      <CsvImportDialog
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        positionId={positionId}
        aggregationLevel={aggregationLevel}
        needsEntityId={needsEntityId}
        existingCount={candidates.length}
        onImported={handleCsvImported}
      />
    </Box>
  )
}
