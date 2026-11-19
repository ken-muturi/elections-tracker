/**
 * Bajeti Yetu (National Treasury) — https://bajetiyetu.treasury.go.ke
 *
 * County budget documents (PDF) uploaded per county. No structured data / API.
 * County IDs (ctid) follow the standard county code order (1 Mombasa … 47 Nairobi).
 * Coverage is uneven — some counties (e.g. Wajir, Baringo) have no documents.
 *
 *   /document-libraries/list?ctid=N&cat=C        → table of documents (name, FY, preview link)
 *   /document-libraries/preview?id=ID            → page containing /pdfjs?file=<encoded path>
 *   <decoded path>                               → the PDF
 *
 * We take the most recent document from the highest-priority category that has
 * one, extract its text and let Claude structure it.
 */

import * as cheerio from "cheerio"
import { CountyMeta } from "../constants"
import { fetchUrl, fetchBuffer } from "../lib/http"
import { extractReportsWithClaude, ExtractedReport } from "../lib/claude"

const BASE = "https://bajetiyetu.treasury.go.ke"
const DOC_MAX_CHARS = 120_000

/** Categories in priority order */
const CATEGORIES = [
  { id: 33, name: "Budget Implementation Report" },
  { id: 27, name: "Quarterly Report & Financial Statement" },
  { id: 17, name: "Citizens Budget" },
]

interface DocRow { previewId: number; name: string; fiscalYear: string }

async function listDocs(ctid: number, cat: number): Promise<DocRow[]> {
  const res = await fetchUrl(`${BASE}/document-libraries/list?ctid=${ctid}&cat=${cat}`)
  if (!res) return []
  const $ = cheerio.load(res.html)
  const rows: DocRow[] = []
  $("tr[data-key]").each((_, tr) => {
    const href = $(tr).find('a[href*="preview?id="]').attr("href") ?? ""
    const id = href.match(/preview\?id=(\d+)/)?.[1]
    if (!id) return
    rows.push({
      previewId: parseInt(id),
      name: $(tr).find('td[data-col-seq="1"]').text().trim(),
      fiscalYear: $(tr).find('td[data-col-seq="2"]').text().trim(),
    })
  })
  // Newest FY first, then newest upload (higher id)
  return rows.sort((a, b) => b.fiscalYear.localeCompare(a.fiscalYear) || b.previewId - a.previewId)
}

async function resolvePdfUrl(previewId: number): Promise<string | null> {
  const res = await fetchUrl(`${BASE}/document-libraries/preview?id=${previewId}`)
  if (!res) return null
  const m = res.html.match(/\/pdfjs\?file=([^"'&\s]+)/)
  if (!m) return null
  const path = decodeURIComponent(m[1]).replace(/ /g, "%20")
  return path.startsWith("http") ? path : `${BASE}${path}`
}

function normalizeFy(fy: string): string {
  const m = fy.match(/(20\d\d)\s*\/\s*(\d{2,4})/)
  if (!m) return fy
  const end = m[2].length === 2 ? `20${m[2]}` : m[2]
  return `${m[1]}/${end}`
}

export async function scrapeBajetiForCounty(county: CountyMeta): Promise<ExtractedReport[]> {
  console.log(`\n📚 Scraping Bajeti Yetu documents for ${county.name}...`)
  const ctid = parseInt(county.code, 10)

  for (const cat of CATEGORIES) {
    const docs = await listDocs(ctid, cat.id)
    if (docs.length === 0) continue

    const doc = docs[0]
    console.log(`  📄 ${cat.name}: "${doc.name}" (${doc.fiscalYear})`)
    const pdfUrl = await resolvePdfUrl(doc.previewId)
    if (!pdfUrl) {
      console.warn(`  ⚠  No PDF link on preview ${doc.previewId}`)
      continue
    }

    const buffer = await fetchBuffer(pdfUrl, { timeoutMs: 180_000 })
    if (!buffer) continue

    let text: string
    try {
      const { PDFParse } = await import("pdf-parse")
      const parser = new PDFParse({ data: buffer })
      text = (await parser.getText()).text
      await parser.destroy()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`  ⚠  PDF parse failed: ${msg}`)
      continue
    }

    if (text.trim().length < 500) {
      console.warn("  ⚠  PDF has little/no extractable text (probably scanned) — skipping")
      continue
    }

    const reports = await extractReportsWithClaude(text, county.name, `${BASE}/document-libraries/preview?id=${doc.previewId}`, {
      maxChars: DOC_MAX_CHARS,
      sourceKind: `National Treasury Bajeti Yetu — ${cat.name}, "${doc.name}", FY ${normalizeFy(doc.fiscalYear)} (official county government document)`,
    })
    console.log(`  ✅ ${reports.length} Bajeti Yetu reports for ${county.name}`)
    return reports
  }

  console.log(`  → No Bajeti Yetu documents for ${county.name}`)
  return []
}
