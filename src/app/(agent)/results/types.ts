/* ── Results page types ─────────────────────────────────────── */

export type CandidateVote = {
  candidateId: string
  votes: number
  candidate: { id: string; name: string; party: string | null }
}

export type Result = {
  id: string
  streamId: string
  positionId: string
  status: string
  totalVotes: number | null
  rejectedVotes: number | null
  notes: string | null
  submittedAt: string
  stream: {
    id: string
    name: string
    code: string
    pollingStation: {
      name: string
      code: string
      county: string
      constituency: string
      ward: string
    }
  }
  position: { type: string; title: string }
  votes: CandidateVote[]
}

export type ElectionResult = {
  election: {
    id: string
    title: string
    year: number
    electionDate: string
  }
  results: Result[]
}
