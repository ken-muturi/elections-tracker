/** County comparison: figure definitions and pure helpers (no I/O). */
import { fmtKesShort } from "./project-format"

export type ProjectCoverage = { state: "scraped" | "not-scraped" | "unavailable"; total: number; stalled: number }

export type ComparisonCounty = {
  code: string
  name: string
  totalBudget: number
  equitableShare: number
  developmentExpenditure: number
  revenueTarget: number
  revenueCollected: number
  devAbsorptionRate: number | null
  sectors: { name: string; allocated: number }[]
  projects: ProjectCoverage
}

export type Direction = "higher-better" | "neutral"
export type MetricGroup = "Budget" | "Performance" | "Sectors" | "Projects"
export type MetricUnit = "kes" | "pct" | "count"

export interface MetricDef {
  key: string
  label: string
  group: MetricGroup
  unit: MetricUnit
  direction: Direction
  value: (c: ComparisonCounty) => number | null
  note?: string
}

export interface ValueRow { code: string; value: number | null }
export interface RankedRow { code: string; value: number; rank: number }
export interface Column { code: string; name: string; county: ComparisonCounty | null }

export const DEFAULT_METRIC = "absorption"
export const MAX_COMPARE = 4
export const METRIC_GROUPS: MetricGroup[] = ["Budget", "Performance", "Sectors", "Projects"]

const EPS = 1e-9

function pctOf(part: number, whole: number): number | null {
  return whole > 0 && Number.isFinite(part) ? (part / whole) * 100 : null
}

const scraped = (pick: (p: ProjectCoverage) => number) => (c: ComparisonCounty) =>
  c.projects.state === "scraped" ? pick(c.projects) : null

const BUDGET_AND_PERFORMANCE: MetricDef[] = [
  { key: "totalBudget", label: "Total budget", group: "Budget", unit: "kes", direction: "neutral", value: (c) => c.totalBudget },
  { key: "equitableShare", label: "Equitable share (DoRA)", group: "Budget", unit: "kes", direction: "neutral", value: (c) => c.equitableShare },
  { key: "devShare", label: "Development share of budget", group: "Budget", unit: "pct", direction: "higher-better",
    value: (c) => pctOf(c.developmentExpenditure, c.totalBudget) },
  { key: "absorption", label: "Development absorption", group: "Performance", unit: "pct", direction: "higher-better",
    value: (c) => c.devAbsorptionRate },
  { key: "revenuePerformance", label: "Revenue collected vs target", group: "Performance", unit: "pct", direction: "higher-better",
    value: (c) => pctOf(c.revenueCollected, c.revenueTarget) },
]

const PROJECTS: MetricDef[] = [
  { key: "projects", label: "Documented projects", group: "Projects", unit: "count", direction: "neutral",
    value: scraped((p) => p.total), note: "From scraped public documents" },
  { key: "stalledProjects", label: "Documented stalled projects", group: "Projects", unit: "count", direction: "neutral",
    value: scraped((p) => p.stalled) },
]

/** All figures for this set of counties: one sector-share figure per sector name present */
export function buildMetrics(counties: ComparisonCounty[]): MetricDef[] {
  const names = [...new Set(counties.flatMap((c) => c.sectors.map((s) => s.name)))].sort((a, b) => a.localeCompare(b))
  const sectors: MetricDef[] = names.map((name) => ({
    key: `sector:${name}`,
    label: `${name} share of budget`,
    group: "Sectors",
    unit: "pct",
    direction: "neutral",
    value: (c) => {
      const s = c.sectors.find((x) => x.name === name)
      return s ? pctOf(s.allocated, c.totalBudget) : null
    },
  }))
  return [...BUDGET_AND_PERFORMANCE, ...sectors, ...PROJECTS]
}

export function pickMetric(metrics: MetricDef[], key: string | undefined): MetricDef {
  return metrics.find((m) => m.key === key) ?? metrics.find((m) => m.key === DEFAULT_METRIC)!
}

/** True when every county has (practically) the same value: such a figure can't be ranked */
export function isUniform(values: (number | null)[], unit: MetricUnit): boolean {
  const v = values.filter((x): x is number => x !== null)
  if (v.length < 2) return false
  const max = Math.max(...v)
  const min = Math.min(...v)
  const spread = max - min
  if (unit === "pct") return spread < 0.05
  const scale = Math.max(Math.abs(max), Math.abs(min))
  return scale === 0 || spread / scale < 0.001
}

/** Codes holding the best value; empty for neutral or uniform figures or fewer than 2 values */
export function bestOf(metric: MetricDef, rows: ValueRow[], uniform: boolean): string[] {
  if (metric.direction === "neutral" || uniform) return []
  const present = rows.filter((r): r is { code: string; value: number } => r.value !== null)
  if (present.length < 2) return []
  const best = Math.max(...present.map((r) => r.value))
  return present.filter((r) => Math.abs(r.value - best) < EPS).map((r) => r.code)
}

/** Highest first; ties share a rank (1, 2, 2, 4); null values listed as missing */
export function rankRows(rows: ValueRow[]): { ranked: RankedRow[]; missing: string[] } {
  const present = rows
    .filter((r): r is { code: string; value: number } => r.value !== null)
    .sort((a, b) => b.value - a.value)
  const ranked: RankedRow[] = []
  present.forEach((r, i) => {
    const prev = ranked[i - 1]
    const rank = prev && Math.abs(prev.value - r.value) < EPS ? prev.rank : i + 1
    ranked.push({ code: r.code, value: r.value, rank })
  })
  return { ranked, missing: rows.filter((r) => r.value === null).map((r) => r.code) }
}

export function formatValue(unit: MetricUnit, v: number | null): string {
  if (v === null) return "—"
  if (unit === "kes") return fmtKesShort(v)
  if (unit === "pct") return `${v.toFixed(1)}%`
  return v.toLocaleString("en-KE")
}

export function ordinal(n: number): string {
  const lastTwo = n % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`
}

/** Columns for the side-by-side table, in URL order; county is null when it has no data for the year */
export function selectedColumns(codes: string[], counties: ComparisonCounty[], options: { code: string; name: string }[]): Column[] {
  return codes.map((code) => {
    const county = counties.find((c) => c.code === code) ?? null
    return { code, name: county?.name ?? options.find((o) => o.code === code)?.name ?? code, county }
  })
}

export function cellText(metric: MetricDef, county: ComparisonCounty | null, year: string): string {
  if (!county) return `No data for FY ${year}`
  const v = metric.value(county)
  if (v === null && metric.group === "Projects") {
    if (county.projects.state === "not-scraped") return "Not yet scraped"
    if (county.projects.state === "unavailable") return "Unavailable"
  }
  return formatValue(metric.unit, v)
}
