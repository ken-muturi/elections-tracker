"use client"

import { Box, VStack, HStack, Text, Flex, Badge, Icon } from "@chakra-ui/react"
import { FiAlertCircle } from "react-icons/fi"
import type { DrillDownResult } from "@/services/PublicResults"
import { getIEBCFormRef, LEVEL_LABEL } from "../constants"
import ComparisonPanel from "./ComparisonPanel"
import { circleFgColor } from "./candidateColors"

type LcColors = { bg: string; color: string; border: string }

export default function LeadersCard({
  data,
  lc,
  colorMap,
}: {
  data: DrillDownResult
  lc: LcColors
  colorMap: Map<string, string>
}) {
  const formRef = getIEBCFormRef(data.positionType, data.level)
  const isPresidential = data.positionType.toUpperCase() === "PRESIDENT"
  const isNationalView = data.level === "NATIONAL"

  // Per-child winner rows: only at national level for non-presidential positions.
  // Once drilled in (county/constituency/ward) show all candidates normally.
  const childWinnerRows = (!isPresidential && isNationalView)
    ? data.children
        .filter((c) => c.candidates.length > 0 && c.candidates[0].votes > 0)
        .sort((a, b) => b.candidates[0].votes - a.candidates[0].votes)
        .map((child) => {
          const leader = child.candidates[0]
          const pct = child.totalVotes > 0 ? (leader.votes / child.totalVotes) * 100 : 0
          return {
            entityName: child.entityName,
            candidateId: leader.candidateId,
            name: leader.name,
            party: leader.party,
            votes: leader.votes,
            pct,
          }
        })
    : null

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.100"
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
      overflow="hidden"
    >
      <Box
        px={5}
        py={2}
        bg="gray.50"
        borderBottomWidth="1px"
        borderBottomColor="gray.100"
      >
        <HStack justify="space-between">
          <Text
            fontSize="xs"
            fontWeight="700"
            color="gray.600"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            {isPresidential || !isNationalView
              ? `${LEVEL_LABEL[data.level] ?? data.level}: Stream Aggregate — ${data.totalVotes.toLocaleString()} votes`
              : `${LEVEL_LABEL[data.level] ?? data.level}: Winning Candidates — ${data.totalVotes.toLocaleString()} votes`}
          </Text>
          {data.enteredVotes && (
            <HStack gap={1.5}>
              <Badge
                px={1.5}
                py={0.5}
                borderRadius="md"
                fontSize="2xs"
                fontWeight="700"
                bg="blue.100"
                color="blue.800"
              >
                {formRef.form}
              </Badge>
              <Text fontSize="xs" fontWeight="600" color="blue.600">
                {formRef.label}:{" "}
                {(data.enteredVotes.totalVotes ?? 0).toLocaleString()} votes
              </Text>
            </HStack>
          )}
        </HStack>
      </Box>

      {data.totalVotes === 0 && (
        <HStack
          px={5}
          py={2.5}
          gap={2}
          bg="gray.50"
          borderBottomWidth="1px"
          borderBottomColor="gray.100"
        >
          <Icon as={FiAlertCircle} fontSize="0.85rem" color="gray.400" />
          <Text fontSize="xs" color="gray.400">
            No votes recorded yet at this level
          </Text>
        </HStack>
      )}

      {/* ── Presidential OR drilled-in: aggregate top-5 ─────────────────────────── */}
      {(isPresidential || !isNationalView) && (
        <VStack gap={0} align="stretch">
          {data.candidates.slice(0, 5).map((cand, idx) => {
            const pct = data.totalVotes > 0 ? (cand.votes / data.totalVotes) * 100 : 0
            const isLeader = idx === 0 && cand.votes > 0
            const candColor = colorMap.get(cand.candidateId) ?? lc.border
            return (
              <Box
                key={cand.candidateId}
                px={5} py={1.5}
                bg={isLeader ? "#fafff0" : "white"}
                borderBottomWidth="1px" borderBottomColor="gray.50"
              >
                <HStack gap={3}>
                  <Flex
                    w={6} h={6} borderRadius="full" flexShrink={0}
                    align="center" justify="center"
                    bg={candColor} fontSize="xs" fontWeight="800"
                    color={circleFgColor(candColor)}
                    style={{ opacity: isLeader ? 1 : 0.85 }}
                  >
                    {idx + 1}
                  </Flex>
                  <Box flex={1}>
                    <HStack justify="space-between" mb={0.5}>
                      <HStack gap={2}>
                        <Text fontSize="sm" fontWeight={isLeader ? "700" : "600"} color="gray.900">
                          {cand.name}
                        </Text>
                        {cand.party && <Text fontSize="xs" color="gray.400">{cand.party}</Text>}
                      </HStack>
                      <HStack gap={2} flexShrink={0}>
                        <Text fontSize="sm" fontWeight="700" color="gray.700">
                          {cand.votes.toLocaleString()}
                        </Text>
                        <Text fontSize="xs" color="gray.400" w="36px" textAlign="right">
                          {pct.toFixed(1)}%
                        </Text>
                      </HStack>
                    </HStack>
                    <Box h="4px" bg="gray.100" borderRadius="full" overflow="hidden">
                      <Box h="full" w={`${pct}%`} bg={candColor} borderRadius="full" transition="width 0.4s ease" />
                    </Box>
                  </Box>
                </HStack>
              </Box>
            )
          })}
        </VStack>
      )}

      {/* ── Non-presidential at national level: one row per child entity with local winner ── */}
      {!isPresidential && isNationalView && childWinnerRows && (
        <Box maxH="320px" overflowY="auto"
          css={{ "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: "4px" } }}
        >
          <VStack gap={0} align="stretch">
            {childWinnerRows.map((row, idx) => {
              const candColor = colorMap.get(row.candidateId) ?? lc.border
              const isFirst = idx === 0
              return (
                <Box
                  key={row.entityName}
                  px={5} py={1.5}
                  bg={isFirst ? "#fafff0" : "white"}
                  borderBottomWidth="1px" borderBottomColor="gray.50"
                >
                  <HStack gap={3}>
                    <Box w={2.5} h={2.5} borderRadius="sm" flexShrink={0} bg={candColor} mt="1px" />
                    <Text fontSize="xs" color="gray.500" flexShrink={0} minW="90px">{row.entityName}</Text>
                    <Box flex={1}>
                      <HStack justify="space-between">
                        <HStack gap={2}>
                          <Text fontSize="sm" fontWeight="600" color="gray.900">{row.name}</Text>
                          {row.party && <Text fontSize="xs" color="gray.400">{row.party}</Text>}
                        </HStack>
                        <HStack gap={2} flexShrink={0}>
                          <Text fontSize="sm" fontWeight="700" color="gray.700">
                            {row.votes.toLocaleString()}
                          </Text>
                          <Text fontSize="xs" color="gray.400" w="36px" textAlign="right">
                            {row.pct.toFixed(1)}%
                          </Text>
                        </HStack>
                      </HStack>
                      <Box h="3px" bg="gray.100" borderRadius="full" overflow="hidden" mt={0.5}>
                        <Box h="full" w={`${row.pct}%`} bg={candColor} borderRadius="full" transition="width 0.4s ease" />
                      </Box>
                    </Box>
                  </HStack>
                </Box>
              )
            })}
          </VStack>
        </Box>
      )}

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
