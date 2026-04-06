"use client"

import { useState } from "react"
import { Box, Text, VStack, HStack, Flex, Input } from "@chakra-ui/react"
import { FiEdit2, FiTrash2, FiCheck, FiX } from "react-icons/fi"
import type { Candidate } from "@prisma/client"
import { ENTITY_LABEL } from "./constants"

type CandidateRowProps = {
  candidate: Candidate
  index: number
  needsEntityId: boolean
  aggregationLevel: string
  isPending: boolean
  onEdit: (id: string, data: { name: string; party?: string; entityId?: string }) => void
  onDelete: (id: string) => void
}

export default function CandidateRow({
  candidate,
  index,
  needsEntityId,
  aggregationLevel,
  isPending,
  onEdit,
  onDelete,
}: CandidateRowProps) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(candidate.name)
  const [editParty, setEditParty] = useState(candidate.party ?? "")
  const [editEntityId, setEditEntityId] = useState(candidate.entityId ?? "")

  const startEdit = () => {
    setEditName(candidate.name)
    setEditParty(candidate.party ?? "")
    setEditEntityId(candidate.entityId ?? "")
    setEditing(true)
  }

  const handleSave = () => {
    if (!editName.trim()) return
    onEdit(candidate.id, {
      name: editName.trim(),
      party: editParty.trim() || undefined,
      entityId: needsEntityId ? editEntityId.trim() || undefined : undefined,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <Box
        px={6}
        py={3.5}
        borderBottomWidth="1px"
        borderBottomColor="gray.50"
        bg="#fafff0"
      >
        <VStack gap={3} alignItems="stretch">
          <HStack gap={3} flexWrap="wrap">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Full name"
              size="sm"
              bg="white"
              borderColor="gray.200"
              borderRadius="lg"
              flex={1}
              _focus={{
                borderColor: "#C9D927",
                boxShadow: "0 0 0 3px rgba(201,217,39,0.15)",
              }}
            />
            <Input
              value={editParty}
              onChange={(e) => setEditParty(e.target.value)}
              placeholder="Party / Independent"
              size="sm"
              bg="white"
              borderColor="gray.200"
              borderRadius="lg"
              w="160px"
              _focus={{
                borderColor: "#C9D927",
                boxShadow: "0 0 0 3px rgba(201,217,39,0.15)",
              }}
            />
            {needsEntityId && (
              <Input
                value={editEntityId}
                onChange={(e) => setEditEntityId(e.target.value)}
                placeholder={ENTITY_LABEL[aggregationLevel]}
                size="sm"
                bg="white"
                borderColor="gray.200"
                borderRadius="lg"
                w="160px"
                _focus={{
                  borderColor: "#C9D927",
                  boxShadow: "0 0 0 3px rgba(201,217,39,0.15)",
                }}
              />
            )}
          </HStack>
          <HStack gap={2}>
            <Box
              as="button"
              onClick={handleSave}
              px={3}
              py={1.5}
              borderRadius="lg"
              bg="#C9D927"
              color="#0f172a"
              fontSize="xs"
              fontWeight="700"
              cursor="pointer"
              _hover={{ bg: "#b5c220" }}
              transition="all 0.15s"
              opacity={isPending ? 0.6 : 1}
            >
              <HStack gap={1}>
                <FiCheck />
                <Text>Save</Text>
              </HStack>
            </Box>
            <Box
              as="button"
              onClick={() => setEditing(false)}
              px={3}
              py={1.5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
              fontSize="xs"
              fontWeight="600"
              color="gray.500"
              cursor="pointer"
              _hover={{ bg: "gray.50" }}
              transition="all 0.15s"
            >
              <HStack gap={1}>
                <FiX />
                <Text>Cancel</Text>
              </HStack>
            </Box>
          </HStack>
        </VStack>
      </Box>
    )
  }

  return (
    <Box
      px={6}
      py={3.5}
      borderBottomWidth="1px"
      borderBottomColor="gray.50"
      bg="white"
    >
      <HStack justify="space-between" gap={2}>
        <HStack gap={3} minW={0}>
          <Flex
            w={7}
            h={7}
            borderRadius="full"
            bg="gray.100"
            align="center"
            justify="center"
            flexShrink={0}
            fontSize="xs"
            fontWeight="700"
            color="gray.500"
          >
            {index + 1}
          </Flex>
          <VStack alignItems="flex-start" gap={0} minW={0}>
            <Text
              fontSize="sm"
              fontWeight="600"
              color="gray.900"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {candidate.name}
            </Text>
            <HStack gap={2}>
              {candidate.party && (
                <Text fontSize="xs" color="gray.400">
                  {candidate.party}
                </Text>
              )}
              {candidate.entityId && (
                <Text fontSize="xs" color="gray.300">
                  · {candidate.entityId}
                </Text>
              )}
            </HStack>
          </VStack>
        </HStack>
        <HStack gap={1} flexShrink={0}>
          <Box
            as="button"
            onClick={startEdit}
            w={7}
            h={7}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="gray.400"
            cursor="pointer"
            _hover={{ borderColor: "gray.300", color: "gray.600" }}
            transition="all 0.15s"
          >
            <FiEdit2 fontSize="0.75rem" />
          </Box>
          <Box
            as="button"
            onClick={() => onDelete(candidate.id)}
            w={7}
            h={7}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="gray.400"
            cursor="pointer"
            _hover={{ borderColor: "#fca5a5", color: "#ef4444" }}
            transition="all 0.15s"
            opacity={isPending ? 0.5 : 1}
          >
            <FiTrash2 fontSize="0.75rem" />
          </Box>
        </HStack>
      </HStack>
    </Box>
  )
}
