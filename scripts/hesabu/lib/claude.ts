/**
 * Claude API wrapper for structuring messy scraped text into JSON
 * Uses claude-sonnet-4-5 (latest stable)
 * Falls back gracefully if ANTHROPIC_API_KEY is not set
 */

import Anthropic from "@anthropic-ai/sdk"

let _client: Anthropic | null = null

function getClient(): Anthropic | null {
  if (_client) return _client
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    console.warn("  ⚠  ANTHROPIC_API_KEY not set — AI structuring disabled, using regex only")
    return null
  }
  _client = new Anthropic({ apiKey: key })
  return _client
}

export interface ExtractedReport {
  title: string
  fiscalYear: string           // e.g. "2024/2025"
  sector: string
  ward?: string
  budgetAllocated?: number     // KES
  budgetSpent?: number         // KES
  absorptionRate?: number      // 0–100
  status: "stalled" | "ongoing" | "completed" | "unknown"
  summary: string              // 1-3 sentence description
  confidence: "verified" | "reported" | "estimated"
  sourceUrl: string
  sourceDate?: string
}

const SYSTEM_PROMPT = `You are a Kenya county budget analyst. Extract structured budget/project data from scraped Kenyan news articles or government documents.

Return ONLY valid JSON matching this schema (no markdown, no explanation):
{
  "reports": [
    {
      "title": "project or programme title",
      "fiscalYear": "2024/2025",
      "sector": "Health Services | Agriculture & Livestock | Infrastructure & Public Works | Education & ICT | Water & Environment | Lands & Physical Planning | County Administration | Trade & Tourism | Other Programmes",
      "ward": "ward name if mentioned or null",
      "budgetAllocated": 5000000 or null,
      "budgetSpent": 2000000 or null,
      "absorptionRate": 40 or null,
      "status": "stalled | ongoing | completed | unknown",
      "summary": "1-3 sentence description of the issue",
      "confidence": "verified | reported | estimated"
    }
  ]
}

Rules:
- All money amounts in KES (convert if in millions/billions: 5M = 5000000, 1.2B = 1200000000)
- fiscalYear always in "YYYY/YYYY" format
- Only extract if you have enough context — don't invent data
- confidence: "verified" = official government doc, "reported" = journalist with named source, "estimated" = inferred
- Return empty reports array if no relevant budget/project data found`

export async function extractReportsWithClaude(
  text: string,
  countyName: string,
  sourceUrl: string
): Promise<ExtractedReport[]> {
  const client = getClient()
  if (!client) return extractReportsWithRegex(text, countyName, sourceUrl)

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `County: ${countyName}\nSource: ${sourceUrl}\n\nArticle text (first 3000 chars):\n${text.slice(0, 3000)}`,
        },
      ],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text : ""
    const parsed = JSON.parse(raw)
    return (parsed.reports ?? []).map((r: ExtractedReport) => ({ ...r, sourceUrl }))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  ⚠  Claude extraction failed: ${msg} — falling back to regex`)
    return extractReportsWithRegex(text, countyName, sourceUrl)
  }
}

/** Regex-only fallback when Claude is unavailable */
export function extractReportsWithRegex(
  text: string,
  countyName: string,
  sourceUrl: string
): ExtractedReport[] {
  const reports: ExtractedReport[] = []

  // Look for stalled project mentions
  const stalledPattern = /(?:stalled|abandoned|incomplete|zero.?absorption)\s+(?:project|construction|road|facility|school|borehole|hospital)[^.]{0,200}/gi
  let match: RegExpExecArray | null

  while ((match = stalledPattern.exec(text)) !== null) {
    const snippet = match[0].trim()
    const sector = guessSector(snippet)
    const fy = guessYear(text)

    reports.push({
      title: `${countyName} stalled project — ${sector}`,
      fiscalYear: fy,
      sector,
      status: "stalled",
      summary: snippet.slice(0, 300),
      confidence: "reported",
      sourceUrl,
    })

    if (reports.length >= 3) break
  }

  return reports
}

function guessSector(text: string): string {
  const t = text.toLowerCase()
  if (/health|hospital|clinic|dispensary/.test(t)) return "Health Services"
  if (/road|bridge|infrastructure/.test(t)) return "Infrastructure & Public Works"
  if (/school|education|classroom/.test(t)) return "Education & ICT"
  if (/water|borehole|dam|irrigation/.test(t)) return "Water & Environment"
  if (/farm|agriculture|livestock|crop/.test(t)) return "Agriculture & Livestock"
  if (/market|trade|tourism/.test(t)) return "Trade & Tourism"
  return "Other Programmes"
}

function guessYear(text: string): string {
  const m = text.match(/20\d\d\/20\d\d/)
  if (m) return m[0]
  const single = text.match(/\b(202[0-9])\b/)
  if (single) return `${single[1]}/${parseInt(single[1]) + 1}`
  return "2024/2025"
}
