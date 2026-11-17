/** Pure formatting helpers for the Hesabu project drill-down (no React, no server imports) */

/**
 * Project count and cost for one group — a ward card (key = card name, null = county-wide)
 * or a sector (key = sector name). Possible duplicates are counted in `count` but their
 * amounts are excluded from `withAmount` / `totalAllocated`, so a project is never paid for twice.
 */
export type ProjectCardSummary = {
  key: string | null
  count: number
  possibleDuplicates: number
  withAmount: number
  totalAllocated: number
}

export function fmtKesShort(n: number): string {
  if (n >= 1e9) return `KES ${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `KES ${(n / 1e6).toFixed(1)}M`
  return `KES ${Math.round(n).toLocaleString("en-KE")}`
}

export function projectTotalLabel(s: ProjectCardSummary): string {
  if (s.withAmount === 0) return "amounts not stated"
  const total = fmtKesShort(s.totalAllocated)
  const distinct = s.count - (s.possibleDuplicates ?? 0)
  return s.withAmount < distinct ? `${total} (stated for ${s.withAmount} of ${distinct})` : total
}

export function projectLine(s: ProjectCardSummary | undefined): string {
  if (!s || s.count === 0) return "No documented projects yet"
  const dups = s.possibleDuplicates ?? 0
  const dupNote = dups > 0 ? ` · ${dups} possible duplicate${dups === 1 ? "" : "s"}` : ""
  return `📄 ${s.count} documented project${s.count === 1 ? "" : "s"} · ${projectTotalLabel(s)}${dupNote}`
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("")
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

/** Wards below the threshold that are also in the bottom third by satisfaction (max 3), lowest first */
export function pickEquityFlags<T extends { citizenSatisfactionScore: number }>(wards: T[], threshold = 50): T[] {
  const limit = Math.min(3, Math.ceil(wards.length / 3))
  return [...wards]
    .sort((a, b) => a.citizenSatisfactionScore - b.citizenSatisfactionScore)
    .slice(0, limit)
    .filter((w) => w.citizenSatisfactionScore < threshold)
}

/** Resolve to `fallback` (and log) if an optional query fails, so one section can't take down the page */
export async function orFallback<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise
  } catch (err) {
    console.error(`[hesabu] ${label} unavailable:`, err instanceof Error ? err.message : err)
    return fallback
  }
}
