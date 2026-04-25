"use client"

import { useState } from "react"
import {
  Box, Heading, Text, VStack, HStack, Input, Flex, Badge,
} from "@chakra-ui/react"
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from "react-icons/fi"
import { MdOutlineHowToVote } from "react-icons/md"
import { createParty, updateParty, deleteParty, type Party } from "@/services/Parties"
import useSyncMutation from "@/hooks/hooks/useSyncMutation"

interface Props {
  initialParties: Party[]
}

export default function PartiesManager({ initialParties }: Props) {
  const [parties, setParties] = useState<Party[]>(initialParties)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editAbbr, setEditAbbr] = useState("")
  const [newName, setNewName] = useState("")
  const [newAbbr, setNewAbbr] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState("")

  // ── Mutations ───────────────────────────────────────────────────────────────

  const addMutation = useSyncMutation(
    async (data: { name: string; abbreviation?: string }) =>
      createParty(data.name, data.abbreviation),
    {
      onSuccess: (created) => {
        setParties((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
        setNewName("")
        setNewAbbr("")
        setShowAdd(false)
        setError("")
      },
      onError: (e: Error) => setError(e.message),
    },
  )

  const editMutation = useSyncMutation(
    async (data: { id: string; name: string; abbreviation?: string }) =>
      updateParty(data.id, data.name, data.abbreviation),
    {
      onSuccess: (updated) => {
        setParties((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)).sort((a, b) => a.name.localeCompare(b.name)),
        )
        setEditingId(null)
        setError("")
      },
      onError: (e: Error) => setError(e.message),
    },
  )

  const removeMutation = useSyncMutation(
    async (id: string) => { await deleteParty(id); return id },
    {
      onSuccess: (id) => {
        setParties((prev) => prev.filter((p) => p.id !== id))
        setError("")
      },
      onError: (e: Error) => setError(e.message),
    },
  )

  const isPending = addMutation.isPending || editMutation.isPending || removeMutation.isPending

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!newName.trim()) { setError("Party name is required."); return }
    setError("")
    addMutation.mutate({ name: newName.trim(), abbreviation: newAbbr.trim() || undefined })
  }

  const startEdit = (party: Party) => {
    setEditingId(party.id)
    setEditName(party.name)
    setEditAbbr(party.abbreviation ?? "")
    setError("")
  }

  const saveEdit = () => {
    if (!editName.trim()) { setError("Party name is required."); return }
    setError("")
    editMutation.mutate({ id: editingId!, name: editName.trim(), abbreviation: editAbbr.trim() || undefined })
  }

  const cancelEdit = () => { setEditingId(null); setError("") }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Header */}
      <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
        <VStack alignItems="flex-start" gap={0.5}>
          <Heading fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} color="gray.900" lineHeight="1.2">
            Political Parties
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Manage parties used when registering candidates and users.
          </Text>
        </VStack>
        {!showAdd && (
          <Box
            as="button"
            onClick={() => { setShowAdd(true); setError("") }}
            display="inline-flex"
            alignItems="center"
            gap={1.5}
            px={4}
            py={2}
            bg="#798217"
            color="white"
            borderRadius="lg"
            fontSize="sm"
            fontWeight="600"
            cursor="pointer"
            _hover={{ bg: "#6a7314" }}
            transition="background 0.15s"
            aria-disabled={isPending} pointerEvents={isPending ? "none" : "auto"}
          >
            <FiPlus />
            <Text>Add Party</Text>
          </Box>
        )}
      </HStack>

      {/* Error */}
      {error && (
        <Box px={4} py={2} bg="#fef2f2" borderRadius="lg" borderWidth="1px" borderColor="#fecaca">
          <Text fontSize="sm" color="#dc2626">{error}</Text>
        </Box>
      )}

      {/* Add form */}
      {showAdd && (
        <Box
          bg="white"
          borderRadius="xl"
          p={5}
          borderWidth="1px"
          borderColor="#798217"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        >
          <Text fontWeight="700" fontSize="sm" color="gray.700" mb={3}>New Party</Text>
          <HStack gap={3} flexWrap={{ base: "wrap", md: "nowrap" }}>
            <Input
              placeholder="Full name, e.g. Jubilee Party"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              size="sm"
              borderRadius="lg"
              flex={2}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Input
              placeholder="Abbreviation, e.g. JP"
              value={newAbbr}
              onChange={(e) => setNewAbbr(e.target.value)}
              size="sm"
              borderRadius="lg"
              flex={1}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <HStack gap={2}>
              <Box
                as="button"
                onClick={handleAdd}
                display="inline-flex"
                alignItems="center"
                gap={1}
                px={3}
                py={1.5}
                bg="#798217"
                color="white"
                borderRadius="md"
                fontSize="sm"
                fontWeight="600"
                cursor="pointer"
                _hover={{ bg: "#6a7314" }}
                aria-disabled={isPending} pointerEvents={isPending ? "none" : "auto"}
              >
                <FiCheck />
                <Text>Save</Text>
              </Box>
              <Box
                as="button"
                onClick={() => { setShowAdd(false); setNewName(""); setNewAbbr(""); setError("") }}
                display="inline-flex"
                alignItems="center"
                gap={1}
                px={3}
                py={1.5}
                bg="gray.100"
                color="gray.600"
                borderRadius="md"
                fontSize="sm"
                fontWeight="600"
                cursor="pointer"
                _hover={{ bg: "gray.200" }}
                aria-disabled={isPending} pointerEvents={isPending ? "none" : "auto"}
              >
                <FiX />
                <Text>Cancel</Text>
              </Box>
            </HStack>
          </HStack>
        </Box>
      )}

      {/* List */}
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.100"
        boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        overflow="hidden"
      >
        {parties.length === 0 ? (
          <Box p={12} textAlign="center">
            <Flex w={16} h={16} borderRadius="2xl" bg="#eff9d1" align="center" justify="center" mx="auto" mb={4}>
              <MdOutlineHowToVote fontSize="2rem" color="#798217" />
            </Flex>
            <Text fontWeight="700" fontSize="lg" color="gray.700" mb={1}>No parties yet</Text>
            <Text fontSize="sm" color="gray.400">Add the first party above.</Text>
          </Box>
        ) : (
          <VStack gap={0} alignItems="stretch" divideY="1px">
            {parties.map((party) => (
              <Box key={party.id} px={5} py={3.5} _hover={{ bg: "#f8fafc" }} transition="background 0.15s">
                {editingId === party.id ? (
                  <HStack gap={3} flexWrap={{ base: "wrap", md: "nowrap" }}>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      size="sm"
                      borderRadius="lg"
                      flex={2}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit() }}
                    />
                    <Input
                      value={editAbbr}
                      onChange={(e) => setEditAbbr(e.target.value)}
                      size="sm"
                      borderRadius="lg"
                      flex={1}
                      placeholder="Abbreviation"
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit() }}
                    />
                    <HStack gap={2}>
                      <Box
                        as="button"
                        onClick={saveEdit}
                        p={1.5}
                        borderRadius="md"
                        color="#065f46"
                        bg="#d1fae5"
                        cursor="pointer"
                        _hover={{ bg: "#a7f3d0" }}
                        aria-disabled={isPending} pointerEvents={isPending ? "none" : "auto"}
                      >
                        <FiCheck />
                      </Box>
                      <Box
                        as="button"
                        onClick={cancelEdit}
                        p={1.5}
                        borderRadius="md"
                        color="gray.500"
                        bg="gray.100"
                        cursor="pointer"
                        _hover={{ bg: "gray.200" }}
                      >
                        <FiX />
                      </Box>
                    </HStack>
                  </HStack>
                ) : (
                  <HStack justify="space-between">
                    <HStack gap={3}>
                      <Flex
                        w={8}
                        h={8}
                        borderRadius="lg"
                        bg="#eff9d1"
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        <MdOutlineHowToVote fontSize="1rem" color="#798217" />
                      </Flex>
                      <VStack gap={0} alignItems="flex-start">
                        <Text fontSize="sm" fontWeight="600" color="gray.900">{party.name}</Text>
                        {party.abbreviation && (
                          <Badge px={1.5} py={0} borderRadius="full" bg="#eff9d1" color="#798217" fontSize="xs" fontWeight="700">
                            {party.abbreviation}
                          </Badge>
                        )}
                      </VStack>
                    </HStack>
                    <HStack gap={1}>
                      <Box
                        as="button"
                        onClick={() => startEdit(party)}
                        p={1.5}
                        borderRadius="md"
                        color="gray.400"
                        cursor="pointer"
                        _hover={{ color: "gray.700", bg: "gray.100" }}
                        aria-disabled={isPending} pointerEvents={isPending ? "none" : "auto"}
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </Box>
                      <Box
                        as="button"
                        onClick={() => removeMutation.mutate(party.id)}
                        p={1.5}
                        borderRadius="md"
                        color="gray.400"
                        cursor="pointer"
                        _hover={{ color: "#dc2626", bg: "#fef2f2" }}
                        aria-disabled={isPending} pointerEvents={isPending ? "none" : "auto"}
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </Box>
                    </HStack>
                  </HStack>
                )}
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  )
}
