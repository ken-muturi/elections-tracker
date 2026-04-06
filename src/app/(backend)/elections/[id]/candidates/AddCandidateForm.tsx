"use client"

import { useState } from "react"
import { Box, Text, VStack, HStack, Input } from "@chakra-ui/react"
import { FiCheck } from "react-icons/fi"
import { ENTITY_LABEL } from "./constants"

type AddCandidateFormProps = {
  aggregationLevel: string
  needsEntityId: boolean
  isPending: boolean
  onAdd: (data: { name: string; party?: string; entityId?: string }) => void
  onCancel: () => void
}

export default function AddCandidateForm({
  aggregationLevel,
  needsEntityId,
  isPending,
  onAdd,
  onCancel,
}: AddCandidateFormProps) {
  const [name, setName] = useState("")
  const [party, setParty] = useState("")
  const [entityId, setEntityId] = useState("")

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      party: party.trim() || undefined,
      entityId: needsEntityId ? entityId.trim() || undefined : undefined,
    })
    setName("")
    setParty("")
    setEntityId("")
  }

  return (
    <Box
      px={6}
      py={4}
      bg="#fafff0"
      borderTopWidth="1px"
      borderTopColor="gray.100"
    >
      <VStack gap={3} alignItems="stretch">
        <HStack gap={3} flexWrap="wrap">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name *"
            size="sm"
            bg="white"
            borderColor="gray.200"
            borderRadius="lg"
            flex={1}
            _focus={{
              borderColor: "#C9D927",
              boxShadow: "0 0 0 3px rgba(201,217,39,0.15)",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <Input
            value={party}
            onChange={(e) => setParty(e.target.value)}
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
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          {needsEntityId && (
            <Input
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder={`${ENTITY_LABEL[aggregationLevel]} *`}
              size="sm"
              bg="white"
              borderColor="gray.200"
              borderRadius="lg"
              w="160px"
              _focus={{
                borderColor: "#C9D927",
                boxShadow: "0 0 0 3px rgba(201,217,39,0.15)",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          )}
        </HStack>
        <HStack gap={2}>
          <Box
            as="button"
            onClick={handleAdd}
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
              <Text>Add Candidate</Text>
            </HStack>
          </Box>
          <Box
            as="button"
            onClick={onCancel}
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
            Cancel
          </Box>
        </HStack>
      </VStack>
    </Box>
  )
}
