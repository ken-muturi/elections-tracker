/**
 * Report deduplicator — merges reports with same title/county/FY
 * and upgrades confidence level when multiple sources agree
 */

import { ExtractedReport } from "../lib/claude"

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

const STOPWORDS = new Set(["of", "the", "and", "at", "in", "for", "to", "a", "on", "county", "proposed"])

function words(s: string): Set<string> {
  return new Set(
    s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOPWORDS.has(w))
  )
}

/** Word-level Jaccard similarity (0–1). Exact/contained titles score high. */
function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  const shorter = na.length < nb.length ? na : nb
  if (shorter.length >= 20 && (na.includes(nb) || nb.includes(na))) return 0.9

  const wa = words(a)
  const wb = words(b)
  if (wa.size === 0 || wb.size === 0) return 0
  const intersection = Array.from(wa).filter((w) => wb.has(w)).length
  return intersection / (wa.size + wb.size - intersection)
}

/** Two known amounts that differ by more than 5% mean different items */
function amountsConflict(x?: number, y?: number): boolean {
  if (!x || !y) return false
  return Math.abs(x - y) / Math.max(x, y) > 0.05
}

export function deduplicateReports(reports: ExtractedReport[]): ExtractedReport[] {
  const merged: ExtractedReport[] = []

  for (const report of reports) {
    const existing = merged.find(
      (m) =>
        m.fiscalYear === report.fiscalYear &&
        m.sector === report.sector &&
        similarity(m.title, report.title) >= 0.8 &&
        !amountsConflict(m.budgetAllocated, report.budgetAllocated)
    )

    if (existing) {
      // Upgrade confidence if multiple sources agree
      if (report.confidence === "verified") existing.confidence = "verified"
      else if (report.confidence === "reported" && existing.confidence === "estimated")
        existing.confidence = "reported"

      // Prefer non-null budget figures
      if (!existing.budgetAllocated && report.budgetAllocated)
        existing.budgetAllocated = report.budgetAllocated
      if (!existing.budgetSpent && report.budgetSpent)
        existing.budgetSpent = report.budgetSpent
      if (!existing.absorptionRate && report.absorptionRate)
        existing.absorptionRate = report.absorptionRate

      // Keep every source the item was found in
      const refs = existing.sources ?? []
      for (const ref of report.sources ?? []) {
        if (!refs.some((r) => r.source === ref.source && r.url === ref.url)) refs.push(ref)
      }
      existing.sources = refs

      // Merge summaries
      if (report.summary.length > existing.summary.length)
        existing.summary = report.summary

    } else {
      merged.push({ ...report, sources: [...(report.sources ?? [])] })
    }
  }

  return merged
}
