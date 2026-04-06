"use client"

import { useState, useCallback, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  SimpleGrid,
  Badge,
} from "@chakra-ui/react";
import { FiArrowLeft, FiLayers } from "react-icons/fi";
import { MdHowToVote } from "react-icons/md";
import { getStreamResultsForStream } from "@/services/AgentAssignments"
import ElectionSelector from "./ElectionSelector"
import StreamSelector from "./StreamSelector"
import PositionSelector from "./PositionSelector"
import VoteEntryForm from "./VoteEntryForm"
import LevelEntryClient from "./LevelEntryClient";
import { CARD_STYLES } from "./constants";
import type {
  ElectionData, Position, StreamResult, AdminSearchStream, StreamInfo,
} from "./types"

/* ── Helpers ───────────────────────────────────────────────── */

/**
 * Filter candidates for a position based on the stream's geographic scope.
 *
 * NATIONAL positions → all candidates (entityId is null)
 * COUNTY positions   → candidates whose entityId matches the stream's county
 * CONSTITUENCY pos.  → candidates whose entityId matches the stream's constituency
 * WARD positions     → candidates whose entityId matches the stream's ward
 *
 * Falls back to all candidates when geographic IDs are unavailable.
 */
function filterCandidatesForStream(
  position: Position,
  stream: StreamInfo,
): Position {
  const { aggregationLevel, candidates } = position
  const wr = stream.pollingStation.wardRef

  // NATIONAL positions have no geographic scope — show all candidates
  if (aggregationLevel === "NATIONAL" || !wr) return position

  let targetEntityId: string | undefined
  if (aggregationLevel === "COUNTY") {
    targetEntityId = wr.constituency?.countyId
  } else if (aggregationLevel === "CONSTITUENCY") {
    targetEntityId = wr.constituencyId
  } else if (aggregationLevel === "WARD" || aggregationLevel === "POLLING_STATION") {
    targetEntityId = wr.id
  }

  if (!targetEntityId) return position

  const filtered = candidates.filter(
    (c) => !c.entityId || c.entityId === targetEntityId,
  )

  // If nothing matched (e.g. entityId not populated yet), fall back to all
  if (filtered.length === 0) return position

  return { ...position, candidates: filtered }
}

/* ── Props ─────────────────────────────────────────────────── */

type Props = {
  electionData: ElectionData[];
  isAdmin?: boolean;
  initialElectionId?: string;
};

/* ── Component ─────────────────────────────────────────────── */

export default function EnterResultsClient({
  electionData,
  isAdmin = false,
  initialElectionId,
}: Props) {
  /* ── Navigation state ──────────────────────────────────── */
  const resolvedInitial =
    // If a specific election was requested via URL, use it (if it exists in the data)
    initialElectionId &&
    electionData.some((e) => e.election.id === initialElectionId)
      ? initialElectionId
      : // Otherwise auto-select when there's only one
        electionData.length === 1
        ? electionData[0].election.id
        : null;

  const [selectedElection, setSelectedElection] = useState<string | null>(
    resolvedInitial,
  );
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Admin: entry mode — "stream" (Form A) or "level" (Form B/C)
  const [entryMode, setEntryMode] = useState<"stream" | "level" | null>(null);

  // Admin: the full stream object (for display) selected via search
  const [adminActiveStream, setAdminActiveStream] =
    useState<AdminSearchStream | null>(null);

  /* ── Results cache via React Query ─────────────────────── */
  const queryClient = useQueryClient();

  // Seed query cache with server-fetched results on first render
  useState(() => {
    for (const e of electionData) {
      for (const [streamId, results] of Object.entries(e.streamResultsMap)) {
        queryClient.setQueryData<StreamResult[]>(
          ["stream-results", streamId],
          results,
        );
      }
    }
  });

  // Fetch results for the selected stream (auto-cached by React Query)
  const { data: streamResults = [] } = useQuery<StreamResult[]>({
    queryKey: ["stream-results", selectedStream],
    queryFn: () =>
      getStreamResultsForStream(selectedStream!) as Promise<StreamResult[]>,
    enabled: !!selectedStream,
    staleTime: 5 * 60 * 1000, // 5 min — avoid re-fetching within a session
  });

  // Also build the full cache map for child components that need it
  const resultsCache = useMemo(() => {
    const cache: Record<string, StreamResult[]> = {};
    for (const e of electionData) {
      for (const streamId of Object.keys(e.streamResultsMap)) {
        const cached = queryClient.getQueryData<StreamResult[]>([
          "stream-results",
          streamId,
        ]);
        if (cached) cache[streamId] = cached;
      }
    }
    if (selectedStream && streamResults.length > 0) {
      cache[selectedStream] = streamResults;
    }
    return cache;
  }, [electionData, queryClient, selectedStream, streamResults]);

  /* ── Derived data ──────────────────────────────────────── */
  const activeElection = electionData.find(
    (e) => e.election.id === selectedElection,
  );

  const activeStreamInfo: StreamInfo | undefined = isAdmin
    ? (adminActiveStream ?? undefined)
    : activeElection?.streams.find((s) => s.stream.id === selectedStream)
        ?.stream;

  const activePosition = activeElection?.positions.find(
    (p) => p.id === selectedPosition,
  );

  /* ── Handlers ──────────────────────────────────────────── */

  const handleSelectStream = useCallback(
    (streamId: string, adminStream?: AdminSearchStream) => {
      setSelectedStream(streamId);
      if (adminStream) setAdminActiveStream(adminStream);
      // useQuery will automatically fetch results for the new streamId
    },
    [],
  );

  const handleBackToElections = useCallback(() => {
    setSelectedElection(null);
  }, []);

  const handleBackToStreams = useCallback(() => {
    setSelectedStream(null);
    setAdminActiveStream(null);
  }, []);

  const handleBackToPositions = useCallback(() => {
    setSelectedPosition(null);
  }, []);

  const handleSaved = useCallback(
    (result: StreamResult) => {
      if (!selectedStream) return;
      queryClient.setQueryData<StreamResult[]>(
        ["stream-results", selectedStream],
        (prev = []) => {
          const filtered = prev.filter(
            (r) => r.positionId !== result.positionId,
          );
          return [...filtered, result];
        },
      );
    },
    [selectedStream, queryClient],
  );

  /* ── Step 1: Election selection ────────────────────────── */
  if (!selectedElection) {
    return (
      <ElectionSelector
        electionData={electionData}
        isAdmin={isAdmin}
        onSelect={setSelectedElection}
      />
    );
  }

  /* ── Step 2 (admin): Choose mode — stream entry vs level entry ── */
  if (isAdmin && !entryMode && selectedElection && activeElection) {
    return (
      <VStack gap={4} alignItems="stretch">
        <HStack gap={2}>
          <Box
            as="button"
            onClick={handleBackToElections}
            cursor="pointer"
            _hover={{ color: "gray.900" }}
            color="gray.400"
            transition="color 0.15s"
          >
            <FiArrowLeft />
          </Box>
          <VStack alignItems="flex-start" gap={0}>
            <Text fontSize="sm" fontWeight="700" color="gray.900">
              {activeElection.election.title}
            </Text>
            <Text fontSize="xs" color="gray.400">
              Choose how you want to enter results
            </Text>
          </VStack>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {/* Stream entry (Form A) */}
          <Box
            as="button"
            onClick={() => setEntryMode("stream")}
            {...CARD_STYLES}
            p={6}
          >
            <HStack gap={4} align="flex-start">
              <Flex
                w={12}
                h={12}
                borderRadius="xl"
                flexShrink={0}
                bg="#f0f9ff"
                align="center"
                justify="center"
              >
                <MdHowToVote fontSize="1.4rem" color="#0284c7" />
              </Flex>
              <VStack alignItems="flex-start" gap={1}>
                <Text fontWeight="700" fontSize="md" color="gray.900">
                  Stream Entry
                </Text>
                <Text fontSize="xs" color="gray.500" lineHeight="1.5">
                  Enter raw vote counts per polling station stream — Form A
                </Text>
                <Badge
                  size="xs"
                  variant="subtle"
                  colorPalette="blue"
                  fontSize="9px"
                  mt={1}
                >
                  Form 34A, 35A, etc.
                </Badge>
              </VStack>
            </HStack>
          </Box>

          {/* Level entry (Form B/C) */}
          <Box
            as="button"
            onClick={() => setEntryMode("level")}
            {...CARD_STYLES}
            p={6}
          >
            <HStack gap={4} align="flex-start">
              <Flex
                w={12}
                h={12}
                borderRadius="xl"
                flexShrink={0}
                bg="#fce7f3"
                align="center"
                justify="center"
              >
                <FiLayers fontSize="1.4rem" color="#9d174d" />
              </Flex>
              <VStack alignItems="flex-start" gap={1}>
                <Text fontWeight="700" fontSize="md" color="gray.900">
                  Level Tally Entry
                </Text>
                <Text fontSize="xs" color="gray.500" lineHeight="1.5">
                  Enter aggregated tally results at ward, constituency, county,
                  or national level
                </Text>
                <HStack gap={1}>
                  <Badge
                    size="xs"
                    variant="subtle"
                    colorPalette="pink"
                    fontSize="9px"
                    mt={1}
                  >
                    Form B
                  </Badge>
                  <Badge
                    size="xs"
                    variant="subtle"
                    colorPalette="pink"
                    fontSize="9px"
                    mt={1}
                  >
                    Form C
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
          </Box>
        </SimpleGrid>
      </VStack>
    );
  }

  /* ── Admin Level Entry flow (Form B/C) ─────────────────── */
  if (isAdmin && entryMode === "level" && activeElection) {
    return (
      <LevelEntryClient
        electionId={activeElection.election.id}
        positions={activeElection.positions}
        onBack={() => setEntryMode(null)}
      />
    );
  }

  /* ── Step 2: Stream selection (Form A) ─────────────────── */
  if (!selectedStream && activeElection) {
    return (
      <StreamSelector
        isAdmin={isAdmin}
        election={activeElection}
        resultsCache={resultsCache}
        onSelectStream={handleSelectStream}
        onBack={isAdmin ? () => setEntryMode(null) : handleBackToElections}
      />
    );
  }

  /* ── Step 3: Position selection ────────────────────────── */
  if (!selectedPosition && activeElection && activeStreamInfo) {
    const scopedPositions = activeElection.positions.map((p) =>
      filterCandidatesForStream(p, activeStreamInfo),
    );
    return (
      <PositionSelector
        stream={activeStreamInfo}
        positions={scopedPositions}
        streamResults={streamResults}
        onSelect={(pos: Position) => setSelectedPosition(pos.id)}
        onBack={handleBackToStreams}
      />
    );
  }

  /* ── Step 4: Vote entry ────────────────────────────────── */
  if (activePosition && activeStreamInfo) {
    const scopedPosition = filterCandidatesForStream(
      activePosition,
      activeStreamInfo,
    );
    const existing = streamResults.find(
      (r) => r.positionId === activePosition.id,
    );

    return (
      <VoteEntryForm
        position={scopedPosition}
        stream={activeStreamInfo}
        existingResult={existing}
        onBack={handleBackToPositions}
        onSaved={handleSaved}
      />
    );
  }

  return null;
}
