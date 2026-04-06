"use client"

import { useState, useMemo } from "react";
import { Box, Text, VStack, HStack, Input, Flex } from "@chakra-ui/react";
import { FiMapPin, FiCheck, FiArrowLeft, FiSearch } from "react-icons/fi";
import { MdHowToVote } from "react-icons/md";
import { useQuery } from "@tanstack/react-query"
import { searchElectionStreams } from "@/services/AgentAssignments";
import type { ElectionData, AdminSearchStream, StreamResult } from "./types"

/* ── Types ──────────────────────────────────────────────────── */

type GroupedStation = {
  id: string;
  name: string;
  county: string;
  constituency: string;
  ward: string;
  registeredVoters: number | null;
  streams: {
    id: string;
    name: string;
    registeredVoters: number | null;
    completedPositions: number;
  }[];
};

/* ── Helpers ────────────────────────────────────────────────── */

function countCompleted(results: StreamResult[]) {
  return results.filter(
    (r) => r.status === "SUBMITTED" || r.status === "VERIFIED",
  ).length;
}

/** Group a flat list of admin-search streams by polling station. */
function groupByStation(
  streams: AdminSearchStream[],
  resultsCache: Record<string, StreamResult[]>,
): GroupedStation[] {
  const map = new Map<string, GroupedStation>();

  for (const s of streams) {
    const ps = s.pollingStation;
    let group = map.get(ps.id);
    if (!group) {
      group = {
        id: ps.id,
        name: ps.name,
        county: ps.county,
        constituency: ps.constituency,
        ward: ps.ward,
        registeredVoters: ps.registeredVoters,
        streams: [],
      };
      map.set(ps.id, group);
    }
    const results = resultsCache[s.id] ?? [];
    group.streams.push({
      id: s.id,
      name: s.name,
      registeredVoters: s.registeredVoters,
      completedPositions: countCompleted(results),
    });
  }

  return Array.from(map.values());
}

/** Group agent-assignment streams by polling station. */
function groupAgentStreams(
  agentStreams: ElectionData["streams"],
  resultsCache: Record<string, StreamResult[]>,
): GroupedStation[] {
  const map = new Map<string, GroupedStation>();

  for (const a of agentStreams) {
    const ps = a.stream.pollingStation;
    let group = map.get(ps.id);
    if (!group) {
      group = {
        id: ps.id,
        name: ps.name,
        county: ps.county,
        constituency: ps.constituency,
        ward: ps.ward,
        registeredVoters: ps.registeredVoters,
        streams: [],
      };
      map.set(ps.id, group);
    }
    const results = resultsCache[a.stream.id] ?? [];
    group.streams.push({
      id: a.stream.id,
      name: a.stream.name,
      registeredVoters: a.stream.registeredVoters,
      completedPositions: countCompleted(results),
    });
  }

  return Array.from(map.values());
}

/* ── Polling-station card with stream links ─────────────────── */

function StationGroup({
  station,
  totalPositions,
  onSelectStream,
}: {
  station: GroupedStation;
  totalPositions: number;
  onSelectStream: (streamId: string) => void;
}) {
  const completedStreams = station.streams.filter(
    (s) => s.completedPositions === totalPositions && totalPositions > 0,
  ).length;
  const allDone =
    completedStreams === station.streams.length && station.streams.length > 0;

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.100"
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
      p={5}
    >
      {/* Station info */}
      <HStack justify="space-between" align="flex-start" mb={3}>
        <HStack gap={2.5} align="flex-start">
          <Flex
            w={8}
            h={8}
            borderRadius="lg"
            flexShrink={0}
            bg={allDone ? "#d1fae5" : "#f0f9ff"}
            align="center"
            justify="center"
          >
            <MdHowToVote
              fontSize="1rem"
              color={allDone ? "#059669" : "#0284c7"}
            />
          </Flex>
          <VStack alignItems="flex-start" gap={0.5}>
            <Text
              fontWeight="700"
              fontSize="sm"
              color="gray.900"
              lineHeight="1.3"
            >
              {station.name}
            </Text>
            <HStack gap={1.5} flexWrap="wrap">
              <FiMapPin fontSize="0.6rem" color="#94a3b8" />
              <Text fontSize="xs" color="gray.400">
                {station.county} › {station.constituency} › {station.ward}
              </Text>
            </HStack>
          </VStack>
        </HStack>
        <VStack alignItems="flex-end" gap={0}>
          <HStack gap={1}>
            <FiCheck
              fontSize="0.65rem"
              color={allDone ? "#16a34a" : "#94a3b8"}
            />
            <Text
              fontSize="xs"
              color={allDone ? "#16a34a" : "gray.500"}
              fontWeight="600"
            >
              {completedStreams}/{station.streams.length}
            </Text>
          </HStack>
          {station.registeredVoters && (
            <Text fontSize="2xs" color="gray.400">
              {station.registeredVoters.toLocaleString()} voters
            </Text>
          )}
        </VStack>
      </HStack>

      {/* Stream chips */}
      <HStack gap={2} flexWrap="wrap">
        {station.streams.map((stream) => {
          const done =
            stream.completedPositions === totalPositions && totalPositions > 0;
          return (
            <Box
              key={stream.id}
              as="button"
              onClick={() => onSelectStream(stream.id)}
              px={3}
              py={1.5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={done ? "#a7f3d0" : "gray.200"}
              bg={done ? "#ecfdf5" : "white"}
              cursor="pointer"
              _hover={{
                borderColor: done ? "#6ee7b7" : "#0ea5e9",
                boxShadow: done ? "0 0 0 1px #6ee7b7" : "0 0 0 1px #0ea5e9",
              }}
              transition="all 0.15s"
            >
              <HStack gap={1.5}>
                {done ? (
                  <FiCheck fontSize="0.7rem" color="#059669" />
                ) : (
                  <Box w={1.5} h={1.5} borderRadius="full" bg="gray.300" />
                )}
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color={done ? "#059669" : "gray.700"}
                >
                  {stream.name}
                </Text>
                <Text fontSize="2xs" color={done ? "#6ee7b7" : "gray.400"}>
                  {stream.completedPositions}/{totalPositions}
                </Text>
              </HStack>
            </Box>
          );
        })}
      </HStack>
    </Box>
  );
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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: searchResults = [], isFetching: searching } = useQuery<
    AdminSearchStream[]
  >({
    queryKey: ["stream-search", election.election.id, debouncedQuery],
    queryFn: () => searchElectionStreams(election.election.id, debouncedQuery),
    enabled: isAdmin && debouncedQuery.trim().length >= 2,
  });

  const searched = debouncedQuery.trim().length >= 2 && !searching;

  // Debounced search
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => setDebouncedQuery(value), 400);
  };

  const handleBackClick = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    onBack();
  };

  const totalPositions = election.positions.length;

  // Build a lookup so we can pass the full AdminSearchStream to the parent
  const adminStreamMap = useMemo(() => {
    const m = new Map<string, AdminSearchStream>();
    for (const s of searchResults) m.set(s.id, s);
    return m;
  }, [searchResults]);

  const handleAdminSelectStream = (streamId: string) => {
    onSelectStream(streamId, adminStreamMap.get(streamId));
  };

  /* ── Admin: search-based picker (grouped) ─────────────── */

  if (isAdmin) {
    const grouped = groupByStation(searchResults, resultsCache);

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

        {grouped.map((station) => (
          <StationGroup
            key={station.id}
            station={station}
            totalPositions={totalPositions}
            onSelectStream={handleAdminSelectStream}
          />
        ))}

        {searchResults.length >= 50 && (
          <Text fontSize="xs" color="gray.400" textAlign="center">
            Showing first 50 results. Refine your search for more specific
            results.
          </Text>
        )}
      </VStack>
    );
  }

  /* ── Agent: assignment-based list (grouped) ───────────── */

  const agentGrouped = groupAgentStreams(election.streams, resultsCache);

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

      {agentGrouped.map((station) => (
        <StationGroup
          key={station.id}
          station={station}
          totalPositions={totalPositions}
          onSelectStream={(streamId) => onSelectStream(streamId)}
        />
      ))}
    </VStack>
  );
}
