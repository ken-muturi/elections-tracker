"use client"

import { useState, useCallback } from "react"
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

  /* ── Results cache (mutable across steps) ──────────────── */
  const [resultsCache, setResultsCache] = useState<
    Record<string, StreamResult[]>
  >(() => {
    const cache: Record<string, StreamResult[]> = {}
    for (const e of electionData) {
      for (const [streamId, results] of Object.entries(e.streamResultsMap)) {
        cache[streamId] = results
      }
    }
    return cache
  })

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

  const streamResults = selectedStream
    ? (resultsCache[selectedStream] ?? [])
    : []

  /* ── Handlers ──────────────────────────────────────────── */

  const handleSelectStream = useCallback(
    async (streamId: string, adminStream?: AdminSearchStream) => {
      setSelectedStream(streamId)
      if (adminStream) setAdminActiveStream(adminStream)

      // Lazy-load existing results for the selected stream
      if (!resultsCache[streamId]) {
        try {
          const results = await getStreamResultsForStream(streamId)
          setResultsCache((prev) => ({
            ...prev,
            [streamId]: results as unknown as StreamResult[],
          }))
        } catch {
          // No results yet — fine
        }
      }
    },
    [resultsCache],
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
      setResultsCache((prev) => {
        const existing = prev[selectedStream] ?? []
        const filtered = existing.filter(
          (r) => r.positionId !== result.positionId,
        )
        filtered.push(result)
        return { ...prev, [selectedStream]: filtered }
      })
    },
    [selectedStream],
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
