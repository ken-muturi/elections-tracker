/**
 * Claude API wrapper for structuring messy scraped text into JSON
 * Uses claude-opus-5-5 with structured (JSON schema) output
 * Falls back gracefully if ANTHROPIC_API_KEY is not set
 */

import Anthropic from "@anthropic-ai/sdk"
import type { SourceKey, SourceRef } from "./sources"

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
  /** Source that produced this report (set by the orchestrator) */
  source?: SourceKey
  /** Every source this item was found in — more than one after dedup merges */
  sources?: SourceRef[]
  /** Set when the source failed this run and the item was kept from an earlier run (that run's scrapedAt) */
  carriedOverFrom?: string
}

const SYSTEM_PROMPT = `You are a Kenya county budget analyst. Extract structured budget/project data from scraped Kenyan news articles or government documents.

Return JSON matching this shape:
{
  "reports": [
    {
      "title": "project or programme title",
      "fiscalYear": "2024/2025",
      "sector": "Health Services | Agriculture & Livestock | Infrastructure & Public Works | Education & ICT | Water & Environment | Lands & Physical Planning | County Administration | Trade & Tourism | Other Programmes",
      "ward": "ward name if mentioned, else null",
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
- Audit reports (Auditor-General): each audit finding is a report — e.g. unsupported or irregular expenditure, pending bills, stalled or incomplete projects, unremitted deductions. Title it after the finding, put the audit opinion and the amount concerned in the summary, and use status "stalled" only for projects the audit describes as stalled/abandoned/incomplete. Do NOT put the amount a finding concerns into budgetAllocated/budgetSpent unless it is explicitly an allocation or expenditure figure for a project
- Return empty reports array if no relevant budget/project data found`

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reports"],
  properties: {
    reports: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title", "fiscalYear", "sector", "ward", "budgetAllocated", "budgetSpent",
          "absorptionRate", "status", "summary", "confidence",
        ],
        properties: {
          title: { type: "string" },
          fiscalYear: { type: "string" },
          sector: { type: "string" },
          ward: { type: ["string", "null"] },
          budgetAllocated: { type: ["number", "null"] },
          budgetSpent: { type: ["number", "null"] },
          absorptionRate: { type: ["number", "null"] },
          status: { type: "string", enum: ["stalled", "ongoing", "completed", "unknown"] },
          summary: { type: "string" },
          confidence: { type: "string", enum: ["verified", "reported", "estimated"] },
        },
      },
    },
  },
} as const

type RawReport = Omit<ExtractedReport, "sourceUrl" | "ward" | "budgetAllocated" | "budgetSpent" | "absorptionRate"> & {
  ward: string | null
  budgetAllocated: number | null
  budgetSpent: number | null
  absorptionRate: number | null
}

export async function extractReportsWithClaude(
  text: string,
  countyName: string,
  sourceUrl: string,
  opts: { maxChars?: number; sourceKind?: string } = {}
): Promise<ExtractedReport[]> {
  const { maxChars = 8000, sourceKind = "Article" } = opts
  const client = getClient()
  if (!client) return extractReportsWithRegex(text, countyName, sourceUrl)

  const excerpt = text.slice(0, maxChars)
  if (text.length > maxChars) {
    console.warn(`  ✂  Input truncated to ${maxChars} of ${text.length} chars for ${sourceUrl}`)
  }

  try {
    const message = await client.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: REPORT_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `County: ${countyName}\nSource: ${sourceUrl}\n\n${sourceKind} text:\n${excerpt}`,
        },
      ],
    })

    if (message.stop_reason === "refusal") {
      console.warn(`  ⚠  Claude declined to extract from ${sourceUrl} — falling back to regex`)
      return extractReportsWithRegex(text, countyName, sourceUrl)
    }

    const textBlock = message.content.find((b) => b.type === "text")
    const raw = textBlock && textBlock.type === "text" ? textBlock.text : ""
    const parsed = JSON.parse(raw) as { reports?: RawReport[] }
    return (parsed.reports ?? []).map((r) => ({
      ...r,
      ward: r.ward ?? undefined,
      budgetAllocated: r.budgetAllocated ?? undefined,
      budgetSpent: r.budgetSpent ?? undefined,
      absorptionRate: r.absorptionRate ?? undefined,
      sourceUrl,
    }))
  } catch (err: unknown) {
    // Account/request problems (bad key, no credit, invalid request) won't be fixed by
    // falling back to regex — fail loudly so the run records an error instead of junk data.
    if (
      err instanceof Anthropic.AuthenticationError ||
      err instanceof Anthropic.PermissionDeniedError ||
      err instanceof Anthropic.BadRequestError
    ) {
      throw new Error(`Claude API unusable (${err.status}): ${err.message}`)
    }
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

export function guessSector(text: string): string {
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
