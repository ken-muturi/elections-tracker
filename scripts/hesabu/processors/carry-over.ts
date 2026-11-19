/**
 * Carry-over safeguard: when a source fails (or is skipped) in a run, keep the items it
 * found in the previous run instead of silently dropping them. Without this, a run with
 * no Claude credit, or a `--only=tenders` run, overwrites a county's file with a thinner one.
 */
import type { ExtractedReport } from "../lib/claude"
import type { SourceKey } from "../lib/sources"

export interface PreviousOutput {
  scrapedAt: string
  reports: ExtractedReport[]
}

export function carryOverReports(
  previous: PreviousOutput | null,
  notRun: SourceKey[]
): { reports: ExtractedReport[]; counts: Partial<Record<SourceKey, number>> } {
  const reports: ExtractedReport[] = []
  const counts: Partial<Record<SourceKey, number>> = {}
  if (!previous || notRun.length === 0) return { reports, counts }
  const missing = new Set(notRun)

  for (const r of previous.reports) {
    const refs = r.sources?.length ? r.sources : r.source ? [{ source: r.source, url: r.sourceUrl }] : []
    // Keep only the refs of sources that did not run; sources that did run re-supply their own copy
    const kept = refs.filter((ref) => missing.has(ref.source))
    if (kept.length === 0) continue
    for (const key of new Set(kept.map((k) => k.source))) counts[key] = (counts[key] ?? 0) + 1
    reports.push({
      ...r,
      source: kept[0].source,
      sourceUrl: kept[0].url,
      sources: kept.map((k) => ({ ...k })),
      carriedOverFrom: r.carriedOverFrom ?? previous.scrapedAt,
    })
  }
  return { reports, counts }
}
