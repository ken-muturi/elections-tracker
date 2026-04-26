/**
 * News scraper — scrapes Nation, Standard, Star for county project reports
 */

import * as cheerio from "cheerio"
import { fetchUrl } from "../lib/http"
import { searchWeb, SearchResult } from "../lib/search"
import { extractReportsWithClaude, ExtractedReport } from "../lib/claude"
import { SEARCH_QUERIES } from "../constants"

export interface NewsArticle {
  title: string
  url: string
  source: string
  datePublished?: string
  text: string
  wordCount: number
}

const NEWS_DOMAINS = ["nation.africa", "standardmedia.co.ke", "the-star.co.ke", "peopledaily.digital", "kenyanews.go.ke"]

function isNewsDomain(url: string): boolean {
  return NEWS_DOMAINS.some((d) => url.includes(d))
}

/** Extract article text from a news page */
async function scrapeArticle(url: string): Promise<NewsArticle | null> {
  const res = await fetchUrl(url)
  if (!res) return null

  const $ = cheerio.load(res.html)

  // Remove nav, footer, ads, scripts
  $("nav, footer, script, style, aside, .ad, .advertisement, .related, .comments").remove()

  const title =
    $("h1").first().text().trim() ||
    $("meta[property='og:title']").attr("content") ||
    "Untitled"

  const datePublished =
    $("meta[property='article:published_time']").attr("content") ||
    $("time").attr("datetime") ||
    undefined

  // Try common article content selectors
  const contentSelectors = [
    "article",
    ".article-body",
    ".story-body",
    ".content-body",
    ".post-content",
    "main p",
    ".entry-content",
  ]

  let text = ""
  for (const sel of contentSelectors) {
    const candidate = $(sel).text().trim()
    if (candidate.length > text.length) text = candidate
  }

  if (text.length < 100) {
    // Fallback: all paragraphs
    text = $("p").map((_, el) => $(el).text().trim()).get().join(" ")
  }

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

  for (const q of queries) {
    const results = await searchWeb(q, 5)
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

  for (const result of unique.slice(0, 10)) {
    console.log(`  📄 Scraping: ${result.title.slice(0, 60)}...`)
    const article = await scrapeArticle(result.url)
    if (!article || article.wordCount < 80) continue

    articles.push(article)

    const extracted = await extractReportsWithClaude(article.text, countyName, article.url)
    reports.push(...extracted)
  }

  console.log(`  ✅ ${articles.length} articles scraped, ${reports.length} reports extracted`)

  return { countyName, articles, reports }
}
