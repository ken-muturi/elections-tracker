/**
 * County government website scraper
 * Tries to find budget documents from county .go.ke sites and KIPPRA
 */

import * as cheerio from "cheerio"
import { fetchUrl } from "../lib/http"
import { searchWeb } from "../lib/search"
import { extractReportsWithClaude, ExtractedReport } from "../lib/claude"
import { CountyMeta, SEARCH_QUERIES } from "../constants"
import { readableText } from "../lib/html"

const KIPPRA_BASE = "https://repository.kippra.or.ke"

const PAGE_MAX_CHARS = 12_000

/** Homepage text, used to spot "soft 404s" — budget URLs that just serve the homepage */
async function homepageText(county: CountyMeta): Promise<string> {
  const res = await fetchUrl(`https://${county.website}/`, { retries: 0 })
  return res ? readableText(cheerio.load(res.html)) : ""
}

async function scrapeCountyGovSite(county: CountyMeta): Promise<ExtractedReport[]> {
  const tryUrls = [
    `https://${county.website}/budget`,
    `https://${county.website}/finance`,
    `https://${county.website}/documents`,
  ]
  const home = await homepageText(county)

  for (const url of tryUrls) {
    const res = await fetchUrl(url, { minDelay: 3000, maxDelay: 6000, retries: 0 })
    if (!res || res.status !== 200) continue

    const $ = cheerio.load(res.html)
    const text = readableText($)
    if (text.length < 300) continue
    if (home && text.slice(0, 2000) === home.slice(0, 2000)) {
      console.log(`     ↷ ${url} serves the homepage — skipped`)
      continue
    }

    console.log(`     📄 ${$("title").text().trim().slice(0, 70)} (${text.length} chars)`)
    return extractReportsWithClaude(text, county.name, url, {
      maxChars: PAGE_MAX_CHARS,
      sourceKind: `${county.name} County Government website page`,
    })
  }

  return []
}

async function scrapeKIPPRA(countyName: string): Promise<ExtractedReport[]> {
  const searchUrl = `${KIPPRA_BASE}/xmlui/discover?query=${encodeURIComponent(countyName + " county budget")}&scope=&submit=Go`

  const res = await fetchUrl(searchUrl)
  if (!res) return []

  const $ = cheerio.load(res.html)
  const reports: ExtractedReport[] = []

  const links: string[] = []
  $("a[href*='/handle/']").each((_, el) => {
    const href = $(el).attr("href") ?? ""
    const url = href.startsWith("http") ? href : `${KIPPRA_BASE}${href}`
    if (!links.includes(url)) links.push(url)
  })

  for (const link of links.slice(0, 3)) {
    const res2 = await fetchUrl(link)
    if (!res2) continue
    const $2 = cheerio.load(res2.html)
    const text = $2(".item-page, .ds-div-head, .abstract").text().trim()
    if (text.length > 100) {
      const extracted = await extractReportsWithClaude(text, countyName, link)
      reports.push(...extracted)
    }
  }

  return reports
}

export async function scrapeCountyBudgetSources(county: CountyMeta): Promise<ExtractedReport[]> {
  console.log(`\n🌐 Scraping county budget sources for ${county.name}...`)

  const allReports: ExtractedReport[] = []

  // 1. Try county .go.ke website
  console.log(`  → County website: ${county.website}`)
  const govReports = await scrapeCountyGovSite(county)
  allReports.push(...govReports)

  // 2. KIPPRA repository
  console.log(`  → KIPPRA repository`)
  const kippraReports = await scrapeKIPPRA(county.name)
  allReports.push(...kippraReports)

  // 3. Web search for budget documents
  const budgetQueries = SEARCH_QUERIES.budget(county.name)
  for (const q of budgetQueries.slice(0, 2)) {
    const results = await searchWeb(q, 4)
    for (const r of results) {
      if (r.url.includes(county.website) || r.url.includes("treasury.go.ke") || r.url.includes("kippra")) {
        const fetched = await fetchUrl(r.url)
        if (!fetched) continue
        if (!/html/i.test(fetched.contentType)) continue // PDFs etc. aren't parsed here
        const text = readableText(cheerio.load(fetched.html))
        if (text.length > 300) {
          const extracted = await extractReportsWithClaude(text, county.name, r.url, { maxChars: PAGE_MAX_CHARS })
          allReports.push(...extracted)
        }
      }
    }
  }

  console.log(`  ✅ ${allReports.length} budget source reports for ${county.name}`)
  return allReports
}
