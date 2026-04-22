"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Box, Flex, Text, SimpleGrid, VStack, HStack } from "@chakra-ui/react"
import DrillDown from "./DrillDown"
import { getDrillDownNational } from "@/services/PublicResults";

function DrillDownSkeleton() {
  return (
    <VStack gap={5} align="stretch">
      {/* Breadcrumb placeholder */}
      <Box h="20px" w="200px" bg="gray.100" borderRadius="md" />

      {/* Header placeholder */}
      <HStack gap={3}>
        <Box w={10} h={10} borderRadius="lg" bg="gray.100" flexShrink={0} />
        <VStack align="flex-start" gap={1.5}>
          <Box h="20px" w="180px" bg="gray.100" borderRadius="md" />
          <Box h="14px" w="240px" bg="gray.50" borderRadius="md" />
        </VStack>
      </HStack>

      {/* Leaders card placeholder */}
      <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100" overflow="hidden">
        <Box px={5} py={3} bg="gray.50" borderBottomWidth="1px" borderBottomColor="gray.100">
          <Box h="14px" w="160px" bg="gray.200" borderRadius="md" />
        </Box>
        <VStack gap={0} align="stretch">
          {[1, 2, 3].map((i) => (
            <Box key={i} px={5} py={3} borderBottomWidth="1px" borderBottomColor="gray.50">
              <HStack gap={3}>
                <Box w={6} h={6} borderRadius="full" bg="gray.100" flexShrink={0} />
                <Box flex={1}>
                  <HStack justify="space-between" mb={1.5}>
                    <Box h="14px" w={`${140 - i * 20}px`} bg="gray.100" borderRadius="md" />
                    <Box h="14px" w="60px" bg="gray.100" borderRadius="md" />
                  </HStack>
                  <Box h="4px" bg="gray.100" borderRadius="full" />
                </Box>
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Children grid placeholder */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100" overflow="hidden">
            <Box px={5} py={3} bg="gray.50" borderBottomWidth="1px" borderBottomColor="gray.100">
              <Box h="14px" w="120px" bg="gray.200" borderRadius="md" />
            </Box>
            <VStack gap={0} align="stretch">
              {[1, 2, 3].map((j) => (
                <Box key={j} px={5} py={2.5} borderBottomWidth="1px" borderBottomColor="gray.50">
                  <HStack justify="space-between">
                    <Box h="12px" w={`${100 - j * 10}px`} bg="gray.100" borderRadius="md" />
                    <Box h="12px" w="50px" bg="gray.100" borderRadius="md" />
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}

export default function DrillDownClient({ electionId, positionId }: { electionId: string; positionId: string }) {
  const { data: initial, isLoading, isError } = useQuery({
    queryKey: ["public-results", electionId, positionId],
    queryFn: () => getDrillDownNational(electionId, positionId),
  });

  if (isLoading) return <DrillDownSkeleton />

  if (isError || !initial) {
    return (
      <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100" p={12} textAlign="center">
        <Flex direction="column" align="center" gap={3} color="gray.400">
          <Text fontSize="sm">Failed to load results. Please refresh the page.</Text>
        </Flex>
      </Box>
    )
  }

  return <DrillDown initial={initial} electionId={electionId} />
}
