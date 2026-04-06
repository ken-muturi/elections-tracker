"use client"

import { useState } from "react"
import { Box, Text, VStack, HStack, Flex } from "@chakra-ui/react"
import {
  FiMapPin, FiChevronDown, FiChevronUp,
} from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import StatusBadge from "./StatusBadge"
import type { Result } from "./types"

export default function ResultCard({ result }: { result: Result }) {
  const [expanded, setExpanded] = useState(false)
  const ps = result.stream.pollingStation
  const date = new Date(result.submittedAt)

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.100"
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
      overflow="hidden"
    >
      {/* Card header — clickable */}
      <Box
        as="button"
        onClick={() => setExpanded(!expanded)}
        w="full"
        px={5}
        py={4}
        textAlign="left"
        cursor="pointer"
        _hover={{ bg: "#fafbfc" }}
        transition="background 0.1s"
      >
        <HStack justify="space-between" align="flex-start">
          <VStack alignItems="flex-start" gap={2} flex={1}>
            <HStack gap={2} flexWrap="wrap">
              <Flex
                w={7}
                h={7}
                borderRadius="lg"
                bg="#f1f5f9"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <MdHowToVote fontSize="0.9rem" color="#475569" />
              </Flex>
              <VStack alignItems="flex-start" gap={0}>
                <Text fontWeight="700" fontSize="sm" color="gray.900">
                  {result.position.title}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {ps.name} — {result.stream.name}
                </Text>
              </VStack>
            </HStack>

            <HStack gap={1.5} flexWrap="wrap">
              <HStack gap={1}>
                <FiMapPin fontSize="0.65rem" color="#94a3b8" />
                <Text fontSize="xs" color="gray.400">
                  {ps.county} › {ps.constituency} › {ps.ward}
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.300">·</Text>
              <Text fontSize="xs" color="gray.400">
                {date.toLocaleDateString()}{" "}
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </HStack>
          </VStack>

          <HStack gap={2}>
            <StatusBadge status={result.status} />
            {expanded ? (
              <FiChevronUp color="#94a3b8" />
            ) : (
              <FiChevronDown color="#94a3b8" />
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Expanded vote details */}
      {expanded && (
        <Box borderTopWidth="1px" borderTopColor="gray.100">
          {/* Column headers */}
          <HStack
            px={5}
            py={2}
            bg="#f8fafc"
            borderBottomWidth="1px"
            borderBottomColor="gray.100"
          >
            <Text
              fontSize="xs"
              fontWeight="700"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wide"
              flex={1}
            >
              Candidate
            </Text>
            <Text
              fontSize="xs"
              fontWeight="700"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wide"
              w="100px"
              textAlign="right"
            >
              Votes
            </Text>
          </HStack>

          {result.votes
            .sort((a, b) => b.votes - a.votes)
            .map((v, i) => (
              <HStack
                key={v.candidateId}
                px={5}
                py={2.5}
                borderBottomWidth={i < result.votes.length - 1 ? "1px" : "0"}
                borderBottomColor="gray.50"
              >
                <VStack alignItems="flex-start" gap={0} flex={1}>
                  <Text fontSize="sm" fontWeight="600" color="gray.900">
                    {v.candidate.name}
                  </Text>
                  {v.candidate.party && (
                    <Text fontSize="xs" color="gray.400">
                      {v.candidate.party}
                    </Text>
                  )}
                </VStack>
                <Text
                  fontSize="md"
                  fontWeight="700"
                  color="gray.900"
                  w="100px"
                  textAlign="right"
                >
                  {v.votes.toLocaleString()}
                </Text>
              </HStack>
            ))}

          {/* Rejected + Total */}
          {(result.rejectedVotes ?? 0) > 0 && (
            <HStack
              px={5}
              py={2.5}
              bg="#fef7ed"
              borderTopWidth="1px"
              borderTopColor="gray.100"
            >
              <Text fontSize="sm" fontWeight="600" color="#92400e" flex={1}>
                Rejected Ballots
              </Text>
              <Text
                fontSize="md"
                fontWeight="700"
                color="#92400e"
                w="100px"
                textAlign="right"
              >
                {(result.rejectedVotes ?? 0).toLocaleString()}
              </Text>
            </HStack>
          )}

          <HStack
            px={5}
            py={2.5}
            bg="#f1f5f9"
            borderTopWidth="1px"
            borderTopColor="gray.200"
          >
            <Text fontSize="sm" fontWeight="800" color="gray.700" flex={1}>
              TOTAL
            </Text>
            <Text
              fontSize="md"
              fontWeight="800"
              color="gray.900"
              w="100px"
              textAlign="right"
            >
              {(result.totalVotes ?? 0).toLocaleString()}
            </Text>
          </HStack>

          {result.notes && (
            <Box
              px={5}
              py={2.5}
              bg="#f8fafc"
              borderTopWidth="1px"
              borderTopColor="gray.100"
            >
              <Text fontSize="xs" color="gray.500">
                <strong>Notes:</strong> {result.notes}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
