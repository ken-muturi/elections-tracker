"use client"

import { useState } from "react"
import { Box, Text, VStack, HStack, Input } from "@chakra-ui/react"
import {
  FiMapPin, FiChevronRight, FiCheck, FiArrowLeft, FiSearch,
} from "react-icons/fi"
import { useQuery } from "@tanstack/react-query"
import { searchElectionStreams } from "@/services/AgentAssignments"
import { CARD_STYLES } from "./constants"
import type { ElectionData, AdminSearchStream, StreamResult } from "./types"

/* ── Shared stream-card ─────────────────────────────────────── */

function StreamCard({
  label,
  stationName,
  county,
  constituency,
  ward,
  registeredVoters,
  completedPositions,
  totalPositions,
  onClick,
}: {
  label: string
  stationName: string
  county: string
  constituency: string
  ward: string
  registeredVoters: number | null
  completedPositions: number
  totalPositions: number
  onClick: () => void
}) {
  const allDone = completedPositions === totalPositions && totalPositions > 0

  return (
    <Box as="button" onClick={onClick} {...CARD_STYLES}>
      <HStack justify="space-between" align="flex-start">
        <VStack alignItems="flex-start" gap={2}>
          <VStack alignItems="flex-start" gap={0.5}>
            <Text fontWeight="700" fontSize="md" color="gray.900">
              {stationName} — {label}
            </Text>
            <HStack gap={1.5} flexWrap="wrap">
              <HStack gap={1}>
                <FiMapPin fontSize="0.7rem" color="#94a3b8" />
                <Text fontSize="xs" color="gray.400">{county}</Text>
              </HStack>
              <Text fontSize="xs" color="gray.300">›</Text>
              <Text fontSize="xs" color="gray.400">{constituency}</Text>
              <Text fontSize="xs" color="gray.300">›</Text>
              <Text fontSize="xs" color="gray.400">{ward}</Text>
            </HStack>
          </VStack>
          <HStack gap={3}>
            <HStack gap={1}>
              <FiCheck
                fontSize="0.75rem"
                color={allDone ? "#16a34a" : "#94a3b8"}
              />
              <Text
                fontSize="xs"
                color={allDone ? "#16a34a" : "gray.500"}
                fontWeight="600"
              >
                {completedPositions}/{totalPositions} positions
              </Text>
            </HStack>
            {registeredVoters && (
              <Text fontSize="xs" color="gray.400">
                {registeredVoters.toLocaleString()} voters
              </Text>
            )}
          </HStack>
        </VStack>
        <FiChevronRight color="#94a3b8" />
      </HStack>
    </Box>
  )
}

/* ── Helpers ────────────────────────────────────────────────── */

function countCompleted(results: StreamResult[]) {
  return results.filter(
    (r) => r.status === "SUBMITTED" || r.status === "VERIFIED",
  ).length
}

/* ── Props ──────────────────────────────────────────────────── */

type StreamSelectorProps = {
  isAdmin: boolean
  election: ElectionData
  resultsCache: Record<string, StreamResult[]>
  onSelectStream: (streamId: string, adminStream?: AdminSearchStream) => void
  onBack: () => void
}

/* ── Component ─────────────────────────────────────────────── */

export default function StreamSelector({
  isAdmin,
  election,
  resultsCache,
  onSelectStream,
  onBack,
}: StreamSelectorProps) {
  // Admin search state
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  const { data: searchResults = [], isFetching: searching } = useQuery<AdminSearchStream[]>({
    queryKey: ["stream-search", election.election.id, debouncedQuery],
    queryFn: () => searchElectionStreams(election.election.id, debouncedQuery),
    enabled: isAdmin && debouncedQuery.trim().length >= 2,
  })

  const searched = debouncedQuery.trim().length >= 2 && !searching

  // Debounced search
  let searchTimeout: ReturnType<typeof setTimeout> | null = null
  const onSearchChange = (value: string) => {
    setSearchQuery(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => setDebouncedQuery(value), 400)
  }

  const handleBackClick = () => {
    setSearchQuery("")
    setDebouncedQuery("")
    onBack()
  }

  const totalPositions = election.positions.length

  /* ── Admin: search-based picker ───────────────────────── */

  if (isAdmin) {
    return (
      <VStack gap={4} alignItems="stretch">
        <HStack gap={2}>
          <Box
            as="button"
            onClick={handleBackClick}
            cursor="pointer"
            _hover={{ color: "gray.900" }}
            color="gray.400"
            transition="color 0.15s"
          >
            <FiArrowLeft />
          </Box>
          <VStack alignItems="flex-start" gap={0}>
            <Text
              fontSize="sm"
              fontWeight="600"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              {election.election.title}
            </Text>
            <Text fontSize="xs" color="gray.400">
              Search for a polling station or stream
            </Text>
          </VStack>
        </HStack>

        {/* Search input */}
        <Box position="relative">
          <Box
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
            color="gray.400"
          >
            <FiSearch fontSize="0.9rem" />
          </Box>
          <Input
            placeholder="Search by station name, stream, county, constituency, ward…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            pl={9}
            fontSize="sm"
            borderColor="gray.200"
            borderRadius="xl"
            bg="white"
            _hover={{ borderColor: "gray.300" }}
            _focus={{ borderColor: "#0ea5e9", boxShadow: "0 0 0 1px #0ea5e9" }}
          />
        </Box>

        {searching && (
          <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>
            Searching…
          </Text>
        )}

        {!searching && searched && searchResults.length === 0 && (
          <VStack gap={2} py={8}>
            <FiSearch fontSize="1.5rem" color="#94a3b8" />
            <Text fontSize="sm" color="gray.500">
              No streams found. Try a different search term.
            </Text>
          </VStack>
        )}

        {!searching && !searched && (
          <VStack gap={2} py={8}>
            <FiSearch fontSize="1.5rem" color="#cbd5e1" />
            <Text fontSize="sm" color="gray.400">
              Type at least 2 characters to search for a stream
            </Text>
          </VStack>
        )}

        {searchResults.map((stream) => {
          const results = resultsCache[stream.id] ?? []
          return (
            <StreamCard
              key={stream.id}
              label={stream.name}
              stationName={stream.pollingStation.name}
              county={stream.pollingStation.county}
              constituency={stream.pollingStation.constituency}
              ward={stream.pollingStation.ward}
              registeredVoters={stream.registeredVoters}
              completedPositions={countCompleted(results)}
              totalPositions={totalPositions}
              onClick={() => onSelectStream(stream.id, stream)}
            />
          )
        })}

        {searchResults.length >= 50 && (
          <Text fontSize="xs" color="gray.400" textAlign="center">
            Showing first 50 results. Refine your search for more specific
            results.
          </Text>
        )}
      </VStack>
    )
  }

  /* ── Agent: assignment-based list ─────────────────────── */

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
          <Text
            fontSize="sm"
            fontWeight="600"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            {election.election.title}
          </Text>
          <Text fontSize="xs" color="gray.400">
            Select a stream to enter results
          </Text>
        </VStack>
      </HStack>

      {election.streams.map((s) => {
        const ps = s.stream.pollingStation
        const results = resultsCache[s.stream.id] ?? []
        return (
          <StreamCard
            key={s.stream.id}
            label={s.stream.name}
            stationName={ps.name}
            county={ps.county}
            constituency={ps.constituency}
            ward={ps.ward}
            registeredVoters={s.stream.registeredVoters}
            completedPositions={countCompleted(results)}
            totalPositions={totalPositions}
            onClick={() => onSelectStream(s.stream.id)}
          />
        )
      })}
    </VStack>
  )
}
