/**
 * Web search.
 * Uses the Brave Search API when BRAVE_SEARCH_API_KEY is set (recommended).
 * Falls back to DuckDuckGo HTML, which usually serves a bot challenge to scripts
 * and returns nothing.
 */

import axios from "axios"
import * as cheerio from "cheerio"
import { fetchUrl } from "./http"

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

const BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search"
// Free tier allows 1 request/second
const BRAVE_MIN_INTERVAL_MS = 1100

let _lastBrave = 0
let _warnedNoKey = false

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim()
}

interface BraveWebResult {
  title?: string
  url?: string
  description?: string
}

async function searchBrave(query: string, maxResults: number, apiKey: string, freshness?: string): Promise<SearchResult[] | null> {
  const wait = _lastBrave + BRAVE_MIN_INTERVAL_MS - Date.now()
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  _lastBrave = Date.now()

  try {
    const res = await axios.get<{ web?: { results?: BraveWebResult[] } }>(BRAVE_ENDPOINT, {
      params: { q: query, count: Math.min(maxResults, 20), ...(freshness ? { freshness } : {}) },
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
      timeout: 20_000,
    })
    return (res.data.web?.results ?? [])
      .filter((r) => r.url?.startsWith("http") && r.title)
      .slice(0, maxResults)
      .map((r) => ({ title: stripTags(r.title!), url: r.url!, snippet: stripTags(r.description ?? "") }))
  } catch (err: unknown) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`     ⚠  Brave search failed${status ? ` (HTTP ${status})` : ""}: ${msg}`)
    return null
  }
}

async function searchDuckDuckGo(query: string, maxResults: number): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  const res = await fetchUrl(url, { minDelay: 3000, maxDelay: 5000 })
  if (!res) return []

  const $ = cheerio.load(res.html)
  const results: SearchResult[] = []

  $(".result__body").each((_, el) => {
    if (results.length >= maxResults) return false

    const titleEl = $(el).find(".result__a")
    const rawHref = titleEl.attr("href") ?? ""
    // DuckDuckGo wraps links via //duckduckgo.com/l/?uddg=...
    let resolvedUrl = rawHref
    try {
      const parsed = new URL(rawHref.startsWith("//") ? `https:${rawHref}` : rawHref)
      resolvedUrl = parsed.searchParams.get("uddg") ?? rawHref
    } catch {}

    const title = titleEl.text().trim()
    if (title && resolvedUrl.startsWith("http")) {
      results.push({ title, url: resolvedUrl, snippet: $(el).find(".result__snippet").text().trim() })
    }
  })

  return results
}

export interface SearchOptions {
  /** Brave freshness: "pd" | "pw" | "pm" | "py" or a range "YYYY-MM-DDtoYYYY-MM-DD" (ignored by DuckDuckGo) */
  freshness?: string
}

export async function searchWeb(query: string, maxResults = 8, opts: SearchOptions = {}): Promise<SearchResult[]> {
  console.log(`  🔍 Searching: ${query}`)

  const braveKey = process.env.BRAVE_SEARCH_API_KEY
  let results: SearchResult[]
  if (braveKey) {
    results = (await searchBrave(query, maxResults, braveKey, opts.freshness)) ?? []
  } else {
    if (!_warnedNoKey) {
      console.warn("  ⚠  BRAVE_SEARCH_API_KEY not set — falling back to DuckDuckGo (often blocked)")
      _warnedNoKey = true
    }
    results = await searchDuckDuckGo(query, maxResults)
  }

  console.log(`     → ${results.length} results`)
  return results
}
