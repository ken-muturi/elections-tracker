/**
 * GPRIS — Government Project Reporting Information System (State Dept for ICT)
 * https://gpris.go.ke
 *
 * Public JSON endpoints, no auth, no filters/pagination (each returns the full list):
 *   /api/projects          — few projects, with budget + progress (data quality is uneven)
 *   /api/digital-hubs      — ICT hubs by county/ward with status + remarks
 *   /api/housing-projects  — affordable housing projects with status + dates
 *
 * Data quality caveats seen during research: placeholder sources ("trustmebro.go.ke"),
 * disbursed > allocated, coordinates in the wrong county. Records are therefore
 * tagged confidence "reported", never "verified", and obvious placeholders are dropped.
 */

import axios from "axios"
import { CountyMeta } from "../constants"
import { ExtractedReport, guessSector } from "../lib/claude"

const BASE = "https://gpris.go.ke"

interface Envelope<T> { status?: unknown; data?: T[] }

interface GprisProject {
  project_id: string
  name: string
  description?: string
  sector?: string
  location?: { county?: string; constituency?: string; ward?: string }
  budget?: { allocated_amount_kes?: number; disbursed_amount_kes?: number; source?: string }
  timeline?: { start_date?: string; expected_completion_date?: string }
  progress?: { percentage_complete?: number; status?: string }
  data_sources?: { retrieved_from?: string } | unknown
}

interface DigitalHub {
  id: number
  county: string
  constituency?: string
  ward?: string
  site: string
  status?: string
  remarks?: string
  project_id?: number
}

interface HousingProject {
  id: number
  name: string
  town?: string
  county: string
  status?: string
  started_on?: string
  completed_on?: string
}

async function getList<T>(path: string): Promise<T[]> {
  try {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await axios.get<Envelope<T>>(`${BASE}${path}`, {
      headers: { Accept: "application/json" },
      timeout: 30_000,
    })
    return res.data.data ?? []
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  ⚠  GPRIS ${path} failed: ${msg}`)
    return []
  }
}

let _data: Promise<{ projects: GprisProject[]; hubs: DigitalHub[]; housing: HousingProject[] }> | null = null

async function loadAll() {
  console.log("  📋 Fetching GPRIS datasets...")
  const projects = await getList<GprisProject>("/api/projects")
  const hubs = await getList<DigitalHub>("/api/digital-hubs")
  const housing = await getList<HousingProject>("/api/housing-projects")
  console.log(`  → ${projects.length} projects, ${hubs.length} digital hubs, ${housing.length} housing projects`)
  return { projects, hubs, housing }
}

const norm = (s?: string) => (s ?? "").toLowerCase().replace(/[^a-z]/g, "")

function mapStatus(s?: string): ExtractedReport["status"] {
  const t = (s ?? "").toLowerCase()
  if (/complete/.test(t)) return "completed"
  if (/stall|suspend|abandon/.test(t)) return "stalled"
  if (/ongoing|progress|procurement|construction/.test(t)) return "ongoing"
  return "unknown"
}

function fyFromDate(d?: string): string {
  if (!d) return "unknown"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return "unknown"
  const y = dt.getFullYear()
  // Kenyan FY runs 1 July – 30 June
  return dt.getMonth() >= 6 ? `${y}/${y + 1}` : `${y - 1}/${y}`
}

function looksLikePlaceholder(p: GprisProject): boolean {
  const src = JSON.stringify(p.data_sources ?? "").toLowerCase()
  const alloc = p.budget?.allocated_amount_kes ?? 0
  const disb = p.budget?.disbursed_amount_kes ?? 0
  return /trustmebro|example\.|lorem|test/.test(src) || (alloc > 0 && disb > alloc * 1.5)
}

export async function scrapeGprisForCounty(county: CountyMeta): Promise<ExtractedReport[]> {
  console.log(`\n🛰  Scraping GPRIS projects for ${county.name}...`)
  _data ??= loadAll()
  const { projects, hubs, housing } = await _data
  const target = norm(county.name)
  const reports: ExtractedReport[] = []

  for (const p of projects) {
    if (!norm(p.location?.county).startsWith(target)) continue
    if (looksLikePlaceholder(p)) {
      console.warn(`  ⚠  Skipping GPRIS project ${p.project_id} ("${p.name}") — placeholder/inconsistent data`)
      continue
    }
    const pct = p.progress?.percentage_complete
    reports.push({
      title: p.name,
      fiscalYear: fyFromDate(p.timeline?.start_date),
      sector: guessSector(`${p.sector ?? ""} ${p.name}`),
      ward: p.location?.ward || undefined,
      budgetAllocated: p.budget?.allocated_amount_kes || undefined,
      budgetSpent: p.budget?.disbursed_amount_kes || undefined,
      status: mapStatus(p.progress?.status),
      summary: [
        p.description?.slice(0, 250),
        pct != null ? `Reported ${pct}% complete (${p.progress?.status ?? "status n/a"}).` : "",
        p.timeline?.expected_completion_date ? `Expected completion ${p.timeline.expected_completion_date}.` : "",
      ].filter(Boolean).join(" "),
      confidence: "reported",
      sourceUrl: `${BASE}/en/browse/${p.project_id}`,
    })
  }

  for (const h of hubs) {
    if (!norm(h.county).startsWith(target)) continue
    reports.push({
      title: `${h.site} (Digital Hub)`,
      fiscalYear: "unknown",
      sector: "Education & ICT",
      ward: h.ward || undefined,
      status: mapStatus(h.status),
      summary: `Constituency digital hub in ${h.constituency ?? county.name}. GPRIS status: ${h.status ?? "n/a"}${h.remarks ? ` — ${h.remarks}` : ""}.`,
      confidence: "reported",
      sourceUrl: h.project_id ? `${BASE}/en/browse/${h.project_id}` : `${BASE}/api/digital-hubs`,
    })
  }

  for (const h of housing) {
    if (!norm(h.county).startsWith(target)) continue
    reports.push({
      title: h.name,
      fiscalYear: fyFromDate(h.started_on),
      sector: "Lands & Physical Planning",
      status: mapStatus(h.status),
      summary: `Affordable housing project${h.town ? ` in ${h.town}` : ""}. GPRIS status: ${h.status ?? "n/a"}${h.started_on ? `; started ${h.started_on.slice(0, 10)}` : ""}${h.completed_on ? `; completion ${h.completed_on.slice(0, 10)}` : ""}.`,
      confidence: "reported",
      sourceUrl: `${BASE}/api/housing-projects`,
    })
  }

  console.log(`  ✅ ${reports.length} GPRIS records for ${county.name}`)
  return reports
}
