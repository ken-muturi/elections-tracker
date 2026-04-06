"use client"

import { Box, Text, VStack, HStack, Flex, SimpleGrid } from "@chakra-ui/react"
import { FiArrowLeft } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import StatusBadge from "./StatusBadge"
import { CARD_STYLES } from "./constants"
import type { Position, StreamResult, StreamInfo } from "./types"

type PositionSelectorProps = {
  stream: StreamInfo
  positions: Position[]
  streamResults: StreamResult[]
  onSelect: (position: Position) => void
  onBack: () => void
}

export default function PositionSelector({
  stream,
  positions,
  streamResults,
  onSelect,
  onBack,
}: PositionSelectorProps) {
  const ps = stream.pollingStation

  return (
    <VStack gap={4} alignItems="stretch">
      <HStack gap={2}>
        <Box
          as="button"
          onClick={onBack}
          cursor="pointer"
          _hover={{ color: "gray.900" }}
          color="gray.400"
          transition="color 0.15s"
        >
          <FiArrowLeft />
        </Box>
        <VStack alignItems="flex-start" gap={0}>
          <Text fontSize="sm" fontWeight="700" color="gray.900">
            {ps.name} — {stream.name}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {ps.county} › {ps.constituency} › {ps.ward}
          </Text>
        </VStack>
      </HStack>

      <Text
        fontSize="sm"
        fontWeight="600"
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="wide"
      >
        Select Position
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        {positions.map((pos) => {
          const existing = streamResults.find((r) => r.positionId === pos.id)
          const status = existing?.status

          return (
            <Box
              key={pos.id}
              as="button"
              onClick={() => onSelect(pos)}
              {...CARD_STYLES}
            >
              <HStack justify="space-between" mb={2}>
                <HStack gap={2}>
                  <Flex
                    w={8}
                    h={8}
                    borderRadius="lg"
                    bg="#f1f5f9"
                    align="center"
                    justify="center"
                  >
                    <MdHowToVote fontSize="1rem" color="#475569" />
                  </Flex>
                  <VStack alignItems="flex-start" gap={0}>
                    <Text fontWeight="700" fontSize="sm" color="gray.900">
                      {pos.title}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {pos.candidates.length} candidate
                      {pos.candidates.length !== 1 ? "s" : ""}
                    </Text>
                  </VStack>
                </HStack>
                {status && <StatusBadge status={status} />}
              </HStack>

              {!status && (
                <Text fontSize="xs" color="gray.400" fontStyle="italic">
                  Not yet entered
                </Text>
              )}
            </Box>
          )
        })}
      </SimpleGrid>
    </VStack>
  )
}
