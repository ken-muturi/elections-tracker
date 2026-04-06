"use client"

import {
  Box, Text, VStack, HStack, Flex, Input,
} from "@chakra-ui/react"
import { useState, useTransition } from "react"
import { createCandidate, deleteCandidate, updateCandidate } from "@/services/Elections"
import type { Candidate } from "@prisma/client"
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX } from "react-icons/fi"

type Props = {
  positionId: string
  positionType: string
  aggregationLevel: string
  initialCandidates: Candidate[]
}

const ENTITY_LABEL: Record<string, string> = {
  WARD: "Ward ID",
  CONSTITUENCY: "Constituency ID",
  COUNTY: "County ID",
  NATIONAL: "",
}

export default function CandidateManager({
  positionId,
  positionType,
  aggregationLevel,
  initialCandidates,
}: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState("")

  // Add form state
  const [addName, setAddName] = useState("")
  const [addParty, setAddParty] = useState("")
  const [addEntityId, setAddEntityId] = useState("")

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editParty, setEditParty] = useState("")
  const [editEntityId, setEditEntityId] = useState("")

  const needsEntityId = aggregationLevel !== "NATIONAL"

  const handleAdd = () => {
    if (!addName.trim()) { setError("Name is required."); return }
    if (needsEntityId && !addEntityId.trim()) { setError(`${ENTITY_LABEL[aggregationLevel]} is required.`); return }
    setError("")
    startTransition(async () => {
      try {
        const created = await createCandidate({
          positionId,
          name: addName.trim(),
          party: addParty.trim() || undefined,
          entityId: needsEntityId ? addEntityId.trim() : undefined,
          sortOrder: candidates.length,
        })
        setCandidates((prev) => [...prev, created])
        setAddName(""); setAddParty(""); setAddEntityId("")
        setShowAdd(false)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to add candidate.")
      }
    })
  }

  const startEdit = (c: Candidate) => {
    setEditId(c.id)
    setEditName(c.name)
    setEditParty(c.party ?? "")
    setEditEntityId(c.entityId ?? "")
  }

  const handleEdit = (id: string) => {
    if (!editName.trim()) { setError("Name is required."); return }
    setError("")
    startTransition(async () => {
      try {
        const updated = await updateCandidate(id, {
          name: editName.trim(),
          party: editParty.trim() || undefined,
          entityId: needsEntityId ? editEntityId.trim() || undefined : undefined,
        })
        setCandidates((prev) => prev.map((c) => (c.id === id ? updated : c)))
        setEditId(null)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to update candidate.")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteCandidate(id)
        setCandidates((prev) => prev.filter((c) => c.id !== id))
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to delete candidate.")
      }
    })
  }

  return (
    <Box>
      {/* Candidate list */}
      <VStack gap={0} alignItems="stretch">
        {candidates.map((candidate, idx) => (
          <Box key={candidate.id}
            px={6} py={3.5}
            borderBottomWidth="1px" borderBottomColor="gray.50"
            bg={editId === candidate.id ? "#fafff0" : "white"}>

            {editId === candidate.id ? (
              // Edit row
              <VStack gap={3} alignItems="stretch">
                <HStack gap={3} flexWrap="wrap">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Full name"
                    size="sm" bg="white" borderColor="gray.200" borderRadius="lg" flex={1}
                    _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                  />
                  <Input
                    value={editParty}
                    onChange={(e) => setEditParty(e.target.value)}
                    placeholder="Party / Independent"
                    size="sm" bg="white" borderColor="gray.200" borderRadius="lg" w="160px"
                    _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                  />
                  {needsEntityId && (
                    <Input
                      value={editEntityId}
                      onChange={(e) => setEditEntityId(e.target.value)}
                      placeholder={ENTITY_LABEL[aggregationLevel]}
                      size="sm" bg="white" borderColor="gray.200" borderRadius="lg" w="160px"
                      _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                    />
                  )}
                </HStack>
                <HStack gap={2}>
                  <Box
                    as="button" onClick={() => handleEdit(candidate.id)}
                    px={3} py={1.5} borderRadius="lg" bg="#C9D927" color="#0f172a"
                    fontSize="xs" fontWeight="700" cursor="pointer"
                    _hover={{ bg: "#b5c220" }} transition="all 0.15s"
                    opacity={isPending ? 0.6 : 1}
                  >
                    <HStack gap={1}><FiCheck /><Text>Save</Text></HStack>
                  </Box>
                  <Box
                    as="button" onClick={() => setEditId(null)}
                    px={3} py={1.5} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
                    fontSize="xs" fontWeight="600" color="gray.500" cursor="pointer"
                    _hover={{ bg: "gray.50" }} transition="all 0.15s"
                  >
                    <HStack gap={1}><FiX /><Text>Cancel</Text></HStack>
                  </Box>
                </HStack>
              </VStack>
            ) : (
              // Display row
              <HStack justify="space-between" gap={2}>
                <HStack gap={3} minW={0}>
                  <Flex
                    w={7} h={7} borderRadius="full" bg="gray.100"
                    align="center" justify="center" flexShrink={0}
                    fontSize="xs" fontWeight="700" color="gray.500"
                  >
                    {idx + 1}
                  </Flex>
                  <VStack alignItems="flex-start" gap={0} minW={0}>
                    <Text fontSize="sm" fontWeight="600" color="gray.900"
                      style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {candidate.name}
                    </Text>
                    <HStack gap={2}>
                      {candidate.party && (
                        <Text fontSize="xs" color="gray.400">{candidate.party}</Text>
                      )}
                      {candidate.entityId && (
                        <Text fontSize="xs" color="gray.300">· {candidate.entityId}</Text>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
                <HStack gap={1} flexShrink={0}>
                  <Box
                    as="button" onClick={() => startEdit(candidate)}
                    w={7} h={7} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
                    display="flex" alignItems="center" justifyContent="center"
                    color="gray.400" cursor="pointer"
                    _hover={{ borderColor: "gray.300", color: "gray.600" }} transition="all 0.15s"
                  >
                    <FiEdit2 fontSize="0.75rem" />
                  </Box>
                  <Box
                    as="button" onClick={() => handleDelete(candidate.id)}
                    w={7} h={7} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
                    display="flex" alignItems="center" justifyContent="center"
                    color="gray.400" cursor="pointer"
                    _hover={{ borderColor: "#fca5a5", color: "#ef4444" }} transition="all 0.15s"
                    opacity={isPending ? 0.5 : 1}
                  >
                    <FiTrash2 fontSize="0.75rem" />
                  </Box>
                </HStack>
              </HStack>
            )}
          </Box>
        ))}

        {candidates.length === 0 && !showAdd && (
          <Box px={6} py={5} textAlign="center">
            <Text fontSize="sm" color="gray.400">No candidates yet. Add the first one below.</Text>
          </Box>
        )}

        {/* Add form */}
        {showAdd && (
          <Box px={6} py={4} bg="#fafff0" borderTopWidth="1px" borderTopColor="gray.100">
            <VStack gap={3} alignItems="stretch">
              <HStack gap={3} flexWrap="wrap">
                <Input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Full name *"
                  size="sm" bg="white" borderColor="gray.200" borderRadius="lg" flex={1}
                  _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  autoFocus
                />
                <Input
                  value={addParty}
                  onChange={(e) => setAddParty(e.target.value)}
                  placeholder="Party / Independent"
                  size="sm" bg="white" borderColor="gray.200" borderRadius="lg" w="160px"
                  _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                {needsEntityId && (
                  <Input
                    value={addEntityId}
                    onChange={(e) => setAddEntityId(e.target.value)}
                    placeholder={`${ENTITY_LABEL[aggregationLevel]} *`}
                    size="sm" bg="white" borderColor="gray.200" borderRadius="lg" w="160px"
                    _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  />
                )}
              </HStack>
              <HStack gap={2}>
                <Box
                  as="button" onClick={handleAdd}
                  px={3} py={1.5} borderRadius="lg" bg="#C9D927" color="#0f172a"
                  fontSize="xs" fontWeight="700" cursor="pointer"
                  _hover={{ bg: "#b5c220" }} transition="all 0.15s"
                  opacity={isPending ? 0.6 : 1}
                >
                  <HStack gap={1}><FiCheck /><Text>Add Candidate</Text></HStack>
                </Box>
                <Box
                  as="button" onClick={() => { setShowAdd(false); setAddName(""); setAddParty(""); setAddEntityId(""); setError("") }}
                  px={3} py={1.5} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
                  fontSize="xs" fontWeight="600" color="gray.500" cursor="pointer"
                  _hover={{ bg: "gray.50" }} transition="all 0.15s"
                >
                  Cancel
                </Box>
              </HStack>
            </VStack>
          </Box>
        )}
      </VStack>

      {/* Error */}
      {error && (
        <Box px={6} py={2} bg="#fef2f2">
          <Text fontSize="xs" color="#dc2626">{error}</Text>
        </Box>
      )}

      {/* Footer add button */}
      {!showAdd && (
        <Box px={6} py={3} borderTopWidth="1px" borderTopColor="gray.50">
          <Box
            as="button"
            onClick={() => { setShowAdd(true); setError("") }}
            display="inline-flex" alignItems="center" gap={1.5}
            fontSize="xs" fontWeight="600" color="gray.500" cursor="pointer"
            _hover={{ color: "gray.800" }} transition="color 0.15s"
          >
            <FiPlus />
            <Text>Add candidate</Text>
          </Box>
        </Box>
      )}
    </Box>
  )
}
