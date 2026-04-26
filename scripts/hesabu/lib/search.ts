/**
 * DuckDuckGo HTML search — no API key required
 * Returns a list of result URLs + titles + snippets
 */

import * as cheerio from "cheerio"
import { fetchUrl } from "./http"

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export async function searchWeb(query: string, maxResults = 8): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query)
  const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`

  console.log(`  🔍 Searching: ${query}`)
  const res = await fetchUrl(url, { minDelay: 3000, maxDelay: 5000 })
  if (!res) return []

  const $ = cheerio.load(res.html)
  const results: SearchResult[] = []

  $(".result__body").each((_, el) => {
    if (results.length >= maxResults) return false

    const titleEl = $(el).find(".result__a")
    const snippetEl = $(el).find(".result__snippet")

    const rawHref = titleEl.attr("href") ?? ""
    // DuckDuckGo wraps links via //duckduckgo.com/l/?uddg=...
    let resolvedUrl = rawHref
    try {
      const parsed = new URL(rawHref.startsWith("//") ? `https:${rawHref}` : rawHref)
      resolvedUrl = parsed.searchParams.get("uddg") ?? rawHref
    } catch {}

    const title = titleEl.text().trim()
    const snippet = snippetEl.text().trim()

    if (title && resolvedUrl.startsWith("http")) {
      results.push({ title, url: resolvedUrl, snippet })
    }
  })

  console.log(`     → ${results.length} results`)
  return results
}
