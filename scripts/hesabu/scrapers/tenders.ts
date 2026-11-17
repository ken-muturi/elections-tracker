/**
 * Public Procurement Information Portal (PPIP) — https://tenders.go.ke
 *
 * Open JSON API (Laravel), no auth. robots.txt allows all.
 * Rate limit: X-RateLimit-Limit 60/min but 429s arrive sooner — we pace ~3.5s/request
 * and back off on 429. Full-text `search=` is very slow, so we filter by entity ID instead.
 *
 *   GET /api/explore-contracts                       → financial-year IDs
 *   GET /api/get/explored-pe?clauses=[pe_type_id=44] → county government entities (paged)
 *   GET /api/get/explored-contracts?clauses=[pe_id, financial_year_id]&page=N → awarded contracts (10/page)
 *
 * Each awarded contract becomes a report (structured — no Claude needed).
 * budgetAllocated = contract value (not money spent).
 */

import axios from "axios"
import { CountyMeta } from "../constants"
import { ExtractedReport, guessSector } from "../lib/claude"

const BASE = "https://tenders.go.ke"
const COUNTY_GOVERNMENT_PE_TYPE = 44
/** How many of the most recent financial years to pull */
const YEARS_TO_FETCH = 2
/** Skip very small purchases (KES) — keeps output focused on projects */
const MIN_CONTRACT_KES = 1_000_000
const MAX_PAGES_PER_YEAR = 40
const REQUEST_GAP_MS = 3500

let _last = 0

async function getJson<T>(pathAndQuery: string): Promise<T | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = _last + REQUEST_GAP_MS - Date.now()
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    _last = Date.now()
    try {
      const res = await axios.get<T>(`${BASE}${pathAndQuery}`, {
        headers: { Accept: "application/json" },
        timeout: 60_000,
      })
      return res.data
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        console.warn("     ⏳ tenders.go.ke rate limit — waiting 70s")
        await new Promise((r) => setTimeout(r, 70_000))
        continue
      }
      const msg = err instanceof Error ? err.message : String(err)
      const transient = axios.isAxiosError(err) && (!err.response || err.response.status >= 500)
      if (transient && attempt < 3) {
        console.warn(`     ↻ tenders.go.ke ${msg} — retrying`)
        await new Promise((r) => setTimeout(r, 10_000 * (attempt + 1)))
        continue
      }
      console.warn(`  ⚠  tenders.go.ke request failed: ${msg}`)
      return null
    }
  }
  return null
}

interface Clause { col: string; value: number; type: "nominal" }
const clausesParam = (clauses: Clause[]) => `clauses=${encodeURIComponent(JSON.stringify(clauses))}`

interface Page<T> { data: T[]; current_page: number; last_page: number; total: number }

interface Entity { id: number; name: string; county_id: number; contracts_count?: number }

interface Contract {
  id: number
  contract_number: string
  amount: number
  award_date?: string
  start_date?: string
  end_date?: string
  terminated: number
  is_ammended: number
  financial_year?: { name: string }
  supplier?: { name: string }
  tender?: {
    id: number
    title?: string
    tender_ref?: string
    procurement_method?: { title: string }
  }
}

// ─── Lookups (fetched once per run) ──────────────────────────────────────────

let _years: Promise<{ label: string; value: number }[]> | null = null
let _entities: Promise<Entity[]> | null = null

async function loadYears() {
  type Topic = { col: string; subtopics: { label: string; value: number }[] }
  const topics = await getJson<Topic[]>("/api/explore-contracts")
  const fy = topics?.find((t) => t.col === "financial_year_id")?.subtopics ?? []
  // Labels like "2025/2026" — newest first, skip years that haven't started
  const thisYear = new Date().getFullYear()
  return fy
    .filter((y) => /^\d{4}\/\d{4}$/.test(y.label) && parseInt(y.label) <= thisYear)
    .sort((a, b) => parseInt(b.label) - parseInt(a.label))
}

async function loadEntities(): Promise<Entity[]> {
  const clauses = clausesParam([{ col: "pe_type_id", value: COUNTY_GOVERNMENT_PE_TYPE, type: "nominal" }])
  const all: Entity[] = []
  for (let page = 1; page <= 20; page++) {
    const res = await getJson<Page<Entity>>(`/api/get/explored-pe?${clauses}&page=${page}`)
    if (!res) break
    all.push(...res.data)
    if (page >= res.last_page) break
  }
  console.log(`  → ${all.length} county government procuring entities on tenders.go.ke`)
  return all
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "")

function entitiesFor(entities: Entity[], countyName: string): Entity[] {
  const target = norm(countyName)
  return entities.filter((e) => {
    const n = norm(e.name).replace(/^(thecountygovernmentof|countygovernmentof)/, "")
    return n.startsWith(target)
  })
}

// ─── Mapping ─────────────────────────────────────────────────────────────────

const fmtKes = (n: number) => `KES ${Math.round(n).toLocaleString("en-KE")}`

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\.$/, "").trim()
}

function wardFromTitle(title: string): string | undefined {
  const m = title.match(/\b(?:in|at)\s+([A-Za-z' -]+?)\s+ward\b/i)
  return m ? titleCase(m[1]) : undefined
}

function toReport(c: Contract): ExtractedReport | null {
  const title = c.tender?.title?.trim()
  if (!title || !c.tender) return null

  const parts = [
    `Contract ${c.contract_number} awarded${c.award_date ? ` on ${c.award_date}` : ""} to ${c.supplier?.name ?? "an unnamed supplier"} for ${fmtKes(c.amount)}`,
    c.tender.procurement_method?.title ? `via ${c.tender.procurement_method.title}` : "",
  ].filter(Boolean)
  let summary = parts.join(" ") + "."
  if (c.start_date || c.end_date) summary += ` Contract period ${c.start_date ?? "?"} to ${c.end_date ?? "?"}.`
  if (c.terminated) summary += " The contract was TERMINATED."
  if (c.is_ammended) summary += " The contract was varied/amended."
  summary += " Amount is the awarded contract value, not expenditure."

  return {
    title: titleCase(title),
    fiscalYear: c.financial_year?.name ?? "unknown",
    sector: guessSector(title),
    ward: wardFromTitle(title),
    budgetAllocated: c.amount,
    status: "unknown",
    summary,
    confidence: "verified",
    sourceUrl: `${BASE}/tenders/${c.tender.id}`,
  }
}

// ─── Main entry ──────────────────────────────────────────────────────────────

export async function scrapeTendersForCounty(county: CountyMeta): Promise<ExtractedReport[]> {
  console.log(`\n📑 Scraping awarded contracts (tenders.go.ke) for ${county.name}...`)

  _years ??= loadYears()
  _entities ??= loadEntities()
  const years = (await _years).slice(0, YEARS_TO_FETCH)
  const entities = entitiesFor(await _entities, county.name)

  if (entities.length === 0) {
    console.warn(`  ⚠  No procuring entity found for ${county.name}`)
    return []
  }

  const reports: ExtractedReport[] = []
  const seen = new Set<string>()

  for (const entity of entities) {
    for (const fy of years) {
      const clauses = clausesParam([
        { col: "pe_id", value: entity.id, type: "nominal" },
        { col: "financial_year_id", value: fy.value, type: "nominal" },
      ])
      let fetched = 0
      for (let page = 1; page <= MAX_PAGES_PER_YEAR; page++) {
        const res = await getJson<Page<Contract>>(`/api/get/explored-contracts?${clauses}&page=${page}`)
        if (!res) break
        for (const c of res.data) {
          fetched++
          // The API returns exact duplicate rows — key on tender + contract number + amount
          const key = `${c.tender?.id}|${c.contract_number}|${c.amount}`
          if (seen.has(key) || c.amount < MIN_CONTRACT_KES) continue
          seen.add(key)
          const r = toReport(c)
          if (r) reports.push(r)
        }
        if (page >= res.last_page) break
      }
      console.log(`  → ${entity.name} ${fy.label}: ${fetched} contracts`)
    }
  }

  console.log(`  ✅ ${reports.length} contracts ≥ ${fmtKes(MIN_CONTRACT_KES)} for ${county.name}`)
  return reports
}
