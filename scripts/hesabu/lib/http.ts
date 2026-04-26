/**
 * Rate-limited HTTP client with rotating User-Agents
 * Respects robots.txt convention with 2–4s delays between requests
 */

import axios, { AxiosResponse } from "axios"

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
]

let _lastRequest = 0

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Wait so total time since last request is at least [min,max] ms */
async function rateLimit(minMs = 2000, maxMs = 4000) {
  const elapsed = Date.now() - _lastRequest
  const wait = Math.floor(Math.random() * (maxMs - minMs) + minMs)
  if (elapsed < wait) await delay(wait - elapsed)
  _lastRequest = Date.now()
}

export interface FetchResult {
  url: string
  html: string
  status: number
  contentType: string
}

export async function fetchUrl(
  url: string,
  opts: { minDelay?: number; maxDelay?: number; retries?: number } = {}
): Promise<FetchResult | null> {
  const { minDelay = 2000, maxDelay = 4000, retries = 2 } = opts

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await rateLimit(minDelay, maxDelay)
      const res: AxiosResponse<string> = await axios.get(url, {
        headers: {
          "User-Agent": randomUA(),
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
        },
        timeout: 20_000,
        maxRedirects: 5,
        responseType: "text",
      })
      return {
        url,
        html: res.data,
        status: res.status,
        contentType: String(res.headers["content-type"] ?? ""),
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (attempt < retries) {
        console.warn(`  ↻ Retry ${attempt + 1}/${retries} for ${url} — ${msg}`)
        await delay(5000 * (attempt + 1))
      } else {
        console.error(`  ✗ Failed ${url} — ${msg}`)
      }
    }
  }
  return null
}

export async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    await rateLimit(2000, 4000)
    const res = await axios.get<Buffer>(url, {
      headers: { "User-Agent": randomUA() },
      responseType: "arraybuffer",
      timeout: 30_000,
    })
    return Buffer.from(res.data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  ✗ Failed buffer fetch ${url} — ${msg}`)
    return null
  }
}
