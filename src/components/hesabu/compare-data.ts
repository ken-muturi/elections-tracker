/** Database rows → ComparisonCounty (pure, so the mapping is testable without a database) */
import type { ComparisonCounty, ProjectCoverage } from "./compare-metrics"
import { auditForYear } from "./audit-format"

export type AuditCount = { countyCode: string; fiscalYear: string; findings: number }

export type CountyRow = {
  code: string
  name: string
  totalBudget: bigint
  equitableShare: bigint
  developmentExpenditure: bigint
  revenueTarget: bigint
  revenueCollected: bigint
  devAbsorptionRate: number | null
  sectors: { name: string; allocatedAmount: bigint }[]
}

/** groups: distinct projects (possible duplicates excluded) for the year, by county and status.
 *  scrapedCodes: counties with project rows in any year. null = the project queries failed. */
export type ProjectCounts = { groups: { countyCode: string; status: string; count: number }[]; scrapedCodes: string[] }

function coverageFor(code: string, projects: ProjectCounts | null): ProjectCoverage {
  if (!projects) return { state: "unavailable", total: 0, stalled: 0 }
  if (!projects.scrapedCodes.includes(code)) return { state: "not-scraped", total: 0, stalled: 0 }
  const mine = projects.groups.filter((g) => g.countyCode === code)
  return {
    state: "scraped",
    total: mine.reduce((s, g) => s + g.count, 0),
    stalled: mine.filter((g) => g.status === "stalled").reduce((s, g) => s + g.count, 0),
  }
}

export function toComparisonCounties(
  rows: CountyRow[], projects: ProjectCounts | null, audits: AuditCount[] = [], fiscalYear = "",
): ComparisonCounty[] {
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    totalBudget: Number(r.totalBudget),
    equitableShare: Number(r.equitableShare),
    developmentExpenditure: Number(r.developmentExpenditure),
    revenueTarget: Number(r.revenueTarget),
    revenueCollected: Number(r.revenueCollected),
    devAbsorptionRate: r.devAbsorptionRate,
    sectors: r.sectors.map((s) => ({ name: s.name, allocated: Number(s.allocatedAmount) })),
    projects: coverageFor(r.code, projects),
    audit: (() => {
      const a = fiscalYear ? auditForYear(audits.filter((x) => x.countyCode === r.code), fiscalYear) : null
      return a ? { fiscalYear: a.fiscalYear, findings: a.findings } : null
    })(),
  }))
}
