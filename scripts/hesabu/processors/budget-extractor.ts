/**
 * Budget figures extractor — regex-based extraction of KES amounts,
 * absorption rates, and sector totals from text blobs
 */

export interface BudgetLine {
  sector: string
  allocated: number
  spent?: number
  absorptionRate?: number
  source: "approved" | "revised" | "actual" | "unknown"
}

const SECTOR_ALIASES: Record<string, string> = {
  health: "Health Services",
  "medical services": "Health Services",
  agriculture: "Agriculture & Livestock",
  livestock: "Agriculture & Livestock",
  roads: "Infrastructure & Public Works",
  infrastructure: "Infrastructure & Public Works",
  "public works": "Infrastructure & Public Works",
  education: "Education & ICT",
  ict: "Education & ICT",
  water: "Water & Environment",
  environment: "Water & Environment",
  lands: "Lands & Physical Planning",
  planning: "Lands & Physical Planning",
  trade: "Trade & Tourism",
  tourism: "Trade & Tourism",
  administration: "County Administration",
  "county executive": "County Administration",
}

function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").replace(/\s/g, "")
  const m = cleaned.match(/([\d.]+)\s*([BMK]?)/i)
  if (!m) return null
  const num = parseFloat(m[1])
  const unit = m[2]?.toUpperCase()
  if (unit === "B") return Math.round(num * 1_000_000_000)
  if (unit === "M") return Math.round(num * 1_000_000)
  if (unit === "K") return Math.round(num * 1_000)
  return Math.round(num)
}

export function extractBudgetLines(text: string): BudgetLine[] {
  const lines: BudgetLine[] = []

  // Pattern: "Health: KES 1.2B" or "Water KSh 450M" or "Roads 2,500,000,000"
  const pattern =
    /([A-Za-z &\/]+?)\s*(?:department|sector|programme|vote)?\s*[:\-–]\s*(?:KES|KSh|Ksh|Kshs)?\s*([\d,.]+\s*[BMK]?)/gi

  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    const sectorRaw = m[1].trim().toLowerCase()
    const sector = Object.entries(SECTOR_ALIASES).find(([alias]) =>
      sectorRaw.includes(alias)
    )?.[1]

    if (!sector) continue
    const allocated = parseMoney(m[2])
    if (!allocated || allocated < 100_000) continue // Skip suspiciously small numbers

    lines.push({ sector, allocated, source: "unknown" })
  }

  // Look for absorption rates
  const absorptionPattern = /([\d.]+)\s*%\s*absorption/gi
  while ((m = absorptionPattern.exec(text)) !== null) {
    const rate = parseFloat(m[1])
    if (lines.length > 0 && rate >= 0 && rate <= 100) {
      const last = lines[lines.length - 1]
      if (!last.absorptionRate) last.absorptionRate = rate
    }
  }

  return lines
}

export function extractTotalBudget(text: string): number | null {
  const patterns = [
    /total\s+(?:approved\s+)?budget[:\s]+(?:KES|KSh|Ksh|Kshs)?\s*([\d,.]+\s*[BMK]?)/i,
    /approved\s+budget[:\s]+(?:KES|KSh|Ksh|Kshs)?\s*([\d,.]+\s*[BMK]?)/i,
    /(?:KES|KSh|Ksh)\s*([\d,.]+\s*[BMK]?)\s+(?:total|approved)/i,
  ]

  for (const p of patterns) {
    const m = text.match(p)
    if (m) return parseMoney(m[1])
  }
  return null
}
