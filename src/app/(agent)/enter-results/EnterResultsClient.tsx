"use client"

import { useState, useCallback, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Box,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";
import { getStreamResultsForStream } from "@/services/AgentAssignments"
import ElectionSelector from "./ElectionSelector"
import StreamSelector from "./StreamSelector"
import PositionSelector from "./PositionSelector"
import VoteEntryForm from "./VoteEntryForm"
import LevelEntryClient from "./LevelEntryClient";

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
  // Default to "stream" so tabs render immediately without a mode-picker step
  const [entryMode, setEntryMode] = useState<"stream" | "level">("stream");

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

  /* ── Step 2 (admin): Tab bar — stream entry vs level entry ── */
  if (isAdmin && selectedElection && activeElection && !selectedStream) {
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
              Enter results for this election
            </Text>
          </VStack>
        </HStack>

        {/* ── Tab bar ── */}
        <HStack
          gap={0}
          bg="gray.100"
          borderRadius="xl"
          p={1}
        >
          {([
            { key: "stream" as const, label: "Stream Entry (Form A)" },
            { key: "level" as const, label: "Level Tally (Form B/C)" },
          ]).map(({ key, label }) => (
            <Box
              key={key}
              as="button"
              onClick={() => setEntryMode(key)}
              flex={1}
              py={2}
              borderRadius="lg"
              fontSize="sm"
              fontWeight="600"
              textAlign="center"
              cursor="pointer"
              transition="all 0.15s"
              bg={entryMode === key ? "white" : "transparent"}
              color={entryMode === key ? "gray.900" : "gray.500"}
              boxShadow={entryMode === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none"}
              _hover={{ color: "gray.900" }}
            >
              {label}
            </Box>
          ))}
        </HStack>

        {/* ── Tab content ── */}
        {entryMode === "stream" ? (
          <StreamSelector
            isAdmin
            election={activeElection}
            resultsCache={resultsCache}
            onSelectStream={handleSelectStream}
            onBack={handleBackToElections}
          />
        ) : (
          <LevelEntryClient
            electionId={activeElection.election.id}
            positions={activeElection.positions}
            onBack={handleBackToElections}
          />
        )}
      </VStack>
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
        onBack={handleBackToElections}
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
