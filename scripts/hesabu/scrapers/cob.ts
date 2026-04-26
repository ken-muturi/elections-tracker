/**
 * Controller of Budget (CoB) scraper
 * Fetches quarterly county budget implementation reports from cob.go.ke
 * Reports list: https://cob.go.ke/reports/
 */

import * as cheerio from "cheerio"
import { fetchUrl, fetchBuffer } from "../lib/http"
import { extractReportsWithClaude, ExtractedReport } from "../lib/claude"

const COB_BASE = "https://cob.go.ke"
const COB_REPORTS_URL = `${COB_BASE}/reports/`

interface CoBDocument {
  title: string
  url: string
  quarter?: string
  fiscalYear?: string
}

function parseFiscalYear(text: string): string | undefined {
  const m = text.match(/20\d\d[\/-]20\d\d/)
  return m ? m[0].replace("-", "/") : undefined
}

function parseQuarter(text: string): string | undefined {
  const m = text.match(/Q[1-4]|quarter\s*[1-4]|[1-4](?:st|nd|rd|th)\s*quarter/i)
  return m ? m[0] : undefined
}

export async function fetchCoBReportList(): Promise<CoBDocument[]> {
  console.log("  📋 Fetching CoB report list...")
  const res = await fetchUrl(COB_REPORTS_URL)
  if (!res) return []

  const $ = cheerio.load(res.html)
  const docs: CoBDocument[] = []

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? ""
    const text = $(el).text().trim()

    // Looking for county budget implementation report PDFs
    if (
      /(county.budget.implementation|quarterly.budget)/i.test(text) &&
      (href.endsWith(".pdf") || href.includes("download") || href.includes("/reports/"))
    ) {
      const url = href.startsWith("http") ? href : `${COB_BASE}${href}`
      docs.push({
        title: text,
        url,
        fiscalYear: parseFiscalYear(text),
        quarter: parseQuarter(text),
      })
    }
  })

  console.log(`  → Found ${docs.length} CoB documents`)
  return docs
}

export async function scrapeCoBForCounty(
  countyName: string
): Promise<ExtractedReport[]> {
  console.log(`\n🏛  Scraping Controller of Budget reports for ${countyName}...`)

  // First try direct county-named URL patterns
  const countySlug = countyName.toLowerCase().replace(/\s+/g, "-")
  const directUrls = [
    `${COB_BASE}/reports/?s=${encodeURIComponent(countyName)}`,
    `${COB_BASE}/?s=${encodeURIComponent(`${countyName} county budget implementation`)}`,
  ]

  const reports: ExtractedReport[] = []

  for (const url of directUrls) {
    const res = await fetchUrl(url)
    if (!res) continue

    const $ = cheerio.load(res.html)
    const text = $.text()

    if (text.toLowerCase().includes(countyName.toLowerCase())) {
      const extracted = await extractReportsWithClaude(text, countyName, url)
      reports.push(...extracted)
    }
  }

  // Also look for PDF links that mention the county
  const listDocs = await fetchCoBReportList()
  const relevant = listDocs.filter(
    (d) =>
      d.title.toLowerCase().includes(countyName.toLowerCase()) ||
      d.url.toLowerCase().includes(countySlug)
  )

  for (const doc of relevant.slice(0, 3)) {
    console.log(`  📄 Fetching PDF: ${doc.title.slice(0, 60)}`)
    const buffer = await fetchBuffer(doc.url)
    if (!buffer) continue

    try {
      // Dynamic import to avoid build issues if pdf-parse isn't installed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>
      const parsed = await pdfParse(buffer)
      const text = parsed.text

      if (text.toLowerCase().includes(countyName.toLowerCase())) {
        const extracted = await extractReportsWithClaude(text.slice(0, 6000), countyName, doc.url)
        reports.push(...extracted)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`  ⚠  PDF parse failed: ${msg}`)
    }
  }

  console.log(`  ✅ ${reports.length} CoB reports extracted for ${countyName}`)
  return reports
}
