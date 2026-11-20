/** Hawkeye Auditor-General JSON → audit rows (pure). Amounts are kept per finding, never summed. */

export interface HawkeyeFinding { number?: number; title?: string; amount_kshs?: number | null; summary?: string; category?: string }
export interface HawkeyeCounty {
  county_name?: string; county_code?: number | string; fiscal_year?: string; entity?: string
  audit_opinion?: string; total_findings?: number; findings?: HawkeyeFinding[]
}
export interface FindingInput { number: number; title: string; category: string; amountCited: bigint | null; summary: string }
export interface AuditInput {
  countyCode: string; countyName: string; fiscalYear: string; entity: string; opinion: string
  totalFindings: number; findings: FindingInput[]
}

export function padCountyCode(v: number | string | undefined): string | null {
  const n = typeof v === "number" ? v : typeof v === "string" && /^\d+$/.test(v.trim()) ? Number(v) : NaN
  return Number.isInteger(n) && n >= 1 && n <= 47 ? String(n).padStart(3, "0") : null
}

export function normalizeFiscalYear(v: string | undefined): string | null {
  const m = v?.trim().match(/^(\d{4})\/(\d{2}|\d{4})$/)
  if (!m) return null
  const end = m[2].length === 2 ? `${m[1].slice(0, 2)}${m[2]}` : m[2]
  return `${m[1]}/${end}`
}

function toFindings(raw: HawkeyeFinding[]): FindingInput[] {
  const out: FindingInput[] = []
  const used = new Set<number>()
  raw.forEach((f, i) => {
    const title = f?.title?.trim()
    if (!title) return
    const number = Number.isInteger(f.number) ? (f.number as number) : i + 1
    if (used.has(number)) return
    used.add(number)
    const amt = typeof f.amount_kshs === "number" && f.amount_kshs > 0 ? BigInt(Math.round(f.amount_kshs)) : null
    out.push({ number, title: title.slice(0, 500), category: f.category?.trim() || "other", amountCited: amt, summary: f.summary?.trim() ?? "" })
  })
  return out
}

export function parseAuditFile(data: unknown): { audits: AuditInput[]; skipped: string[] } {
  if (!Array.isArray(data)) return { audits: [], skipped: ["file is not a list of counties"] }
  const audits: AuditInput[] = []
  const skipped: string[] = []
  for (const item of data as (HawkeyeCounty | null)[]) {
    const name = item?.county_name?.trim() || "unknown county"
    const countyCode = padCountyCode(item?.county_code)
    const fiscalYear = normalizeFiscalYear(item?.fiscal_year)
    if (!item || !countyCode || !fiscalYear || !Array.isArray(item.findings)) {
      skipped.push(`${name}: missing or invalid county code, fiscal year or findings`)
      continue
    }
    const findings = toFindings(item.findings)
    // An empty list is a broken export, not "all findings resolved" — loading it would delete every
    // finding for the county and unlink citizen reports
    if (findings.length === 0) {
      skipped.push(`${name}: no usable findings`)
      continue
    }
    audits.push({
      countyCode,
      countyName: name,
      fiscalYear,
      entity: item.entity?.trim() || "County Executive",
      opinion: item.audit_opinion?.trim() || "Not stated",
      totalFindings: Number.isInteger(item.total_findings) ? (item.total_findings as number) : findings.length,
      findings,
    })
  }
  return { audits, skipped }
}
