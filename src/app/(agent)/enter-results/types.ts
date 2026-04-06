/* ── enter-results shared types ─────────────────────────────── */

export type Candidate = {
  id: string
  name: string
  party: string | null
  sortOrder: number
}

export type Position = {
  id: string
  type: string
  title: string
  aggregationLevel: string
  candidates: Candidate[]
}

export type StreamResultVote = {
  candidateId: string
  votes: number
  candidate: Candidate
}

export type StreamResult = {
  id: string
  streamId: string
  positionId: string
  status: string
  totalVotes: number | null
  rejectedVotes: number | null
  notes: string | null
  votes: StreamResultVote[]
  position: { id: string; type: string; title: string }
}

export type PollingStation = {
  id: string
  name: string
  code: string
  county: string
  constituency: string
  ward: string
  registeredVoters: number | null
}

export type StreamInfo = {
  id: string
  name: string
  code: string
  registeredVoters: number | null
  pollingStation: PollingStation
}

/** An assignment-based stream (agent flow) */
export type Stream = {
  id: string
  stream: StreamInfo
}

export type ElectionData = {
  election: {
    id: string
    title: string
    year: number
    electionDate: string
  }
  streams: Stream[]
  positions: Position[]
  streamResultsMap: Record<string, StreamResult[]>
}

/** A search-result stream (admin flow) */
export type AdminSearchStream = {
  id: string
  name: string
  code: string
  registeredVoters: number | null
  pollingStation: PollingStation
}
