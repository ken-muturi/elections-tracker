/**
 * Office of the Auditor-General (OAG) county audit reports.
 *
 * oagkenya.go.ke is currently down (503 "Under Maintenance"), so we read the same
 * OAG reports from the Parliament of Kenya library repository (DSpace REST API,
 * open, no auth): https://libraryir.parliament.go.ke
 *
 *   /server/api/discover/search/objects?query=...&dsoType=ITEM   → find items
 *   /server/api/core/items/{uuid}?embed=bundles/bitstreams        → item files
 *   /server/api/core/bitstreams/{uuid}/content                    → file download
 *
 * Each item has a TEXT bundle (pre-extracted .pdf.txt, capped ~100KB by DSpace) —
 * enough to cover the audit opinion and basis-for-opinion findings, which come first.
 */

import axios from "axios"
import { CountyMeta } from "../constants"
import { extractReportsWithClaude, ExtractedReport } from "../lib/claude"

const BASE = "https://libraryir.parliament.go.ke"
const API = `${BASE}/server/api`

interface DspaceObject {
  uuid: string
  name: string
  metadata?: Record<string, { value: string }[]>
}

interface Bitstream { uuid: string; name: string; sizeBytes: number }
interface Bundle { name: string; _embedded?: { bitstreams?: { _embedded?: { bitstreams?: Bitstream[] } } } }

async function getJson<T>(url: string): Promise<T | null> {
  try {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await axios.get<T>(url, { headers: { Accept: "application/json" }, timeout: 60_000 })
    return res.data
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  ⚠  Parliament library request failed: ${msg}`)
    return null
  }
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "")

/** "Report of the Auditor-General on County Executive of Wajir for the Year Ended 30 June, 2024" */
const TITLE_RE = /^Report of the Auditor-General on (?:the )?County Executive of\s+(.+?)\s+for the Year Ended 30(?:th)? June,?\s*(\d{4})/i

async function findReports(countyName: string): Promise<{ item: DspaceObject; yearEnded: number }[]> {
  const query = encodeURIComponent(`"County Executive of ${countyName}"`)
  type Search = { _embedded?: { searchResult?: { _embedded?: { objects?: { _embedded: { indexableObject: DspaceObject } }[] } } } }
  const res = await getJson<Search>(`${API}/discover/search/objects?query=${query}&dsoType=ITEM&size=40`)
  const objects = res?._embedded?.searchResult?._embedded?.objects ?? []

  const target = norm(countyName)
  const matches = objects
    .map((o) => o._embedded.indexableObject)
    .map((item) => ({ item, m: item.name.replace(/\s+/g, " ").match(TITLE_RE) }))
    .filter(({ m }) => m && norm(m[1]).startsWith(target))
    .map(({ item, m }) => ({ item, yearEnded: parseInt(m![2]) }))
    .sort((a, b) => b.yearEnded - a.yearEnded)

  return matches
}

/** Minimum extracted characters for a report to count as text (scanned PDFs yield ~nothing) */
const MIN_TEXT_CHARS = 5000

async function getText(itemUuid: string): Promise<{ text: string; pdfUrl?: string } | null> {
  const item = await getJson<{ _embedded?: { bundles?: { _embedded?: { bundles?: Bundle[] } } } }>(
    `${API}/core/items/${itemUuid}?embed=bundles/bitstreams`
  )
  const bundles = item?._embedded?.bundles?._embedded?.bundles ?? []
  const files = (name: string) => bundles.find((b) => b.name === name)?._embedded?.bitstreams?._embedded?.bitstreams ?? []

  const pdf = files("ORIGINAL").find((b) => /\.pdf$/i.test(b.name))
  const txt = files("TEXT")[0]
  if (!txt) return null

  try {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await axios.get<string>(`${API}/core/bitstreams/${txt.uuid}/content`, {
      responseType: "text",
      timeout: 60_000,
    })
    return { text: res.data, pdfUrl: pdf ? `${API}/core/bitstreams/${pdf.uuid}/content` : undefined }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  ⚠  Could not fetch audit report text: ${msg}`)
    return null
  }
}

export async function scrapeOagForCounty(county: CountyMeta): Promise<ExtractedReport[]> {
  console.log(`\n🔍 Scraping Auditor-General report (Parliament library) for ${county.name}...`)

  const candidates = await findReports(county.name)
  if (candidates.length === 0) {
    console.log(`  → No County Executive audit report found for ${county.name}`)
    return []
  }

  // Newest report whose text layer is usable (recent uploads are sometimes scanned images)
  let found: (typeof candidates)[number] | null = null
  let doc: { text: string; pdfUrl?: string } | null = null
  for (const c of candidates.slice(0, 3)) {
    const d = await getText(c.item.uuid)
    if (d && d.text.trim().length >= MIN_TEXT_CHARS) {
      found = c
      doc = d
      break
    }
    console.warn(`  ⚠  No usable text in "${c.item.name.replace(/\s+/g, " ")}" (scanned PDF?) — trying an older report`)
  }
  if (!found || !doc) return []

  const fy = `${found.yearEnded - 1}/${found.yearEnded}`
  console.log(`  📄 ${found.item.name.replace(/\s+/g, " ")}`)

  const sourceUrl = doc.pdfUrl ?? `${BASE}/items/${found.item.uuid}`
  const reports = await extractReportsWithClaude(doc.text, county.name, sourceUrl, {
    maxChars: 120_000,
    sourceKind: `Office of the Auditor-General — Report on the County Executive of ${county.name} for FY ${fy} (official audit report; extract the audit opinion and each audit finding with its amount)`,
  })

  console.log(`  ✅ ${reports.length} audit findings for ${county.name}`)
  return reports
}
