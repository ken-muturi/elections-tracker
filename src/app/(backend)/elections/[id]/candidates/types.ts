import type { Candidate } from "@prisma/client"
import type { Party } from "@/services/Parties"

/* ── Component props ─────────────────────────────────────── */

export type CandidateManagerProps = {
  positionId: string
  positionType: string
  aggregationLevel: string
  initialCandidates: Candidate[]
  parties?: Party[]
}

/* ── CSV row parsed from file ────────────────────────────── */

export type CsvRow = {
  name: string
  party: string
  entityId: string
}

/* ── Required column definition ──────────────────────────── */

export type ColumnDef = {
  header: string
  description: string
  required: boolean
}
