/** Auditor-General findings: labels, grouping and ordering (pure, no I/O). Amounts are never summed. */
import { fmtKesShort } from "./project-format"

export const AUDIT_NOTE =
  "Audit queries are issues raised by the Auditor-General. They are not findings of wrongdoing until they are resolved. " +
  "Amounts are the figures each finding cites and are not added together."

export const AUDIT_CATEGORIES: { key: string; label: string }[] = [
  { key: "opinion_basis", label: "Reasons for the audit opinion" },
  { key: "lawfulness", label: "Lawful and effective use of public money" },
  { key: "governance", label: "Internal controls and governance" },
  { key: "emphasis_matter", label: "Matters the auditor emphasised" },
  { key: "other_matter", label: "Other matters" },
]
export const OTHER_CATEGORY_KEY = "other"
const OTHER_LABEL = "Other findings"

const known = (key: string) => AUDIT_CATEGORIES.find((c) => c.key === key)

export function categoryLabel(key: string): string {
  return known(key)?.label ?? OTHER_LABEL
}

export interface CategoryCount { key: string; label: string; count: number }

export function countByCategory(findings: { category: string }[]): CategoryCount[] {
  const counts = new Map<string, number>()
  for (const f of findings) {
    const key = known(f.category) ? f.category : OTHER_CATEGORY_KEY
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const ordered = [...AUDIT_CATEGORIES, { key: OTHER_CATEGORY_KEY, label: OTHER_LABEL }]
  return ordered
    .filter((c) => (counts.get(c.key) ?? 0) > 0)
    .map((c) => ({ key: c.key, label: c.label, count: counts.get(c.key)! }))
}

const startYear = (fy: string) => parseInt(fy.slice(0, 4), 10)

/** Latest audit whose year starts on or before the selected year; ties keep the first (callers put County Executive first) */
export function auditForYear<T extends { fiscalYear: string }>(audits: T[], selectedYear: string): T | null {
  const limit = startYear(selectedYear)
  let best: T | null = null
  for (const a of audits) {
    const y = startYear(a.fiscalYear)
    if (Number.isNaN(y) || y > limit) continue
    if (!best || y > startYear(best.fiscalYear)) best = a
  }
  return best
}

export function fmtAmountCited(n: number | null): string | null {
  return n && n > 0 ? `Amount cited: ${fmtKesShort(n)}` : null
}

export function shortFiscalYear(fy: string): string {
  const m = fy.match(/^(\d{4})\/(\d{2})(\d{2})?$/)
  if (!m) return fy
  return `${m[1]}/${m[3] ?? m[2]}`
}

export function opinionPalette(opinion: string): "orange" | "red" | "green" | "gray" {
  const o = opinion.toLowerCase()
  if (o.startsWith("qualified")) return "orange"
  if (o.startsWith("adverse") || o.startsWith("disclaimer")) return "red"
  if (o.startsWith("unmodified") || o.startsWith("unqualified")) return "green"
  return "gray"
}
