/**
 * Flags rows that look like the same project reported by different records/sources
 * (e.g. a CoB status line and the tenders.go.ke contract for the same water pan).
 * Flag, don't merge: the secondary row gets possibleDuplicateOf = the primary's dedupKey.
 * Pure — no I/O.
 */
/** Contract number from the tenders scraper's summary ("Contract 011750 awarded …"), if any */
export function contractNumber(summary: string | undefined): string | null {
  return summary?.match(/^Contract (\S+) awarded/)?.[1] ?? null
}

export interface Flaggable {
  fiscalYear: string
  title: string
  summary: string
  budgetAllocated: bigint | null
  primarySource: string
  dedupKey: string
  possibleDuplicateOf: string | null
}

/** Words that describe the kind of work, not which project it is */
const STOP = new Set([
  "the", "and", "for", "with", "within", "from", "into", "phase", "proposed", "construction", "construct",
  "completion", "complete", "supply", "delivery", "installation", "establishment", "rehabilitation",
  "renovation", "upgrading", "upgrade", "proposed", "works", "work", "project", "county", "ward",
  "sub", "constituency", "government", "lot", "tender", "contract", "provision", "proposal",
])

/** A word is distinctive if it appears in at most this many titles in the batch (Kotulo yes, "Digital Hub" no) */
const MAX_DOC_FREQ = 2
const MIN_WORDS = 3
const MIN_OVERLAP = 0.75
const AMOUNT_TOLERANCE = 0.02

function words(title: string): Set<string> {
  return new Set(
    title.toLowerCase().replace(/(\d),(\d)/g, "$1$2").split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !STOP.has(w))
  )
}

function amountsAgree(a: bigint | null, b: bigint | null): boolean {
  if (a == null || b == null) return true
  const x = Number(a), y = Number(b)
  return Math.abs(x - y) / Math.max(x, y, 1) <= AMOUNT_TOLERANCE
}

/** Row to keep as primary: has an amount, then is a tenders record, then first seen */
function rank(r: Flaggable): number {
  return (r.budgetAllocated != null ? 2 : 0) + (r.primarySource === "tenders" ? 1 : 0)
}

/** Flags possible duplicates in place; returns how many rows were flagged */
export function flagPossibleDuplicates(rows: Flaggable[]): number {
  const all = rows.map((r) => words(r.title))
  const df = new Map<string, number>()
  for (const t of all) for (const w of t) df.set(w, (df.get(w) ?? 0) + 1)
  // Compare only distinctive words, so shared templates ("Boma Yangu … Estate") don't look alike
  const toks = all.map((t) => new Set([...t].filter((w) => (df.get(w) ?? 0) <= MAX_DOC_FREQ)))
  let flagged = 0

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i], b = rows[j]
      if (a.possibleDuplicateOf || b.possibleDuplicateOf) continue
      if (a.fiscalYear !== b.fiscalYear) continue
      const ta = toks[i], tb = toks[j]
      if (Math.min(ta.size, tb.size) < MIN_WORDS) continue
      const ca = contractNumber(a.summary), cb = contractNumber(b.summary)
      if (ca && cb && ca !== cb) continue // two different contracts are two different things
      if (!amountsAgree(a.budgetAllocated, b.budgetAllocated)) continue
      let shared = 0
      for (const w of ta) if (tb.has(w)) shared++
      if (shared / Math.min(ta.size, tb.size) < MIN_OVERLAP) continue

      const [primary, secondary] = rank(b) > rank(a) ? [b, a] : [a, b]
      secondary.possibleDuplicateOf = primary.dedupKey
      flagged++
    }
  }
  return flagged
}
