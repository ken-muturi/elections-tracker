"use client"

import { useState, useCallback, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getStreamResultsForStream } from "@/services/AgentAssignments"
import ElectionSelector from "./ElectionSelector"
import StreamSelector from "./StreamSelector"
import PositionSelector from "./PositionSelector"
import VoteEntryForm from "./VoteEntryForm"
import type {
  ElectionData, Position, StreamResult, AdminSearchStream, StreamInfo,
} from "./types"

/* ── Props ─────────────────────────────────────────────────── */

type Props = {
  electionData: ElectionData[]
  isAdmin?: boolean
}

/* ── Component ─────────────────────────────────────────────── */

export default function EnterResultsClient({
  electionData,
  isAdmin = false,
}: Props) {
  /* ── Navigation state ──────────────────────────────────── */
  const [selectedElection, setSelectedElection] = useState<string | null>(
    electionData.length === 1 ? electionData[0].election.id : null,
  )
  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null)

  // Admin: the full stream object (for display) selected via search
  const [adminActiveStream, setAdminActiveStream] =
    useState<AdminSearchStream | null>(null)

  /* ── Results cache via React Query ─────────────────────── */
  const queryClient = useQueryClient()

  // Seed query cache with server-fetched results on first render
  useState(() => {
    for (const e of electionData) {
      for (const [streamId, results] of Object.entries(e.streamResultsMap)) {
        queryClient.setQueryData<StreamResult[]>(
          ["stream-results", streamId],
          results,
        )
      }
    }
  })

  // Fetch results for the selected stream (auto-cached by React Query)
  const { data: streamResults = [] } = useQuery<StreamResult[]>({
    queryKey: ["stream-results", selectedStream],
    queryFn: () =>
      getStreamResultsForStream(selectedStream!) as Promise<StreamResult[]>,
    enabled: !!selectedStream,
    staleTime: 5 * 60 * 1000, // 5 min — avoid re-fetching within a session
  })

  // Also build the full cache map for child components that need it
  const resultsCache = useMemo(() => {
    const cache: Record<string, StreamResult[]> = {}
    for (const e of electionData) {
      for (const streamId of Object.keys(e.streamResultsMap)) {
        const cached = queryClient.getQueryData<StreamResult[]>([
          "stream-results",
          streamId,
        ])
        if (cached) cache[streamId] = cached
      }
    }
    if (selectedStream && streamResults.length > 0) {
      cache[selectedStream] = streamResults
    }
    return cache
  }, [electionData, queryClient, selectedStream, streamResults])

  /* ── Derived data ──────────────────────────────────────── */
  const activeElection = electionData.find(
    (e) => e.election.id === selectedElection,
  )

  const activeStreamInfo: StreamInfo | undefined = isAdmin
    ? adminActiveStream ?? undefined
    : activeElection?.streams.find((s) => s.stream.id === selectedStream)
        ?.stream

  const activePosition = activeElection?.positions.find(
    (p) => p.id === selectedPosition,
  )

  /* ── Handlers ──────────────────────────────────────────── */

  const handleSelectStream = useCallback(
    (streamId: string, adminStream?: AdminSearchStream) => {
      setSelectedStream(streamId)
      if (adminStream) setAdminActiveStream(adminStream)
      // useQuery will automatically fetch results for the new streamId
    },
    [],
  )

  const handleBackToElections = useCallback(() => {
    setSelectedElection(null)
  }, [])

  const handleBackToStreams = useCallback(() => {
    setSelectedStream(null)
    setAdminActiveStream(null)
  }, [])

  const handleBackToPositions = useCallback(() => {
    setSelectedPosition(null)
  }, [])

  const handleSaved = useCallback(
    (result: StreamResult) => {
      if (!selectedStream) return
      queryClient.setQueryData<StreamResult[]>(
        ["stream-results", selectedStream],
        (prev = []) => {
          const filtered = prev.filter(
            (r) => r.positionId !== result.positionId,
          )
          return [...filtered, result]
        },
      )
    },
    [selectedStream, queryClient],
  )

  /* ── Step 1: Election selection ────────────────────────── */
  if (!selectedElection) {
    return (
      <ElectionSelector
        electionData={electionData}
        isAdmin={isAdmin}
        onSelect={setSelectedElection}
      />
    )
  }

  /* ── Step 2: Stream selection ──────────────────────────── */
  if (!selectedStream && activeElection) {
    return (
      <StreamSelector
        isAdmin={isAdmin}
        election={activeElection}
        resultsCache={resultsCache}
        onSelectStream={handleSelectStream}
        onBack={handleBackToElections}
      />
    )
  }

  /* ── Step 3: Position selection ────────────────────────── */
  if (!selectedPosition && activeElection && activeStreamInfo) {
    return (
      <PositionSelector
        stream={activeStreamInfo}
        positions={activeElection.positions}
        streamResults={streamResults}
        onSelect={(pos: Position) => setSelectedPosition(pos.id)}
        onBack={handleBackToStreams}
      />
    )
  }

  /* ── Step 4: Vote entry ────────────────────────────────── */
  if (activePosition && activeStreamInfo) {
    const existing = streamResults.find(
      (r) => r.positionId === activePosition.id,
    )

    return (
      <VoteEntryForm
        position={activePosition}
        stream={activeStreamInfo}
        existingResult={existing}
        onBack={handleBackToPositions}
        onSaved={handleSaved}
      />
    )
  }

  return null
}
