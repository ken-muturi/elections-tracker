/**
 * News scraper — scrapes Nation, Standard, Star for county project reports
 */

import * as cheerio from "cheerio"
import { fetchUrl } from "../lib/http"
import { searchWeb, SearchResult } from "../lib/search"
import { extractReportsWithClaude, ExtractedReport } from "../lib/claude"
import { SEARCH_QUERIES } from "../constants"
import { publishedDate, readableText } from "../lib/html"

export interface NewsArticle {
  title: string
  url: string
  source: string
  datePublished?: string
  text: string
  wordCount: number
}

const NEWS_DOMAINS = [
  "nation.africa", "standardmedia.co.ke", "the-star.co.ke", "peopledaily.digital", "kenyanews.go.ke",
  "eastleighvoice.co.ke", "citizen.digital", "businessdailyafrica.com", "capitalfm.co.ke", "kbc.co.ke",
]

function isNewsDomain(url: string): boolean {
  return NEWS_DOMAINS.some((d) => url.includes(d))
}

/** Start of the previous financial year (Kenya FY runs July–June) — older news is skipped */
function newsCutoff(now = new Date()): Date {
  const fyStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  return new Date(Date.UTC(fyStartYear - 1, 6, 1))
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10)

/** Extract article text from a news page */
async function scrapeArticle(url: string): Promise<NewsArticle | null> {
  const res = await fetchUrl(url, { retries: 1 })
  if (!res) return null

  const $ = cheerio.load(res.html)

  const title =
    $("h1").first().text().trim() ||
    $("meta[property='og:title']").attr("content") ||
    "Untitled"

  // Fall back to a date in the URL (the Star: /2026-05-21-slug)
  const datePublished = publishedDate($) ?? url.match(/\/(20\d\d-\d\d-\d\d)-/)?.[1]

  // Paragraphs are the most reliable body across Nation / Standard / Star layouts
  const $c = cheerio.load(res.html)
  $c("nav, footer, header, script, style, aside, .ad, .advertisement, .related, .comments").remove()
  let text = $c("p")
    .map((_, el) => $c(el).text().trim())
    .get()
    .filter((p) => p && !/^audio by vocalize$/i.test(p))
    .join("\n")
  if (text.length < 500) text = readableText($)

  const source = new URL(url).hostname.replace("www.", "")

  return {
    title: String(title),
    url,
    source,
    datePublished,
    text,
    wordCount: text.split(/\s+/).length,
  }
}

export interface NewsScrapeResult {
  countyName: string
  articles: NewsArticle[]
  reports: ExtractedReport[]
}

export async function scrapeCountyNews(countyName: string): Promise<NewsScrapeResult> {
  console.log(`\n📰 Scraping news for ${countyName}...`)

  const allResults: SearchResult[] = []
  const queries = [
    ...SEARCH_QUERIES.stalledProjects(countyName),
    ...SEARCH_QUERIES.serviceDelivery(countyName),
    ...SEARCH_QUERIES.audit(countyName),
  ]

  const cutoff = newsCutoff()
  const freshness = `${isoDay(cutoff)}to${isoDay(new Date())}`

  for (const q of queries) {
    const results = await searchWeb(q, 5, { freshness, includeDomains: NEWS_DOMAINS })
    // Only keep news domain results
    const filtered = results.filter((r) => isNewsDomain(r.url))
    allResults.push(...filtered)
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  const unique = allResults.filter((r) => {
    if (seen.has(r.url)) return false
    seen.add(r.url)
    return true
  })

  console.log(`  → ${unique.length} unique news URLs found`)

  const articles: NewsArticle[] = []
  const reports: ExtractedReport[] = []

  const MAX_ARTICLES = 10
  for (const result of unique) {
    if (articles.length >= MAX_ARTICLES) break
    console.log(`  📄 Scraping: ${result.title.slice(0, 60)}...`)
    const article = await scrapeArticle(result.url)
    if (!article || article.wordCount < 80) continue

    // Search freshness is approximate — drop articles we can date as too old
    const published = article.datePublished ? new Date(article.datePublished) : undefined
    if (published && !isNaN(+published) && published < cutoff) {
      console.log(`     ↷ Skipped (published ${isoDay(published)}, before ${isoDay(cutoff)})`)
      continue
    }
    // Many hits are national stories; only extract from ones that discuss this county
    const countyRe = new RegExp(countyName.replace(/[^a-z]/gi, "."), "gi")
    const inTitle = countyRe.test(`${article.title} ${result.title}`)
    const mentions = (article.text.match(countyRe) ?? []).length
    if (!inTitle && mentions < 2) {
      console.log(`     ↷ Skipped (mentions ${countyName} ${mentions}×)`)
      continue
    }

    articles.push(article)

    const extracted = await extractReportsWithClaude(article.text, countyName, article.url, {
      maxChars: 12_000,
      sourceKind: `News article — ${article.source}${article.datePublished ? `, published ${article.datePublished.slice(0, 10)}` : ""}`,
    })
    for (const r of extracted) r.sourceDate ??= article.datePublished?.slice(0, 10)
    reports.push(...extracted)
  }

  console.log(`  ✅ ${articles.length} articles scraped, ${reports.length} reports extracted`)

  return { countyName, articles, reports }
}
