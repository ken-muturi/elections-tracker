"use client"

import { Box, VStack, HStack, Text, Flex, Badge } from "@chakra-ui/react"
import type { DrillDownResult } from "@/services/PublicResults"
import { getIEBCFormRef } from "../constants"
import ComparisonPanel from "./ComparisonPanel"

type LcColors = { bg: string; color: string; border: string }

export default function LeadersCard({
  data,
  lc,
}: {
  data: DrillDownResult
  lc: LcColors
}) {
  const formRef = data.enteredVotes ? getIEBCFormRef(data.positionType, data.level) : null

  return (
    <Box
      bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100"
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden"
    >
      <Box px={5} py={3} bg="gray.50" borderBottomWidth="1px" borderBottomColor="gray.100">
        <HStack justify="space-between">
          <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="wide">
            Stream Aggregation — {data.totalVotes.toLocaleString()} votes
          </Text>
          {data.enteredVotes && (
            <HStack gap={1.5}>
              {formRef && (
                <Badge px={1.5} py={0.5} borderRadius="md" fontSize="2xs" fontWeight="700"
                  bg="blue.100" color="blue.800">
                  {formRef.form}
                </Badge>
              )}
              <Text fontSize="xs" fontWeight="600" color="blue.600">
                Entered: {(data.enteredVotes.totalVotes ?? 0).toLocaleString()} votes
              </Text>
            </HStack>
          )}
        </HStack>
      </Box>

      <VStack gap={0} align="stretch">
        {data.candidates.slice(0, 5).map((cand, idx) => {
          const pct = data.totalVotes > 0 ? (cand.votes / data.totalVotes) * 100 : 0
          const isLeader = idx === 0 && cand.votes > 0
          return (
            <Box
              key={cand.candidateId} px={5} py={2.5}
              bg={isLeader ? "#fafff0" : "white"}
              borderBottomWidth="1px" borderBottomColor="gray.50"
            >
              <HStack gap={3}>
                <Flex
                  w={6} h={6} borderRadius="full" flexShrink={0}
                  align="center" justify="center"
                  bg={isLeader ? "#C9D927" : "gray.100"}
                  fontSize="xs" fontWeight="800"
                  color={isLeader ? "#0f172a" : "gray.500"}
                >
                  {idx + 1}
                </Flex>
                <Box flex={1}>
                  <HStack justify="space-between" mb={0.5}>
                    <HStack gap={2}>
                      <Text fontSize="sm" fontWeight={isLeader ? "700" : "600"} color="gray.900">
                        {cand.name}
                      </Text>
                      {cand.party && (
                        <Text fontSize="xs" color="gray.400">{cand.party}</Text>
                      )}
                    </HStack>
                    <HStack gap={2} flexShrink={0}>
                      <Text fontSize="sm" fontWeight="700" color={isLeader ? "#798217" : "gray.700"}>
                        {cand.votes.toLocaleString()}
                      </Text>
                      <Text fontSize="xs" color="gray.400" w="36px" textAlign="right">
                        {pct.toFixed(1)}%
                      </Text>
                    </HStack>
                  </HStack>
                  <Box h="4px" bg="gray.100" borderRadius="full" overflow="hidden">
                    <Box
                      h="full" w={`${pct}%`}
                      bg={isLeader ? "#C9D927" : lc.border}
                      borderRadius="full" transition="width 0.4s ease"
                    />
                  </Box>
                </Box>
              </HStack>
            </Box>
          )
        })}
      </VStack>

      {data.enteredVotes && (
        <ComparisonPanel
          aggregatedTotal={data.totalVotes}
          aggregatedRejected={data.rejectedVotes}
          aggregatedCandidates={data.candidates}
          enteredVotes={data.enteredVotes}
          positionType={data.positionType}
          level={data.level}
        />
      )}
    </Box>
  )
}
