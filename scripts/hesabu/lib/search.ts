/**
 * Web search with provider fallback, in order:
 *   1. Tavily  (TAVILY_SEARCH_API_KEY)
 *   2. Brave   (BRAVE_SEARCH_API_KEY)
 *   3. DuckDuckGo HTML — usually serves a bot challenge to scripts and returns nothing.
 * A provider that answers with an account/billing error (401/402/403, Tavily 432/433)
 * is switched off for the rest of the run; any other failure falls through for that query only.
 */

import axios from "axios"
import * as cheerio from "cheerio"
import { fetchUrl } from "./http"

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface SearchOptions {
  /** "pd" | "pw" | "pm" | "py" or a range "YYYY-MM-DDtoYYYY-MM-DD" (ignored by DuckDuckGo) */
  freshness?: string
  /** Restrict results to these domains where the provider supports it (Tavily); callers still filter */
  includeDomains?: string[]
}

/** Thrown by a provider when its account can't be used (no credit, bad key, plan limit) */
export class ProviderUnusableError extends Error {}

export interface SearchProvider {
  name: string
  search: (query: string, maxResults: number, opts: SearchOptions) => Promise<SearchResult[]>
}

const ACCOUNT_STATUSES = new Set([401, 402, 403, 432, 433])

// Social sites return short posts, not articles the extractor can use
const EXCLUDED_DOMAINS = ["facebook.com", "instagram.com", "x.com", "twitter.com", "tiktok.com", "youtube.com", "linkedin.com"]

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim()
}

function rethrow(provider: string, err: unknown): never {
  const status = axios.isAxiosError(err) ? err.response?.status : undefined
  const msg = err instanceof Error ? err.message : String(err)
  const text = `${provider} search failed${status ? ` (HTTP ${status})` : ""}: ${msg}`
  if (status && ACCOUNT_STATUSES.has(status)) throw new ProviderUnusableError(text)
  throw new Error(text)
}

/** Maps a Brave-style freshness value to Tavily's parameters */
export function tavilyDateParams(freshness?: string): Record<string, string> {
  if (!freshness) return {}
  const range = freshness.match(/^(\d{4}-\d{2}-\d{2})to(\d{4}-\d{2}-\d{2})$/)
  if (range) return { start_date: range[1], end_date: range[2] }
  const timeRange = { pd: "day", pw: "week", pm: "month", py: "year" }[freshness]
  return timeRange ? { time_range: timeRange } : {}
}

function tavily(apiKey: string): SearchProvider {
  return {
    name: "Tavily",
    async search(query, maxResults, opts) {
      try {
        const res = await axios.post<{ results?: { title?: string; url?: string; content?: string }[] }>(
          "https://api.tavily.com/search",
          {
            query,
            max_results: Math.min(maxResults, 20),
            topic: "general",
            ...(opts.includeDomains?.length ? { include_domains: opts.includeDomains } : { exclude_domains: EXCLUDED_DOMAINS }),
            ...tavilyDateParams(opts.freshness),
          },
          { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, timeout: 30_000 }
        )
        return (res.data.results ?? [])
          .filter((r) => r.url?.startsWith("http") && r.title)
          .slice(0, maxResults)
          .map((r) => ({ title: r.title!.trim(), url: r.url!, snippet: (r.content ?? "").trim() }))
      } catch (err) {
        rethrow("Tavily", err)
      }
    },
  }
}

// Brave free tier allows 1 request/second
const BRAVE_MIN_INTERVAL_MS = 1100
let _lastBrave = 0

function brave(apiKey: string): SearchProvider {
  return {
    name: "Brave",
    async search(query, maxResults, opts) {
      const wait = _lastBrave + BRAVE_MIN_INTERVAL_MS - Date.now()
      if (wait > 0) await new Promise((r) => setTimeout(r, wait))
      _lastBrave = Date.now()
      try {
        const res = await axios.get<{ web?: { results?: { title?: string; url?: string; description?: string }[] } }>(
          "https://api.search.brave.com/res/v1/web/search",
          {
            params: { q: query, count: Math.min(maxResults, 20), ...(opts.freshness ? { freshness: opts.freshness } : {}) },
            headers: { Accept: "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": apiKey },
            timeout: 20_000,
          }
        )
        return (res.data.web?.results ?? [])
          .filter((r) => r.url?.startsWith("http") && r.title)
          .slice(0, maxResults)
          .map((r) => ({ title: stripTags(r.title!), url: r.url!, snippet: stripTags(r.description ?? "") }))
      } catch (err) {
        rethrow("Brave", err)
      }
    },
  }
}

const duckDuckGo: SearchProvider = {
  name: "DuckDuckGo",
  async search(query, maxResults) {
    const res = await fetchUrl(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { minDelay: 3000, maxDelay: 5000 })
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
  },
}

/**
 * Tries each provider in order. Returns the first provider's answer that didn't throw
 * (an empty answer counts — the query simply has no results). Providers that throw
 * ProviderUnusableError are added to `disabled` and skipped from then on.
 */
export async function searchWithFallback(
  providers: SearchProvider[],
  disabled: Set<string>,
  query: string,
  maxResults: number,
  opts: SearchOptions
): Promise<{ results: SearchResult[]; provider: string | null }> {
  for (const p of providers) {
    if (disabled.has(p.name)) continue
    try {
      return { results: await p.search(query, maxResults, opts), provider: p.name }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (err instanceof ProviderUnusableError) {
        disabled.add(p.name)
        console.warn(`     ⚠  ${msg} — not using ${p.name} for the rest of this run`)
      } else {
        console.warn(`     ⚠  ${msg} — trying next provider`)
      }
    }
  }
  return { results: [], provider: null }
}

let _providers: SearchProvider[] | null = null
const _disabled = new Set<string>()

function providers(): SearchProvider[] {
  if (_providers) return _providers
  _providers = []
  if (process.env.TAVILY_SEARCH_API_KEY) _providers.push(tavily(process.env.TAVILY_SEARCH_API_KEY))
  if (process.env.BRAVE_SEARCH_API_KEY) _providers.push(brave(process.env.BRAVE_SEARCH_API_KEY))
  if (_providers.length === 0) console.warn("  ⚠  No search API key set — using DuckDuckGo (often blocked)")
  _providers.push(duckDuckGo)
  return _providers
}

export async function searchWeb(query: string, maxResults = 8, opts: SearchOptions = {}): Promise<SearchResult[]> {
  console.log(`  🔍 Searching: ${query}`)
  const { results, provider } = await searchWithFallback(providers(), _disabled, query, maxResults, opts)
  console.log(`     → ${results.length} results${provider ? ` (${provider})` : ""}`)
  return results
}
