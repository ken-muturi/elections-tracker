/**
 * Report deduplicator — merges reports with same title/county/FY
 * and upgrades confidence level when multiple sources agree
 */

import { ExtractedReport } from "../lib/claude"

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.9
  // Simple character overlap
  const setA = new Set(na.split(""))
  const setB = new Set(nb.split(""))
  const intersection = Array.from(setA).filter((c) => setB.has(c)).length
  return (2 * intersection) / (setA.size + setB.size)
}

export function deduplicateReports(reports: ExtractedReport[]): ExtractedReport[] {
  const merged: ExtractedReport[] = []

  for (const report of reports) {
    const existing = merged.find(
      (m) =>
        m.fiscalYear === report.fiscalYear &&
        m.sector === report.sector &&
        similarity(m.title, report.title) > 0.7
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

      // Merge summaries
      if (report.summary.length > existing.summary.length)
        existing.summary = report.summary

    } else {
      merged.push({ ...report })
    }
  }

  return merged
}
