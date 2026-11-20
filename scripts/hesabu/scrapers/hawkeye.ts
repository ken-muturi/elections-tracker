/**
 * Hawkeye Africa / Hawkeye Kenya — https://hawkeye.africa (app: https://hawkeyekenya.com)
 *
 * Third-party civic platform. Publishes static JSON derived from OAG and Controller of
 * Budget reports, but without per-record source citations. We use only its Auditor-General
 * findings file, tagged confidence "reported" (secondary source). Findings that also appear
 * in the primary OAG report (scrapers/oag.ts) are merged by the deduplicator, which upgrades
 * them to "verified".
 *
 *   https://hawkeyekenya.com/data/auditor-general-findings-2023-24.json
 *     → [{ county_name, fiscal_year, entity, audit_opinion, total_findings, findings[{ title, amount_kshs, summary, category }] }]
 */

import axios from "axios"
import { CountyMeta } from "../constants"
import { ExtractedReport, guessSector } from "../lib/claude"

import { HAWKEYE_FINDINGS_URL as FINDINGS_URL } from "../lib/hawkeye-source"

interface Finding { number?: number; title: string; amount_kshs?: number | null; summary?: string; category?: string }
interface CountyAudit {
  county_name: string
  fiscal_year: string
  entity?: string
  audit_opinion?: string
  total_findings?: number
  findings?: Finding[]
}

let _data: Promise<CountyAudit[]> | null = null

async function load(): Promise<CountyAudit[]> {
  try {
    const res = await axios.get<CountyAudit[]>(FINDINGS_URL, { timeout: 60_000 })
    const data = Array.isArray(res.data) ? res.data : []
    console.log(`  → Hawkeye audit findings loaded for ${data.length} entities`)
    return data
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  ⚠  Hawkeye findings fetch failed: ${msg}`)
    return []
  }
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "")

function normalizeFy(fy: string): string {
  const m = fy.match(/(20\d\d)\s*\/\s*(\d{2,4})/)
  if (!m) return fy
  return `${m[1]}/${m[2].length === 2 ? `20${m[2]}` : m[2]}`
}

export async function scrapeHawkeyeForCounty(county: CountyMeta): Promise<ExtractedReport[]> {
  console.log(`\n🦅 Reading Hawkeye audit findings for ${county.name}...`)
  _data ??= load()
  const target = norm(county.name)
  const audits = (await _data).filter(
    (a) => norm(a.county_name).startsWith(target) && /executive/i.test(a.entity ?? "County Executive")
  )

  const reports: ExtractedReport[] = []
  for (const a of audits) {
    const fy = normalizeFy(a.fiscal_year)
    for (const f of a.findings ?? []) {
      reports.push({
        title: f.title,
        fiscalYear: fy,
        sector: guessSector(`${f.title} ${f.summary ?? ""}`),
        status: "unknown",
        summary: `Auditor-General finding (${a.audit_opinion ?? "opinion n/a"} opinion, FY ${fy})${f.amount_kshs ? `, concerning KES ${Math.round(f.amount_kshs).toLocaleString("en-KE")}` : ""}: ${(f.summary ?? "").trim()}${f.summary && f.summary.length >= 195 ? "…" : ""} [Secondary source: Hawkeye Kenya, derived from the OAG report.]`,
        confidence: "reported",
        sourceUrl: FINDINGS_URL,
      })
    }
  }

  console.log(`  ✅ ${reports.length} Hawkeye findings for ${county.name}`)
  return reports
}
