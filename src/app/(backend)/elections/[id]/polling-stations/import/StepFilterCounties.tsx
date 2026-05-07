"use client"

import { useState } from "react"
import { Text, VStack, HStack, Box, Flex, Spinner } from "@chakra-ui/react"
import { FiCheck, FiChevronDown, FiChevronUp } from "react-icons/fi"

interface Props {
  counties: string[]
  selected: string[]
  loading: boolean
  onToggle: (name: string) => void
  onToggleAll: () => void
}

export default function StepFilterCounties({ counties, selected, loading, onToggle, onToggleAll }: Props) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Box bg="white" borderWidth="1px" borderColor="gray.100" borderRadius="xl" overflow="hidden">
      <HStack
        px={4} py={3} justify="space-between"
        cursor="pointer" _hover={{ bg: "gray.50" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <VStack alignItems="flex-start" gap={0}>
          <Text fontSize="sm" fontWeight="600" color="gray.700">
            Filter by County{" "}
            <Text as="span" fontSize="xs" fontWeight="400" color="gray.400">
              (optional — leave empty to import all)
            </Text>
          </Text>
          {selected.length > 0 && (
            <Text fontSize="xs" color="#0f172a" fontWeight="600">
              {selected.length} of {counties.length} selected
            </Text>
          )}
        </VStack>
        {expanded ? <FiChevronUp color="#9ca3af" /> : <FiChevronDown color="#9ca3af" />}
      </HStack>

      {expanded && (
        <Box px={4} pb={4}>
          {loading ? (
            <HStack gap={2}>
              <Spinner size="sm" />
              <Text fontSize="sm" color="gray.500">Loading counties…</Text>
            </HStack>
          ) : counties.length === 0 ? (
            <Text fontSize="sm" color="gray.400">No polling stations found in this election.</Text>
          ) : (
            <VStack gap={2} alignItems="stretch">
              {/* Select all */}
              <HStack gap={2} cursor="pointer" py={1} onClick={onToggleAll}>
                <Flex
                  w={4} h={4} borderRadius="sm" borderWidth="1px" flexShrink={0}
                  borderColor={selected.length === counties.length ? "#0f172a" : "gray.300"}
                  bg={selected.length === counties.length ? "#0f172a" : "white"}
                  align="center" justify="center"
                >
                  {selected.length === counties.length && <FiCheck fontSize="0.6rem" color="white" />}
                </Flex>
                <Text fontSize="xs" fontWeight="600" color="gray.500">Select all ({counties.length})</Text>
              </HStack>
              <Box h="1px" bg="gray.100" />
              {/* County list */}
              <Box
                maxH="200px" overflowY="auto"
                css={{ "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { background: "#e5e7eb", borderRadius: "4px" } }}
              >
                <VStack gap={1.5} alignItems="stretch">
                  {counties.map((county) => {
                    const checked = selected.includes(county)
                    return (
                      <HStack key={county} gap={2} cursor="pointer" py={0.5} onClick={() => onToggle(county)}>
                        <Flex
                          w={4} h={4} borderRadius="sm" borderWidth="1px" flexShrink={0}
                          borderColor={checked ? "#0f172a" : "gray.300"}
                          bg={checked ? "#0f172a" : "white"}
                          align="center" justify="center"
                        >
                          {checked && <FiCheck fontSize="0.6rem" color="white" />}
                        </Flex>
                        <Text fontSize="sm" color="gray.700">{county}</Text>
                      </HStack>
                    )
                  })}
                </VStack>
              </Box>
            </VStack>
          )}
        </Box>
      )}
    </Box>
  )
}
