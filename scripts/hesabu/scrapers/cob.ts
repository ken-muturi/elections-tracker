/**
 * Controller of Budget (CoB) scraper
 *
 * CoB publishes one "County Governments Budget Implementation Review Report" (CBIRR)
 * per quarter / half-year / nine months / full year, each covering all 47 counties
 * in a single large PDF (~50 MB). Each county has its own section headed
 * "3.NN. County Government of <Name>".
 *
 * Flow:
 *   1. Find the latest CBIRR download pages via the site search (cob.go.ke/?s=...)
 *   2. Resolve each page's ?wpdmdl= PDF link, download + parse once, cache text on disk
 *   3. For each county, cut out its own section and send that to Claude
 */

import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"
import * as cheerio from "cheerio"
import { fetchUrl, fetchBuffer } from "../lib/http"
import { extractReportsWithClaude, ExtractedReport } from "../lib/claude"

const COB_BASE = "https://cob.go.ke"
const COB_SEARCH_URL = `${COB_BASE}/?s=${encodeURIComponent("county governments budget implementation review report")}`
const CBIRR_SLUG = "county-governments-budget-implementation-review-report"

/** Max characters of a county section sent to Claude (largest sections are ~100k) */
const SECTION_MAX_CHARS = 120_000

const CACHE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../output/.cache/cob")
const LIST_CACHE = path.join(CACHE_DIR, "report-list.json")

interface CoBDocument {
  title: string
  pageUrl: string
  slug: string
  fiscalYear?: string
  period: string
  sortKey: number
}

// ─── Report discovery ────────────────────────────────────────────────────────

function parsePeriod(slug: string): { period: string; rank: number } {
  if (/nine-months/.test(slug)) return { period: "first nine months", rank: 3 }
  if (/half|six-months/.test(slug)) return { period: "first half", rank: 2 }
  if (/first-quarter|three-months/.test(slug)) return { period: "first quarter", rank: 1 }
  return { period: "full year", rank: 4 }
}

function parseFiscalYear(slug: string): { fy?: string; endYear: number } {
  const m = slug.match(/(20\d\d)-(20)?(\d\d)(?!\d)/)
  if (!m) return { endYear: 0 }
  const start = parseInt(m[1])
  const end = 2000 + parseInt(m[3])
  return { fy: `${start}/${end}`, endYear: end }
}

export async function fetchCoBReportList(): Promise<CoBDocument[]> {
  console.log("  📋 Fetching CoB county report list...")
  const res = await fetchUrl(COB_SEARCH_URL, { retries: 3 })
  if (!res) return readCachedList()

  const $ = cheerio.load(res.html)
  const bySlug = new Map<string, CoBDocument>()

  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") ?? "").split("#")[0]
    const m = href.match(/\/download\/([^/?]+)\/?$/)
    if (!m || !m[1].startsWith(CBIRR_SLUG) || bySlug.has(m[1])) return

    const slug = m[1]
    const { period, rank } = parsePeriod(slug)
    const { fy, endYear } = parseFiscalYear(slug)
    bySlug.set(slug, {
      title: $(el).text().trim() || slug,
      pageUrl: href.startsWith("http") ? href : `${COB_BASE}${href}`,
      slug,
      fiscalYear: fy,
      period,
      sortKey: endYear * 10 + rank,
    })
  })

  const docs = [...bySlug.values()].sort((a, b) => b.sortKey - a.sortKey)
  console.log(`  → Found ${docs.length} county budget implementation reports`)
  if (docs.length === 0) return readCachedList()

  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(LIST_CACHE, JSON.stringify({ savedAt: new Date().toISOString(), docs }, null, 2))
  return docs
}

/** Last successfully fetched report list — used when cob.go.ke is slow or down */
function readCachedList(): CoBDocument[] {
  if (!fs.existsSync(LIST_CACHE)) return []
  const { savedAt, docs } = JSON.parse(fs.readFileSync(LIST_CACHE, "utf-8")) as { savedAt: string; docs: CoBDocument[] }
  console.warn(`  ⚠  cob.go.ke unavailable — using cached report list from ${savedAt}`)
  return docs
}

// ─── PDF download + text cache ───────────────────────────────────────────────

async function resolvePdfUrl(pageUrl: string): Promise<string | null> {
  const res = await fetchUrl(pageUrl)
  if (!res) return null
  const m = res.html.match(/https?:\/\/[^"'\s]+\?wpdmdl=\d+/)
  return m ? m[0].replace(/&amp;/g, "&") : null
}

async function getReportText(doc: CoBDocument): Promise<string | null> {
  const cacheFile = path.join(CACHE_DIR, `${doc.slug}.txt`)
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, "utf-8")

  const pdfUrl = await resolvePdfUrl(doc.pageUrl)
  if (!pdfUrl) {
    console.warn(`  ⚠  No PDF link found on ${doc.pageUrl}`)
    return null
  }

  console.log(`  📄 Downloading PDF: ${doc.fiscalYear ?? "?"} ${doc.period} (this is large)...`)
  const buffer = await fetchBuffer(pdfUrl, { timeoutMs: 300_000 })
  if (!buffer) return null

  try {
    const { PDFParse } = await import("pdf-parse")
    const parser = new PDFParse({ data: buffer })
    const parsed = await parser.getText()
    await parser.destroy()

    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(cacheFile, parsed.text, "utf-8")
    console.log(`  → Parsed ${parsed.text.length.toLocaleString()} chars, cached`)
    return parsed.text
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  ⚠  PDF parse failed: ${msg}`)
    return null
  }
}

// ─── County section extraction ───────────────────────────────────────────────

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "")

/** Body headings look like "3.46. County Government of Wajir" (TOC lines end in dashes + page no.) */
const HEADING_RE = /^\s*\d+\.\d+\.?\s+County Government of\s+(.+?)\s*$/

export function extractCountySection(text: string, countyName: string): string | null {
  const lines = text.split("\n")
  const headings: { line: number; name: string }[] = []
  lines.forEach((l, i) => {
    if (l.includes("---")) return
    const m = l.match(HEADING_RE)
    if (m) headings.push({ line: i, name: m[1] })
  })

  const target = norm(countyName)
  const idx = headings.findIndex((h) => norm(h.name).startsWith(target))
  if (idx === -1) return null

  const start = headings[idx].line
  const end = idx + 1 < headings.length ? headings[idx + 1].line : lines.length
  return lines.slice(start, end).join("\n")
}

// ─── Main entry ──────────────────────────────────────────────────────────────

/**
 * The newest report, plus the newest full-year report when the newest one is
 * only a partial year (quarter / half / nine months) — avoids overlapping reports.
 */
function selectReports(docs: CoBDocument[]): CoBDocument[] {
  if (docs.length === 0) return []
  const [latest] = docs
  if (latest.period === "full year") return [latest]
  const fullYear = docs.find((d) => d.period === "full year")
  return fullYear ? [latest, fullYear] : [latest]
}

let _reportList: Promise<CoBDocument[]> | null = null

export async function scrapeCoBForCounty(countyName: string): Promise<ExtractedReport[]> {
  console.log(`\n🏛  Scraping Controller of Budget reports for ${countyName}...`)

  // The list is the same for every county — fetch once per run (retry next county if it failed)
  _reportList ??= fetchCoBReportList()
  const list = await _reportList
  if (list.length === 0) {
    _reportList = null
    throw new Error("Controller of Budget report list unavailable (cob.go.ke unreachable, no cached list)")
  }
  const docs = selectReports(list)

  const reports: ExtractedReport[] = []

  for (const doc of docs) {
    const text = await getReportText(doc)
    if (!text) continue

    const section = extractCountySection(text, countyName)
    if (!section) {
      console.warn(`  ⚠  No "${countyName}" section found in ${doc.slug}`)
      continue
    }

    console.log(`  🔎 ${doc.fiscalYear ?? "?"} ${doc.period}: ${section.length.toLocaleString()} chars for ${countyName}`)
    const extracted = await extractReportsWithClaude(section, countyName, doc.pageUrl, {
      maxChars: SECTION_MAX_CHARS,
      sourceKind: `Controller of Budget, County Budget Implementation Review Report (${doc.period}, FY ${doc.fiscalYear ?? "unknown"}) — official government document, county section`,
    })
    reports.push(...extracted)
  }

  console.log(`  ✅ ${reports.length} CoB reports extracted for ${countyName}`)
  return reports
}
