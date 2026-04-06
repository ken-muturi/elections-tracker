"use client"

import { Box, Text, VStack, HStack } from "@chakra-ui/react"
import { FiChevronRight } from "react-icons/fi"
import { CARD_STYLES } from "./constants"
import type { ElectionData } from "./types"

type ElectionSelectorProps = {
  electionData: ElectionData[]
  isAdmin: boolean
  onSelect: (electionId: string) => void
}

export default function ElectionSelector({
  electionData,
  isAdmin,
  onSelect,
}: ElectionSelectorProps) {
  return (
    <VStack gap={4} alignItems="stretch">
      <Text
        fontSize="sm"
        fontWeight="600"
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="wide"
      >
        Select Election
      </Text>

      {electionData.map((e) => (
        <Box
          key={e.election.id}
          as="button"
          onClick={() => onSelect(e.election.id)}
          {...CARD_STYLES}
        >
          <HStack justify="space-between">
            <VStack alignItems="flex-start" gap={1}>
              <Text fontWeight="700" fontSize="md" color="gray.900">
                {e.election.title}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {e.election.year}
                {!isAdmin &&
                  ` · ${e.streams.length} stream${e.streams.length !== 1 ? "s" : ""} assigned`}
              </Text>
            </VStack>
            <FiChevronRight color="#94a3b8" />
          </HStack>
        </Box>
      ))}
    </VStack>
  )
}
