"use client"

import { Text, VStack, HStack, Box, Flex, Spinner } from "@chakra-ui/react"
import { FiCheck } from "react-icons/fi"
import type { ElectionLight } from "./types"

interface Props {
  elections: ElectionLight[]
  loading: boolean
  selectedId: string
  onSelect: (id: string) => void
}

export default function StepSelectElection({ elections, loading, selectedId, onSelect }: Props) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.100" borderRadius="xl" p={4}>
      <Text fontSize="sm" fontWeight="600" color="gray.700" mb={3}>
        Select Source Election
      </Text>
      {loading ? (
        <HStack gap={2}>
          <Spinner size="sm" />
          <Text fontSize="sm" color="gray.500">Loading elections…</Text>
        </HStack>
      ) : elections.length === 0 ? (
        <Text fontSize="sm" color="gray.400">No other elections found.</Text>
      ) : (
        <VStack gap={2} alignItems="stretch">
          {elections.map((e) => (
            <HStack
              key={e.id}
              gap={3} p={3} borderRadius="lg" borderWidth="1px"
              borderColor={selectedId === e.id ? "#0f172a" : "gray.200"}
              bg={selectedId === e.id ? "#f8fafc" : "white"}
              cursor="pointer"
              _hover={{ borderColor: "gray.400" }}
              transition="all 0.15s"
              onClick={() => onSelect(e.id)}
            >
              <Flex
                w={8} h={8} borderRadius="lg" flexShrink={0}
                bg={selectedId === e.id ? "#0f172a" : "gray.100"}
                align="center" justify="center"
              >
                <Text fontSize="xs" fontWeight="700" color={selectedId === e.id ? "white" : "gray.500"}>
                  {e.year}
                </Text>
              </Flex>
              <Text fontSize="sm" fontWeight="600" color="gray.800" flex={1}>{e.title}</Text>
              {selectedId === e.id && <Box color="#0f172a"><FiCheck /></Box>}
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  )
}
