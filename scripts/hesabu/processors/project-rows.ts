/** Scraper output → h_projects rows (pure; the loader does the DB writes) */
import { createHash } from "crypto"
import type { ExtractedReport } from "../lib/claude"
import type { ConstituencyWards } from "../lib/wards"
import { matchCard, Card } from "./location-matcher"
import { contractNumber, flagPossibleDuplicates } from "./possible-duplicates"

export interface ProjectRow {
  countyCode: string
  fiscalYear: string
  cardName: string | null
  locationText: string | null
  matchedOn: string | null
  title: string
  sector: string
  status: string
  budgetAllocated: bigint | null
  budgetSpent: bigint | null
  summary: string
  confidence: string
  primarySource: string
  sources: { source: string; url: string }[]
  sourceDate: string | null
  dedupKey: string
  /** dedupKey of the row this one probably duplicates (set by flagPossibleDuplicates) */
  possibleDuplicateOf: string | null
  scrapedAt: Date
}

export interface LoadStats {
  total: number
  placed: number
  byMethod: Record<"card-name" | "ward" | "constituency", number>
  countyWide: number
  unknownFy: number
  skippedEmpty: number
  duplicates: number
  /** Same contract number + amount posted under several tender records → merged into one row */
  mergedContracts: number
  /** Rows flagged as possibly the same project as another row (kept, linked, counted once in totals) */
  possibleDuplicates: number
  /** Items whose only source is Hawkeye — Auditor-General findings, loaded by load-audit instead */
  skippedAuditOnly: number
}

const normTitle = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim()


export function dedupKey(fiscalYear: string, title: string, amount?: number): string {
  return createHash("sha1").update(`${fiscalYear}|${normTitle(title)}|${amount ?? ""}`).digest("hex")
}

const toBig = (n?: number) => (n == null || !isFinite(n) ? null : BigInt(Math.round(n)))
const cut = (s: string | undefined | null, n: number) => (s ? s.slice(0, n) : null)

export function buildProjectRows(
  input: { countyCode: string; countyName: string; scrapedAt: string; reports: ExtractedReport[] },
  cards: Card[],
  constituencies: ConstituencyWards[]
): { rows: ProjectRow[]; stats: LoadStats } {
  const stats: LoadStats = {
    total: input.reports.length, placed: 0, byMethod: { "card-name": 0, ward: 0, constituency: 0 },
    countyWide: 0, unknownFy: 0, skippedEmpty: 0, duplicates: 0, mergedContracts: 0, possibleDuplicates: 0, skippedAuditOnly: 0,
  }
  const rows: ProjectRow[] = []
  const seen = new Set<string>()
  const byContract = new Map<string, ProjectRow>()

  for (const r of input.reports) {
    const title = r.title?.trim()
    if (!title) { stats.skippedEmpty++; continue }
    const srcKeys = r.sources?.length ? r.sources.map((s) => s.source) : r.source ? [r.source] : []
    if (srcKeys.length > 0 && srcKeys.every((s) => s === "hawkeye")) { stats.skippedAuditOnly++; continue }
    const key = dedupKey(r.fiscalYear, title, r.budgetAllocated)
    if (seen.has(key)) { stats.duplicates++; continue }

    // Exact duplicate: one contract posted under several tender records — keep one row, all links
    const contract = contractNumber(r.summary)
    const contractKey = contract ? `${r.fiscalYear}|${contract}|${Math.round(r.budgetAllocated ?? 0)}` : null
    const sameContract = contractKey ? byContract.get(contractKey) : undefined
    if (sameContract) {
      for (const ref of r.sources?.length ? r.sources : [{ source: r.source ?? "unknown", url: r.sourceUrl }])
        if (!sameContract.sources.some((x) => x.url === ref.url)) sameContract.sources.push(ref)
      stats.mergedContracts++
      continue
    }
    seen.add(key)
    if (r.fiscalYear === "unknown") stats.unknownFy++

    const m = matchCard({ ward: r.ward, title, summary: r.summary ?? "" }, cards, constituencies, input.countyName)
    if (m.cardName && m.method) { stats.placed++; stats.byMethod[m.method]++ } else stats.countyWide++

    rows.push({
      countyCode: input.countyCode,
      fiscalYear: r.fiscalYear,
      cardName: m.cardName,
      locationText: cut(r.ward, 300),
      matchedOn: cut(m.matchedOn, 150),
      title: title.slice(0, 500),
      sector: (r.sector || "Other").slice(0, 100),
      status: r.status,
      budgetAllocated: toBig(r.budgetAllocated),
      budgetSpent: toBig(r.budgetSpent),
      summary: r.summary ?? "",
      confidence: r.confidence,
      primarySource: r.source ?? r.sources?.[0]?.source ?? "unknown",
      sources: r.sources?.length ? [...r.sources] : [{ source: r.source ?? "unknown", url: r.sourceUrl }],
      sourceDate: cut(r.sourceDate, 20),
      dedupKey: key,
      possibleDuplicateOf: null,
      scrapedAt: new Date(input.scrapedAt),
    })
    if (contractKey) byContract.set(contractKey, rows[rows.length - 1])
  }
  stats.possibleDuplicates = flagPossibleDuplicates(rows)
  return { rows, stats }
}
