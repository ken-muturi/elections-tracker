# Hesabu Auditor-General Findings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each county's Auditor-General findings (FY 2023/24, from Hawkeye):
- on the Budget Overview tab, as headline counts and the most serious findings;
- on the Citizen Reports tab, as a separate block where each finding can be turned into a linked citizen report;
- on the compare page, as a count.

Money is never summed.

**Architecture:**
- **Loader.** A deterministic loader reads Hawkeye's JSON into two new tables, `h_audits` and `h_audit_findings`, and upserts so finding ids stay stable.
- **Pure logic.** Categories, year selection, ordering and labels live in `audit-format.ts`; Hawkeye parsing lives in `audit-rows.ts`. Both are unit-tested.
- **Server functions** in `src/services/Hesabu.ts` feed the new client components. Citizen reports get an optional `auditFindingId` link.

**Tech Stack:** Next.js 15 App Router, React 19, Chakra UI v3, Prisma 6.15 on Neon Postgres, axios, `node:test` via `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-19-hesabu-audit-findings-design.md`

## Global Constraints

**Wording**
- Say "queried" or "raised" by the Auditor-General. **Never** "mismanaged", "stolen" or "lost".
- `AUDIT_NOTE` (verbatim): "Audit queries are issues raised by the Auditor-General. They are not findings of wrongdoing until they are resolved. Amounts are the figures each finding cites and are not added together."

**Money**
- Amounts are **never summed or ranked**. They appear only per finding, as `Amount cited: KES 1.21B` (via `fmtKesShort`), and are omitted when null or 0.
- Hawkeye's county totals (`irregular_expenditure_kshs`, `unsupported_expenditure_kshs`, `pending_bills_kshs`) are not used.

**Category labels and order**

| Key | Label |
|---|---|
| `opinion_basis` | Reasons for the audit opinion |
| `lawfulness` | Lawful and effective use of public money |
| `governance` | Internal controls and governance |
| `emphasis_matter` | Matters the auditor emphasised |
| `other_matter` | Other matters |
| any unknown key | Other findings (last) |

**Codes and years**
- `countyCode` is zero-padded to 3 digits (`1` → `"001"`).
- `fiscalYear` is stored as `"2023/2024"` and displayed as `"2023/24"`.
- Audit selection: the latest audit whose start year is ≤ the selected year's start year. Otherwise show "No audit loaded for FY {selectedYear}".

**UI**
- The Citizen Reports block is never mixed into the citizen report list or its counts.
- The "Have you seen this?" title is `Re: {finding title}`, cut to 300 characters (`h_reports.title` is VarChar(300)).
- A report with an `auditFindingId` from another county is rejected with the error message `Invalid audit finding`.
- At 375px wide there is no sideways page scroll.

**Repo rules**
- Pure modules use **relative** imports so `tsx --test` can resolve them.
- `src/services/Hesabu.ts` is `"use server"`: every export must be async (types are fine).
- Never run `prisma format` or `prisma migrate reset`. Write migrations with `prisma migrate diff` and apply them with `prisma migrate deploy`.
- Prisma `///` comments must not start with `[` (`prisma-json-types-generator` reads `/// [X]` as a type).
- This project's dev server runs on **port 3100**. Port 3000 is a different project.

## Review Focus

1. **Re-running the loader after a citizen has linked a report.** Finding ids must not change and the link must survive. Pinned by the Task 8 re-load check: same ids before and after, and the linked report still linked.
2. **Viewing an old year** (FY 2015/16) or a county with no audit row. The page should show "No audit loaded for FY …", never the 2023/24 audit and never a crash. Pinned by the `auditForYear` tests (Task 1) and the browser check (Task 8).
3. **A finding with a huge context amount** (Mombasa #2, KES 10.9B). It shows on that finding only; no total appears anywhere. Pinned by `fmtAmountCited` (Task 1) and the browser grep for any "total queried" text (Task 8).
4. **A report submitted with a finding id from another county.** It should be rejected with "Invalid audit finding". Pinned by the Task 4 check script.
5. **Audit queries failing while the dashboard loads.** The section shows "Audit data unavailable" and the rest of the page renders. Pinned by the `unavailable` path in Task 4 and the `orFallback` wrap in Task 5.

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `src/components/hesabu/audit-format.ts` | new | `AUDIT_CATEGORIES`, `categoryLabel`, `countByCategory`, `auditForYear`, `topFindings`, `fmtAmountCited`, `shortFiscalYear`, `opinionPalette`, `AUDIT_NOTE` |
| `src/components/hesabu/audit-format.test.ts` | new | tests |
| `src/components/hesabu/budget-text.ts` | new | `absorbedLabel`, `absorptionAlertText` (label fixes) |
| `src/components/hesabu/budget-text.test.ts` | new | tests |
| `scripts/hesabu/lib/hawkeye-source.ts` | new | `HAWKEYE_FINDINGS_URL` (shared constant) |
| `scripts/hesabu/scrapers/hawkeye.ts` | modify | import the URL constant |
| `scripts/hesabu/processors/audit-rows.ts` | new | `padCountyCode`, `normalizeFiscalYear`, `parseAuditFile` |
| `scripts/hesabu/processors/audit-rows.test.ts` | new | tests |
| `scripts/hesabu/load-audit.ts` | new | loader CLI |
| `prisma/schema.prisma` | modify | `HAudit`, `HAuditFinding`, `HReport.auditFindingId` |
| `prisma/migrations/20261119000000_add_h_audits/migration.sql` | new | migration |
| `scripts/hesabu/processors/project-rows.ts` (+ test) | modify | skip Hawkeye-only items |
| `scripts/hesabu/load.ts` | modify | print the skipped count |
| `scripts/hesabu/cron.sh`, `package.json` | modify | run `hesabu:load-audit`; test list |
| `src/services/Hesabu.ts` | modify | `getAuditSummary`, `getAuditFindings`, `createReport` link, `ReportData.auditFinding`, comparison audits |
| `src/components/hesabu/AuditSection.tsx` | new | Budget Overview section |
| `src/components/hesabu/AuditFindings.tsx` | new | Citizen Reports block |
| `src/components/hesabu/BudgetOverview.tsx`, `KPICards.tsx`, `Dashboard.tsx`, `CitizenReports.tsx`, `ReportForm.tsx`, `ReportCard.tsx` | modify | wiring and label fixes |
| `src/app/(frontend)/hesabu/page.tsx` | modify | fetch the audit summary |
| `src/components/hesabu/compare-metrics.ts`, `compare-data.ts` (+ tests) | modify | Accountability group, `auditFindings` figure |

---

### Task 1: Audit display helpers (`audit-format.ts`)

**Files:**
- Create: `src/components/hesabu/audit-format.ts`
- Create: `src/components/hesabu/audit-format.test.ts`
- Modify: `package.json` (`hesabu:test`)

**Interfaces:**
- Consumes: `fmtKesShort(n: number): string` from `./project-format`.
- Produces:
  ```ts
  export const AUDIT_NOTE: string
  export const AUDIT_CATEGORIES: { key: string; label: string }[]
  export const OTHER_CATEGORY_KEY = "other"
  export function categoryLabel(key: string): string
  export interface CategoryCount { key: string; label: string; count: number }
  export function countByCategory(findings: { category: string }[]): CategoryCount[]
  export function auditForYear<T extends { fiscalYear: string }>(audits: T[], selectedYear: string): T | null
  export function topFindings<T extends { category: string; number: number }>(findings: T[], n?: number): T[]
  export function fmtAmountCited(n: number | null): string | null
  export function shortFiscalYear(fy: string): string        // "2023/2024" → "2023/24"
  export function opinionPalette(opinion: string): "orange" | "red" | "green" | "gray"
  ```

- [ ] **Step 1: Write the failing tests**

Create `src/components/hesabu/audit-format.test.ts`:

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  AUDIT_NOTE, categoryLabel, countByCategory, auditForYear, topFindings,
  fmtAmountCited, shortFiscalYear, opinionPalette,
} from "./audit-format"

test("categoryLabel maps known keys and falls back to Other findings", () => {
  assert.equal(categoryLabel("opinion_basis"), "Reasons for the audit opinion")
  assert.equal(categoryLabel("lawfulness"), "Lawful and effective use of public money")
  assert.equal(categoryLabel("governance"), "Internal controls and governance")
  assert.equal(categoryLabel("emphasis_matter"), "Matters the auditor emphasised")
  assert.equal(categoryLabel("other_matter"), "Other matters")
  assert.equal(categoryLabel("something_new"), "Other findings")
})

test("countByCategory: display order, zero counts omitted, unknown keys merged last", () => {
  const f = (category: string) => ({ category })
  assert.deepEqual(
    countByCategory([f("lawfulness"), f("weird"), f("opinion_basis"), f("lawfulness"), f("also_weird")]),
    [
      { key: "opinion_basis", label: "Reasons for the audit opinion", count: 1 },
      { key: "lawfulness", label: "Lawful and effective use of public money", count: 2 },
      { key: "other", label: "Other findings", count: 2 },
    ],
  )
  assert.deepEqual(countByCategory([]), [])
})

test("auditForYear: exact year, latest earlier year, none before the first audit", () => {
  const audits = [{ fiscalYear: "2022/2023", id: "a" }, { fiscalYear: "2023/2024", id: "b" }]
  assert.equal(auditForYear(audits, "2023/2024")?.id, "b")
  assert.equal(auditForYear(audits, "2025/2026")?.id, "b")
  assert.equal(auditForYear(audits, "2022/2023")?.id, "a")
  assert.equal(auditForYear(audits, "2015/2016"), null)
  assert.equal(auditForYear([], "2025/2026"), null)
})

test("auditForYear keeps the first of two audits for the same year", () => {
  const audits = [{ fiscalYear: "2023/2024", id: "exec" }, { fiscalYear: "2023/2024", id: "assembly" }]
  assert.equal(auditForYear(audits, "2025/2026")?.id, "exec")
})

test("topFindings: reasons for the opinion first, then by number; never by amount; capped", () => {
  const rows = [
    { number: 1, category: "lawfulness", amountCited: 9e10 },
    { number: 2, category: "opinion_basis", amountCited: 1 },
    { number: 3, category: "governance", amountCited: null },
    { number: 4, category: "opinion_basis", amountCited: 5e9 },
    { number: 5, category: "lawfulness", amountCited: 2 },
    { number: 6, category: "lawfulness", amountCited: 3 },
  ]
  assert.deepEqual(topFindings(rows).map((r) => r.number), [2, 4, 1, 3, 5])
  assert.deepEqual(topFindings(rows, 2).map((r) => r.number), [2, 4])
})

test("fmtAmountCited", () => {
  assert.equal(fmtAmountCited(1_210_000_000), "Amount cited: KES 1.21B")
  assert.equal(fmtAmountCited(10_888_337_067), "Amount cited: KES 10.89B")
  assert.equal(fmtAmountCited(null), null)
  assert.equal(fmtAmountCited(0), null)
})

test("shortFiscalYear and opinionPalette", () => {
  assert.equal(shortFiscalYear("2023/2024"), "2023/24")
  assert.equal(shortFiscalYear("2023/24"), "2023/24")
  assert.equal(opinionPalette("Qualified"), "orange")
  assert.equal(opinionPalette("Adverse"), "red")
  assert.equal(opinionPalette("Disclaimer"), "red")
  assert.equal(opinionPalette("Unmodified"), "green")
  assert.equal(opinionPalette("Not stated"), "gray")
})

test("AUDIT_NOTE wording", () => {
  assert.match(AUDIT_NOTE, /not findings of wrongdoing until they are resolved/)
  assert.match(AUDIT_NOTE, /not added together/)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/components/hesabu/audit-format.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` … `audit-format`

- [ ] **Step 3: Implement**

Create `src/components/hesabu/audit-format.ts`:

```ts
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

/** Reasons for the opinion first, then report order. Never by amount — amounts are often context figures. */
export function topFindings<T extends { category: string; number: number }>(findings: T[], n = 5): T[] {
  return [...findings]
    .sort((a, b) =>
      Number(b.category === "opinion_basis") - Number(a.category === "opinion_basis") || a.number - b.number)
    .slice(0, n)
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
```

In `package.json`, add ` src/components/hesabu/audit-format.test.ts` to the end of the `hesabu:test` file list.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test src/components/hesabu/audit-format.test.ts`
Expected: `# pass 8`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add src/components/hesabu/audit-format.ts src/components/hesabu/audit-format.test.ts package.json
git commit -m "feat(hesabu): audit finding labels, grouping and year selection"
```

---

### Task 2: Schema, migration and audit loader

**Files:**
- Create: `scripts/hesabu/lib/hawkeye-source.ts`
- Modify: `scripts/hesabu/scrapers/hawkeye.ts` (line 18: the `FINDINGS_URL` constant)
- Create: `scripts/hesabu/processors/audit-rows.ts`
- Create: `scripts/hesabu/processors/audit-rows.test.ts`
- Create: `scripts/hesabu/load-audit.ts`
- Modify: `prisma/schema.prisma` (new models after `HProject`; `HReport` link)
- Create: `prisma/migrations/20261119000000_add_h_audits/migration.sql`
- Modify: `package.json`, `scripts/hesabu/cron.sh`

**Interfaces:**
- Produces:
  ```ts
  // audit-rows.ts
  export interface HawkeyeFinding { number?: number; title?: string; amount_kshs?: number | null; summary?: string; category?: string }
  export interface HawkeyeCounty { county_name?: string; county_code?: number | string; fiscal_year?: string; entity?: string;
    audit_opinion?: string; total_findings?: number; findings?: HawkeyeFinding[] }
  export interface FindingInput { number: number; title: string; category: string; amountCited: bigint | null; summary: string }
  export interface AuditInput { countyCode: string; countyName: string; fiscalYear: string; entity: string; opinion: string;
    totalFindings: number; findings: FindingInput[] }
  export function padCountyCode(v: number | string | undefined): string | null
  export function normalizeFiscalYear(v: string | undefined): string | null
  export function parseAuditFile(data: unknown): { audits: AuditInput[]; skipped: string[] }
  // hawkeye-source.ts
  export const HAWKEYE_FINDINGS_URL = "https://hawkeyekenya.com/data/auditor-general-findings-2023-24.json"
  ```
  - Prisma models `HAudit` (`prisma.hAudit`) with unique key `countyCode_fiscalYear_entity`.
  - `HAuditFinding` (`prisma.hAuditFinding`) with unique key `auditId_number` and relation `reports`.
  - `HReport.auditFindingId` and relation `auditFinding`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/hesabu/processors/audit-rows.test.ts`:

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { padCountyCode, normalizeFiscalYear, parseAuditFile } from "./audit-rows"

test("padCountyCode", () => {
  assert.equal(padCountyCode(1), "001")
  assert.equal(padCountyCode("8"), "008")
  assert.equal(padCountyCode(47), "047")
  assert.equal(padCountyCode(0), null)
  assert.equal(padCountyCode(48), null)
  assert.equal(padCountyCode("x"), null)
  assert.equal(padCountyCode(undefined), null)
})

test("normalizeFiscalYear", () => {
  assert.equal(normalizeFiscalYear("2023/24"), "2023/2024")
  assert.equal(normalizeFiscalYear("2023/2024"), "2023/2024")
  assert.equal(normalizeFiscalYear("2023-24"), null)
  assert.equal(normalizeFiscalYear(undefined), null)
})

const mombasa = {
  county_name: "Mombasa", county_code: 1, fiscal_year: "2023/24", entity: "County Executive",
  audit_opinion: "Qualified", total_findings: 3,
  findings: [
    { number: 1, title: "Inaccuracies in the Financial Statements", amount_kshs: 11643945.4, summary: "s1", category: "opinion_basis" },
    { number: 2, title: "Unexplained Voided Transactions", amount_kshs: 0, summary: "s2", category: "opinion_basis" },
    { number: 3, title: "  ", amount_kshs: 5, summary: "blank title", category: "lawfulness" },
    { title: "No number", amount_kshs: null, category: "" },
    { number: 1, title: "Duplicate number", amount_kshs: 1, summary: "dup", category: "governance" },
  ],
}

test("parseAuditFile maps a county and its findings", () => {
  const { audits, skipped } = parseAuditFile([mombasa])
  assert.deepEqual(skipped, [])
  const a = audits[0]
  assert.equal(a.countyCode, "001")
  assert.equal(a.fiscalYear, "2023/2024")
  assert.equal(a.entity, "County Executive")
  assert.equal(a.opinion, "Qualified")
  assert.equal(a.totalFindings, 3)
  assert.deepEqual(a.findings.map((f) => [f.number, f.title, f.category, f.amountCited]), [
    [1, "Inaccuracies in the Financial Statements", "opinion_basis", 11643945n],
    [2, "Unexplained Voided Transactions", "opinion_basis", null],
    [4, "No number", "other", null],
  ])
  assert.equal(a.findings[2].summary, "")
})

test("parseAuditFile skips malformed counties with a reason", () => {
  const { audits, skipped } = parseAuditFile([
    { ...mombasa, county_code: undefined },
    { ...mombasa, county_name: "Kwale", fiscal_year: "bad" },
    { ...mombasa, county_name: "Kilifi", findings: undefined },
    null,
  ])
  assert.equal(audits.length, 0)
  assert.equal(skipped.length, 4)
  assert.match(skipped[0], /Mombasa/)
})

test("parseAuditFile: non-array input, missing opinion and entity defaults", () => {
  assert.deepEqual(parseAuditFile({ nope: true }), { audits: [], skipped: ["file is not a list of counties"] })
  const { audits } = parseAuditFile([{ ...mombasa, audit_opinion: " ", entity: undefined, total_findings: undefined }])
  assert.equal(audits[0].opinion, "Not stated")
  assert.equal(audits[0].entity, "County Executive")
  assert.equal(audits[0].totalFindings, 3)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test scripts/hesabu/processors/audit-rows.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` … `audit-rows`

- [ ] **Step 3: Implement the parser and the shared URL**

Create `scripts/hesabu/lib/hawkeye-source.ts`:

```ts
/** Hawkeye Kenya's structured export of the Auditor-General's county reports (FY 2023/24) */
export const HAWKEYE_FINDINGS_URL = "https://hawkeyekenya.com/data/auditor-general-findings-2023-24.json"
```

In `scripts/hesabu/scrapers/hawkeye.ts`, replace line 18:

```ts
const FINDINGS_URL = "https://hawkeyekenya.com/data/auditor-general-findings-2023-24.json"
```

with:

```ts
import { HAWKEYE_FINDINGS_URL as FINDINGS_URL } from "../lib/hawkeye-source"
```

Create `scripts/hesabu/processors/audit-rows.ts`:

```ts
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
```

In `package.json`, add ` scripts/hesabu/processors/audit-rows.test.ts` to the `hesabu:test` list.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test scripts/hesabu/processors/audit-rows.test.ts`
Expected: `# pass 5`, `# fail 0`

- [ ] **Step 5: Schema and migration**

In `prisma/schema.prisma`, add these lines to the `HReport` model (after `voteRecords HVote[]`, before `@@index([countyId, status])`):

```prisma
  /// Audit finding this report responds to ("Have you seen this?"), if any
  auditFindingId String?        @map("audit_finding_id") @db.VarChar(50)
  auditFinding   HAuditFinding? @relation(fields: [auditFindingId], references: [id], onDelete: SetNull)
```

Add `  @@index([auditFindingId])` next to `HReport`'s other `@@index` lines.

Append after the `HProject` model:

```prisma
/// Auditor-General audit of one county entity for one fiscal year (loaded from Hawkeye)
model HAudit {
  id            String          @id @default(cuid()) @db.VarChar(50)
  countyCode    String          @map("county_code") @db.VarChar(5)
  fiscalYear    String          @map("fiscal_year") @db.VarChar(15)
  entity        String          @db.VarChar(150)
  opinion       String          @db.VarChar(30)
  totalFindings Int             @map("total_findings")
  sourceUrl     String          @map("source_url") @db.VarChar(500)
  loadedAt      DateTime        @default(now()) @map("loaded_at")
  findings      HAuditFinding[]

  @@unique([countyCode, fiscalYear, entity])
  @@map("h_audits")
}

/// One finding in an Auditor-General audit; amountCited is the figure the finding cites, not a sum at risk
model HAuditFinding {
  id          String    @id @default(cuid()) @db.VarChar(50)
  auditId     String    @map("audit_id") @db.VarChar(50)
  number      Int
  title       String    @db.VarChar(500)
  category    String    @db.VarChar(30)
  amountCited BigInt?   @map("amount_cited")
  summary     String    @db.Text
  audit       HAudit    @relation(fields: [auditId], references: [id], onDelete: Cascade)
  reports     HReport[]

  @@unique([auditId, number])
  @@map("h_audit_findings")
}
```

Generate the migration from the difference against HEAD, then apply it:

```bash
git show HEAD:prisma/schema.prisma > /tmp/schema-head.prisma
npx prisma migrate status
mkdir -p prisma/migrations/20261119000000_add_h_audits
npx prisma migrate diff --from-schema-datamodel /tmp/schema-head.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20261119000000_add_h_audits/migration.sql
cat prisma/migrations/20261119000000_add_h_audits/migration.sql
npx prisma migrate deploy
npx prisma generate
```

Expected:
- `migrate status` reports the database schema is up to date before the deploy.
- The SQL creates `h_audits` and `h_audit_findings`, adds `audit_finding_id` with an index and a foreign key `ON DELETE SET NULL` on `h_reports`, and adds `audit_id`'s foreign key `ON DELETE CASCADE`.
- It contains **no** `DROP` statements.
- The deploy applies 1 migration.

If the SQL contains any `DROP`, stop. Do not deploy; investigate the schema difference first.

- [ ] **Step 6: The loader**

Create `scripts/hesabu/load-audit.ts`:

```ts
/**
 * Load Auditor-General findings (Hawkeye export) into h_audits / h_audit_findings.
 *
 *   npm run hesabu:load-audit                 # fetch HAWKEYE_FINDINGS_URL and load
 *   npm run hesabu:load-audit -- --dry-run    # parse and report, write nothing
 *   npm run hesabu:load-audit -- --file=path  # load a local copy of the JSON
 *
 * Upserts by (county, year, entity) and (audit, finding number) so finding ids — and the
 * citizen reports linked to them — survive re-runs. A fetch failure writes nothing.
 */
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import axios from "axios"
import { fileURLToPath } from "url"
import { PrismaClient } from "@prisma/client"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { HAWKEYE_FINDINGS_URL } from "./lib/hawkeye-source"
import { parseAuditFile } from "./processors/audit-rows"

const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes("--dry-run"),
    file: args.find((a) => a.startsWith("--file="))?.slice("--file=".length),
  }
}

async function main() {
  const { dryRun, file } = parseArgs()
  const raw: unknown = file
    ? JSON.parse(fs.readFileSync(file, "utf-8"))
    : (await axios.get(HAWKEYE_FINDINGS_URL, { timeout: 60_000 })).data

  const { audits, skipped } = parseAuditFile(raw)
  for (const s of skipped) console.warn(`⚠  skipped: ${s}`)

  let findings = 0
  let failed = 0
  for (const a of audits) {
    findings += a.findings.length
    if (dryRun) continue
    try {
      await prisma.$transaction(async (tx) => {
        const audit = await tx.hAudit.upsert({
          where: { countyCode_fiscalYear_entity: { countyCode: a.countyCode, fiscalYear: a.fiscalYear, entity: a.entity } },
          create: { countyCode: a.countyCode, fiscalYear: a.fiscalYear, entity: a.entity, opinion: a.opinion,
            totalFindings: a.totalFindings, sourceUrl: HAWKEYE_FINDINGS_URL },
          update: { opinion: a.opinion, totalFindings: a.totalFindings, sourceUrl: HAWKEYE_FINDINGS_URL, loadedAt: new Date() },
        })
        for (const f of a.findings) {
          await tx.hAuditFinding.upsert({
            where: { auditId_number: { auditId: audit.id, number: f.number } },
            create: { auditId: audit.id, ...f },
            update: { title: f.title, category: f.category, amountCited: f.amountCited, summary: f.summary },
          })
        }
        await tx.hAuditFinding.deleteMany({ where: { auditId: audit.id, number: { notIn: a.findings.map((f) => f.number) } } })
      }, { timeout: 60_000 })
    } catch (err) {
      failed++
      console.error(`✗ ${a.countyName}: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`${audits.length} audits · ${findings} findings · ${skipped.length} skipped${failed ? ` · ${failed} failed` : ""}`)
  console.log(dryRun ? "(dry run — nothing written)" : "✅ Audit load complete")
  if (failed) process.exitCode = 1
}

main()
  .catch((err) => {
    console.error("💥 Audit load failed (nothing written):", err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
```

In `package.json` `scripts`, add after `"hesabu:load"`:

```json
    "hesabu:load-audit": "tsx scripts/hesabu/load-audit.ts",
```

In `scripts/hesabu/cron.sh`, inside the `if [[ "$SCRIPT" == hesabu:scrape* ]]; then` block, after `npm run hesabu:load >> "$LOG" 2>&1`, add:

```bash
  echo "=== $(date) — npm run hesabu:load-audit ===" >> "$LOG"
  npm run hesabu:load-audit >> "$LOG" 2>&1
```

- [ ] **Step 7: Dry run, then the real load**

Run: `npm run hesabu:load-audit -- --dry-run`
Expected: `47 audits · 1043 findings · 0 skipped` and `(dry run — nothing written)`

Run: `npm run hesabu:load-audit`
Expected: `47 audits · 1043 findings · 0 skipped` and `✅ Audit load complete`

Run `npx tsc --noEmit -p . 2>&1 | grep -c "error TS"` → `0`, and `npm run hesabu:test 2>&1 | grep -E "^# (pass|fail)"` → `# fail 0`.

- [ ] **Step 8: Commit**

```bash
git add scripts/hesabu/lib/hawkeye-source.ts scripts/hesabu/scrapers/hawkeye.ts scripts/hesabu/processors/audit-rows.ts scripts/hesabu/processors/audit-rows.test.ts scripts/hesabu/load-audit.ts prisma/schema.prisma prisma/migrations/20261119000000_add_h_audits package.json scripts/hesabu/cron.sh
git commit -m "feat(hesabu): load Auditor-General findings into h_audits"
```

---

### Task 3: Project loader skips Hawkeye-only items

**Files:**
- Modify: `scripts/hesabu/processors/project-rows.ts` (`LoadStats` lines 30–41, stats init lines 59–62, loop after the empty-title check at line 69)
- Modify: `scripts/hesabu/processors/project-rows.test.ts`
- Modify: `scripts/hesabu/load.ts` (the report line, lines 59–64)

**Interfaces:**
- Produces: `LoadStats.skippedAuditOnly: number`.

- [ ] **Step 1: Write the failing test**

Append to `scripts/hesabu/processors/project-rows.test.ts`:

```ts
test("items found only by Hawkeye are audit findings, not projects — skipped and counted", () => {
  const hawk = { source: "hawkeye" as const, url: "https://hawkeyekenya.com/x.json" }
  const { rows, stats } = build([
    rep({ title: "Unsupported Expenditure", source: "hawkeye", sources: [hawk] }),
    rep({ title: "Wargadud dispensary", sources: [{ source: "tenders", url: "https://tenders.go.ke/tenders/1" }, hawk] }),
  ])
  assert.deepEqual(rows.map((r) => r.title), ["Wargadud dispensary"])
  assert.equal(stats.skippedAuditOnly, 1)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test scripts/hesabu/processors/project-rows.test.ts`
Expected: FAIL on the new test (2 rows instead of 1; `skippedAuditOnly` undefined)

- [ ] **Step 3: Implement**

In `project-rows.ts`:

1. Add this field to `LoadStats`, after `possibleDuplicates: number`:

```ts
  /** Items whose only source is Hawkeye — Auditor-General findings, loaded by load-audit instead */
  skippedAuditOnly: number
```

2. In the stats initialiser, add `skippedAuditOnly: 0` after `possibleDuplicates: 0,`.

3. Directly after the line `if (!title) { stats.skippedEmpty++; continue }`, add:

```ts
    const srcKeys = r.sources?.length ? r.sources.map((s) => s.source) : r.source ? [r.source] : []
    if (srcKeys.length > 0 && srcKeys.every((s) => s === "hawkeye")) { stats.skippedAuditOnly++; continue }
```

In `scripts/hesabu/load.ts`, change the end of the report line from:

```ts
        `${stats.possibleDuplicates} possible dup · ${stats.skippedEmpty} empty`
```

to:

```ts
        `${stats.possibleDuplicates} possible dup · ${stats.skippedEmpty} empty · ${stats.skippedAuditOnly} audit-only (Hawkeye)`
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test scripts/hesabu/processors/project-rows.test.ts`
Expected: `# fail 0`

Run: `npx tsc --noEmit -p . 2>&1 | grep -c "error TS"`
Expected: `0`

- [ ] **Step 5: Commit**

```bash
git add scripts/hesabu/processors/project-rows.ts scripts/hesabu/processors/project-rows.test.ts scripts/hesabu/load.ts
git commit -m "feat(hesabu): project loader skips Hawkeye-only audit findings"
```

---

### Task 4: Server functions

**Files:**
- Modify: `src/services/Hesabu.ts`

**Interfaces:**
- Consumes: Task 1 helpers (`auditForYear`, `countByCategory`, `topFindings`, `categoryLabel`, `CategoryCount`); Task 2 Prisma models; the existing `orFallback`, `prisma` and `handleReturnError`.
- Produces:
  ```ts
  export type AuditInfo = { fiscalYear: string; entity: string; opinion: string; totalFindings: number; sourceUrl: string }
  export type AuditFindingRow = { id: string; number: number; title: string; category: string; categoryLabel: string;
    amountCited: number | null; summary: string; linkedReports: number }
  export type AuditSummary = { audit: AuditInfo | null; counts: CategoryCount[]; top: AuditFindingRow[];
    stalledProjects: number | null; unavailable: boolean }
  export const getAuditSummary: (countyCode: string, fiscalYear: string) => Promise<AuditSummary>
  export const getAuditFindings: (countyCode: string, fiscalYear: string) => Promise<{ audit: AuditInfo | null; findings: AuditFindingRow[] }>
  // CreateReportInput gains auditFindingId?: string
  // ReportData gains auditFinding: { number: number } | null
  ```

- [ ] **Step 1: Add the audit functions**

Add this import beside the other `@/components/hesabu/...` imports at the top of `src/services/Hesabu.ts`:

```ts
import { auditForYear, categoryLabel, countByCategory, topFindings, type CategoryCount } from "@/components/hesabu/audit-format"
```

Append at the end of the file:

```ts
// ─────────────────────────────────────────────────────────────────────────────
// Auditor-General findings (counts and individual findings — amounts are never summed)
// ─────────────────────────────────────────────────────────────────────────────

export type AuditInfo = { fiscalYear: string; entity: string; opinion: string; totalFindings: number; sourceUrl: string }
export type AuditFindingRow = {
  id: string; number: number; title: string; category: string; categoryLabel: string
  amountCited: number | null; summary: string; linkedReports: number
}
export type AuditSummary = {
  audit: AuditInfo | null; counts: CategoryCount[]; top: AuditFindingRow[]
  stalledProjects: number | null; unavailable: boolean
}

async function loadAudit(countyCode: string, fiscalYear: string): Promise<{ audit: AuditInfo; findings: AuditFindingRow[] } | null> {
  if (typeof countyCode !== "string" || typeof fiscalYear !== "string") throw new Error("Invalid parameters.")
  const audits = await prisma.hAudit.findMany({
    where: { countyCode },
    select: { id: true, fiscalYear: true, entity: true, opinion: true, totalFindings: true, sourceUrl: true },
  })
  // County Executive first so it wins a same-year tie
  audits.sort((a, b) => Number(b.entity === "County Executive") - Number(a.entity === "County Executive"))
  const a = auditForYear(audits, fiscalYear)
  if (!a) return null
  const rows = await prisma.hAuditFinding.findMany({
    where: { auditId: a.id },
    orderBy: { number: "asc" },
    include: { _count: { select: { reports: true } } },
  })
  return {
    audit: { fiscalYear: a.fiscalYear, entity: a.entity, opinion: a.opinion, totalFindings: a.totalFindings, sourceUrl: a.sourceUrl },
    findings: rows.map((f) => ({
      id: f.id, number: f.number, title: f.title, category: f.category, categoryLabel: categoryLabel(f.category),
      amountCited: f.amountCited === null ? null : Number(f.amountCited), summary: f.summary, linkedReports: f._count.reports,
    })),
  }
}

/** Distinct documented stalled projects for the year; null if the county has never been scraped */
async function countStalled(countyCode: string, fiscalYear: string): Promise<number | null> {
  const scraped = await prisma.hProject.count({ where: { countyCode } })
  if (scraped === 0) return null
  return prisma.hProject.count({ where: { countyCode, fiscalYear, status: "stalled", possibleDuplicateOf: null } })
}

export const getAuditSummary = async (countyCode: string, fiscalYear: string): Promise<AuditSummary> => {
  const [loaded, stalledProjects] = await Promise.all([
    orFallback(loadAudit(countyCode, fiscalYear).then((v) => ({ ok: true as const, v })), { ok: false as const, v: null }, "audit summary"),
    orFallback(countStalled(countyCode, fiscalYear), null, "stalled projects"),
  ])
  if (!loaded.ok) return { audit: null, counts: [], top: [], stalledProjects, unavailable: true }
  const v = loaded.v
  return {
    audit: v?.audit ?? null,
    counts: v ? countByCategory(v.findings) : [],
    top: v ? topFindings(v.findings) : [],
    stalledProjects,
    unavailable: false,
  }
}

export const getAuditFindings = async (
  countyCode: string,
  fiscalYear: string,
): Promise<{ audit: AuditInfo | null; findings: AuditFindingRow[] }> => {
  try {
    const v = await loadAudit(countyCode, fiscalYear)
    return v ?? { audit: null, findings: [] }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
```

- [ ] **Step 2: Link reports to findings**

In `src/services/Hesabu.ts`:

1. In `export type ReportData = { ... }`, add `auditFinding: { number: number } | null`.
2. In `export type CreateReportInput = { ... }`, add `auditFindingId?: string`.
3. In **both** `getReportsByCounty` and `createReport`, extend the `include` with `auditFinding: { select: { number: true } },`.
4. In `createReport`, after the `if (!input.countyId || !input.wardId || !input.sectorId)` check, add:

```ts
    if (input.auditFindingId !== undefined) {
      if (typeof input.auditFindingId !== "string") throw new Error("Invalid audit finding")
      const [finding, county] = await Promise.all([
        prisma.hAuditFinding.findUnique({ where: { id: input.auditFindingId }, select: { audit: { select: { countyCode: true } } } }),
        prisma.hCounty.findUnique({ where: { id: input.countyId }, select: { code: true } }),
      ])
      if (!finding || !county || finding.audit.countyCode !== county.code) throw new Error("Invalid audit finding")
    }
```

5. In `createReport`'s `data: { ... }`, add `auditFindingId: input.auditFindingId ?? null,`.

- [ ] **Step 3: Type-check and run the suite**

Run: `npx tsc --noEmit -p . 2>&1 | grep "error TS" | head`
Expected: no output

Run: `npm run hesabu:test 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# fail 0`

- [ ] **Step 4: Check the summary and the cross-county rejection against the database**

Create `scripts/hesabu/_audit-check.mts` (temporary; deleted in this step):

```ts
import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })
const { getAuditSummary, createReport } = await import("../../src/services/Hesabu")
const { PrismaClient } = await import("@prisma/client")
const p = new PrismaClient()

const s = await getAuditSummary("001", "2025/2026")
console.log("mombasa:", s.audit?.fiscalYear, s.audit?.opinion, s.audit?.totalFindings, JSON.stringify(s.counts.map((c) => [c.key, c.count])), "top:", s.top.map((t) => t.number).join(","))
console.log("old year:", (await getAuditSummary("001", "2015/2016")).audit)

const wajirFinding = await p.hAuditFinding.findFirst({ where: { audit: { countyCode: "008" } }, select: { id: true } })
const mombasa = await p.hCounty.findFirst({ where: { code: "001" }, include: { wards: { take: 1 }, sectors: { take: 1 } } })
try {
  await createReport({ countyId: mombasa!.id, wardId: mombasa!.wards[0].id, sectorId: mombasa!.sectors[0].id, title: "x", auditFindingId: wajirFinding!.id })
  console.log("cross-county: ACCEPTED (bug)")
} catch (e) {
  console.log("cross-county:", e instanceof Error ? e.message : e)
}
await p.$disconnect()
```

Run: `npx tsx scripts/hesabu/_audit-check.mts; rm scripts/hesabu/_audit-check.mts`

Expected:
- `mombasa: 2023/2024 Qualified 16 [["opinion_basis",5],["lawfulness",6],["governance",2],["emphasis_matter",2],["other_matter",1]] top: ` followed by the 5 `opinion_basis` finding numbers in ascending order.
- `old year: null`
- `cross-county: Invalid audit finding`

If the alias `@/db` doesn't resolve under `tsx`, run it with `npx tsx --tsconfig tsconfig.json …`. If it still fails, verify the same three facts through the browser in Task 8 and record a ruling.

- [ ] **Step 5: Commit**

```bash
git add src/services/Hesabu.ts
git commit -m "feat(hesabu): audit summary and findings services; citizen reports can link a finding"
```

---

### Task 5: Budget Overview section and label fixes

**Files:**
- Create: `src/components/hesabu/budget-text.ts`
- Create: `src/components/hesabu/budget-text.test.ts`
- Create: `src/components/hesabu/AuditSection.tsx`
- Modify: `src/components/hesabu/BudgetOverview.tsx` (props; the absorption alert text at lines 177–179; insert the section before `{/* Absorption alert */}`)
- Modify: `src/components/hesabu/KPICards.tsx` (line 38)
- Modify: `src/components/hesabu/Dashboard.tsx` (props; the `BudgetOverview` call; a `showAuditFindings` handler)
- Modify: `src/app/(frontend)/hesabu/page.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: `AuditSummary` and `getAuditSummary` (Task 4); `AUDIT_NOTE`, `fmtAmountCited`, `shortFiscalYear`, `opinionPalette` (Task 1).
- Produces:
  ```ts
  export function absorbedLabel(rate: number | null, fiscalYear: string): string
  export function absorptionAlertText(fiscalYear: string, rate: number | null, devBudgetText: string): string
  export function AuditSection(props: { summary: AuditSummary; fiscalYear: string; onSeeAll: () => void }): JSX.Element
  // Dashboard props gain auditSummary: AuditSummary. BudgetOverview props gain auditSummary: AuditSummary; onSeeAllFindings: () => void
  // The Citizen Reports block (Task 6) renders an element with id="audit-findings"
  ```

- [ ] **Step 1: Write the failing tests**

Create `src/components/hesabu/budget-text.test.ts`:

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { absorbedLabel, absorptionAlertText } from "./budget-text"

test("absorbedLabel uses the year being viewed", () => {
  assert.equal(absorbedLabel(58, "2023/2024"), "58% absorbed (FY 2023/2024)")
  assert.equal(absorbedLabel(null, "2023/2024"), "N/A% absorbed (FY 2023/2024)")
})

test("absorptionAlertText states the share of the budget spent, for the year viewed, with no unsourced claims", () => {
  const t = absorptionAlertText("2025/2026", 50, "KSh 3.23B")
  assert.equal(t, "In FY 2025/2026, 50% of the KSh 3.23B development budget was spent.")
  assert.doesNotMatch(t, /CADP|procurement/)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/components/hesabu/budget-text.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` … `budget-text`

- [ ] **Step 3: Implement `budget-text.ts` and fix the labels**

Create `src/components/hesabu/budget-text.ts`:

```ts
/** Dashboard budget wording — always for the year being viewed, never hard-coded */
export function absorbedLabel(rate: number | null, fiscalYear: string): string {
  return `${rate === null ? "N/A" : rate.toFixed(0)}% absorbed (FY ${fiscalYear})`
}

export function absorptionAlertText(fiscalYear: string, rate: number | null, devBudgetText: string): string {
  const share = rate === null ? "an unknown share" : `${rate.toFixed(0)}%`
  return `In FY ${fiscalYear}, ${share} of the ${devBudgetText} development budget was spent.`
}
```

In `KPICards.tsx`, add `import { absorbedLabel } from "./budget-text"` and replace:

```ts
      sub: `${county.devAbsorptionRate?.toFixed(0) ?? "N/A"}% absorbed (FY 24/25)`,
```

with:

```ts
      sub: absorbedLabel(county.devAbsorptionRate ?? null, county.fiscalYear),
```

In `BudgetOverview.tsx`, add `import { absorptionAlertText } from "./budget-text"` and replace the alert's text block:

```tsx
            In FY 2024/25, only {fmtB(county.developmentExpenditure)} of the development budget was
            spent by Q4 &mdash; a {county.devAbsorptionRate?.toFixed(0)}% absorption rate. The county CADP
            notes execution challenges including procurement delays.
```

with:

```tsx
            {absorptionAlertText(county.fiscalYear, county.devAbsorptionRate ?? null, fmtB(county.developmentExpenditure))}
```

Add ` src/components/hesabu/budget-text.test.ts` to `hesabu:test` in `package.json`.

Run: `npx tsx --test src/components/hesabu/budget-text.test.ts`
Expected: `# pass 2`, `# fail 0`

- [ ] **Step 4: `AuditSection.tsx`**

```tsx
"use client"

import { Badge, Box, Button, Grid, HStack, Link, Text, VStack } from "@chakra-ui/react"
import type { AuditSummary } from "@/services/Hesabu"
import { AUDIT_NOTE, fmtAmountCited, opinionPalette, shortFiscalYear } from "./audit-format"

type Props = { summary: AuditSummary; fiscalYear: string; onSeeAll: () => void }

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Box bg="gray.50" borderRadius="md" p={3}>
      <Text fontSize="2xl" fontWeight="800" color="gray.800">{value}</Text>
      <Text fontSize="xs" color="gray.600">{label}</Text>
    </Box>
  )
}

export function AuditSection({ summary, fiscalYear, onSeeAll }: Props) {
  const { audit, counts, top, stalledProjects, unavailable } = summary
  const countOf = (key: string) => counts.find((c) => c.key === key)?.count ?? 0
  const stalledStat = <Stat value={stalledProjects === null ? "—" : String(stalledProjects)}
    label={stalledProjects === null ? "stalled projects: not yet scraped" : "documented stalled projects"} />

  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5} mb={4}>
      <Text fontWeight="bold" color="gray.700" fontSize="md" mb={2}>Audit &amp; accountability</Text>
      {unavailable ? (
        <Text fontSize="sm" color="gray.600">Audit data unavailable right now.</Text>
      ) : !audit ? (
        <VStack align="stretch" gap={3}>
          <Text fontSize="sm" color="gray.600">No audit loaded for FY {fiscalYear}</Text>
          <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={3}>{stalledStat}</Grid>
        </VStack>
      ) : (
        <VStack align="stretch" gap={4}>
          <HStack gap={2} flexWrap="wrap" fontSize="sm" color="gray.700">
            <Text>Latest audit: FY {shortFiscalYear(audit.fiscalYear)} · {audit.entity} ·</Text>
            <Badge colorPalette={opinionPalette(audit.opinion)}>{audit.opinion} opinion</Badge>
            <Link href={audit.sourceUrl} target="_blank" rel="noopener noreferrer" color="teal.700" fontSize="xs">Source</Link>
          </HStack>
          <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={3}>
            <Stat value={String(audit.totalFindings)} label="findings raised by the Auditor-General" />
            <Stat value={String(countOf("opinion_basis"))} label="reasons for the opinion" />
            <Stat value={String(countOf("lawfulness"))} label="on lawful use of public money" />
            {stalledStat}
          </Grid>
          {top.length > 0 && (
            <VStack align="stretch" gap={2}>
              <Text fontSize="sm" fontWeight="bold" color="gray.700">Most serious findings</Text>
              {top.map((f) => (
                <Box key={f.id} border="1px solid" borderColor="gray.100" borderRadius="md" p={3}>
                  <Text fontSize="sm" fontWeight="600">#{f.number} {f.title}</Text>
                  <HStack gap={2} flexWrap="wrap" mt={1}>
                    <Badge size="sm" colorPalette="gray">{f.categoryLabel}</Badge>
                    {fmtAmountCited(f.amountCited) && <Text fontSize="xs" color="gray.600">{fmtAmountCited(f.amountCited)}</Text>}
                  </HStack>
                  {f.summary && <Text fontSize="xs" color="gray.600" mt={1} lineClamp={2}>{f.summary}</Text>}
                </Box>
              ))}
              <Button size="sm" variant="outline" alignSelf="flex-start" onClick={onSeeAll}>
                See all {audit.totalFindings} findings →
              </Button>
            </VStack>
          )}
        </VStack>
      )}
      <Text fontSize="xs" color="gray.500" mt={4}>{AUDIT_NOTE}</Text>
    </Box>
  )
}
```

- [ ] **Step 5: Wire it into the page, the dashboard and BudgetOverview**

**`src/app/(frontend)/hesabu/page.tsx`**
1. Add `getAuditSummary` to the `@/services/Hesabu` import.
2. Extend the second `Promise.all`:

```tsx
  const [county, trendData, projectSummary, sectorSummary, auditSummary] = await Promise.all([
    getCountyByCode(resolvedCode, fiscalYear),
    getHistoricalTrend(resolvedCode),
    orFallback(getProjectSummaryByCard(resolvedCode, fiscalYear), [], "project summary"),
    orFallback(getProjectSummaryBySector(resolvedCode, fiscalYear), [], "sector project summary"),
    orFallback(getAuditSummary(resolvedCode, fiscalYear),
      { audit: null, counts: [], top: [], stalledProjects: null, unavailable: true }, "audit summary"),
  ]);
```

3. Pass `auditSummary={auditSummary}` to `<HesabuDashboard ... />`.

**`Dashboard.tsx`**
1. Add `AuditSummary` to the `@/services/Hesabu` type import.
2. Add `auditSummary: AuditSummary;` to `Props` and destructure it.
3. Below `const [activeTab, setActiveTab] = useState<Tab>("budget");`, add:

```tsx
  const showAuditFindings = () => {
    setActiveTab("reports");
    setTimeout(() => document.getElementById("audit-findings")?.scrollIntoView({ behavior: "smooth" }), 50);
  };
```

4. Add `auditSummary={auditSummary}` and `onSeeAllFindings={showAuditFindings}` to the `<BudgetOverview ... />` call.

**`BudgetOverview.tsx`**
1. Add `AuditSummary` to the `@/services/Hesabu` import and `import { AuditSection } from "./AuditSection"`.
2. Add `auditSummary: AuditSummary` and `onSeeAllFindings: () => void` to `Props` and destructure them.
3. Directly before `{/* Absorption alert */}`, insert:

```tsx
      <AuditSection summary={auditSummary} fiscalYear={currentYear} onSeeAll={onSeeAllFindings} />
```

- [ ] **Step 6: Type-check, run the suite, smoke-check**

Run: `npx tsc --noEmit -p . 2>&1 | grep "error TS" | grep -v "^.next/" | head`
Expected: no output

Run: `npm run hesabu:test 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# fail 0`

With the dev server running on 3100 (restart it if it was started before Task 2's `prisma generate`):

Run: `curl -s "http://localhost:3100/hesabu?county=001&year=2025/2026" | sed 's/<!-- -->//g' | grep -o "Audit &amp; accountability\|Latest audit: FY 2023/24\|Qualified opinion\|absorbed (FY 2025/2026)\|24/25\|CADP" | sort | uniq -c`
Expected: `Audit &amp; accountability`, `Latest audit: FY 2023/24`, `Qualified opinion` and `absorbed (FY 2025/2026)` each appear; `24/25` and `CADP` do **not** appear.

- [ ] **Step 7: Commit**

```bash
git add src/components/hesabu/budget-text.ts src/components/hesabu/budget-text.test.ts src/components/hesabu/AuditSection.tsx src/components/hesabu/BudgetOverview.tsx src/components/hesabu/KPICards.tsx src/components/hesabu/Dashboard.tsx "src/app/(frontend)/hesabu/page.tsx" package.json
git commit -m "feat(hesabu): Audit & accountability section; absorption labels use the viewed year"
```

---

### Task 6: Citizen Reports — Auditor-General block and linked reports

**Files:**
- Create: `src/components/hesabu/AuditFindings.tsx`
- Modify: `src/components/hesabu/CitizenReports.tsx`
- Modify: `src/components/hesabu/ReportForm.tsx`
- Modify: `src/components/hesabu/ReportCard.tsx`
- Modify: `src/components/hesabu/Dashboard.tsx` (the `CitizenReports` call)

**Interfaces:**
- Consumes: `getAuditFindings`, `AuditFindingRow`, `AuditInfo`, `ReportData.auditFinding` and `CreateReportInput.auditFindingId` (Task 4); `countByCategory`, `fmtAmountCited`, `shortFiscalYear`, `AUDIT_NOTE` (Task 1).
- Produces:
  ```ts
  export function AuditFindings(props: { countyCode: string; fiscalYear: string; onReport: (f: AuditFindingRow) => void }): JSX.Element
  // root element id="audit-findings"
  // ReportForm gains: linkedFinding?: { id: string; number: number; title: string }
  // CitizenReports gains props: countyCode: string; fiscalYear: string
  ```

- [ ] **Step 1: `AuditFindings.tsx`**

```tsx
"use client"

import { useEffect, useState } from "react"
import { Badge, Box, Button, HStack, Spinner, Text, VStack } from "@chakra-ui/react"
import { getAuditFindings, type AuditFindingRow, type AuditInfo } from "@/services/Hesabu"
import { AUDIT_NOTE, countByCategory, fmtAmountCited, shortFiscalYear } from "./audit-format"

type Props = { countyCode: string; fiscalYear: string; onReport: (f: AuditFindingRow) => void }
type Loaded = { audit: AuditInfo | null; findings: AuditFindingRow[] }

const KNOWN = new Set(["opinion_basis", "lawfulness", "governance", "emphasis_matter", "other_matter"])

export function AuditFindings({ countyCode, fiscalYear, onReport }: Props) {
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [category, setCategory] = useState("all")

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(false)
    getAuditFindings(countyCode, fiscalYear)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [countyCode, fiscalYear, attempt])

  const counts = data ? countByCategory(data.findings) : []
  const shown = (data?.findings ?? []).filter((f) =>
    category === "all" || (category === "other" ? !KNOWN.has(f.category) : f.category === category))

  return (
    <Box id="audit-findings" mt={8} pt={6} borderTop="1px solid" borderColor="gray.200">
      <Text fontWeight="bold" color="gray.700" fontSize="md">
        From the Auditor-General{data?.audit ? ` (FY ${shortFiscalYear(data.audit.fiscalYear)})` : ""}
      </Text>
      {data?.audit && (
        <Text fontSize="xs" color="gray.600" mb={2}>
          {data.audit.entity} · {data.audit.opinion} opinion · {data.audit.totalFindings} findings. These are audit queries, not citizen reports.
        </Text>
      )}
      <Text fontSize="xs" color="gray.500" mb={3}>{AUDIT_NOTE}</Text>

      {error ? (
        <HStack gap={3}>
          <Text fontSize="sm" color="red.600">Couldn&apos;t load the audit findings.</Text>
          <Button size="xs" variant="outline" onClick={() => setAttempt((n) => n + 1)}>Retry</Button>
        </HStack>
      ) : !data ? (
        <Spinner size="sm" />
      ) : !data.audit ? (
        <Text fontSize="sm" color="gray.600">No audit loaded for FY {fiscalYear}</Text>
      ) : (
        <VStack align="stretch" gap={3}>
          <HStack gap={2} flexWrap="wrap">
            {[{ key: "all", label: "All", count: data.findings.length }, ...counts].map((c) => {
              const active = category === c.key
              return (
                <Box key={c.key} as="button" px={3} py={1.5} borderRadius="full" fontSize="xs"
                  fontWeight={active ? "bold" : "normal"} bg={active ? "#0f172a" : "gray.100"}
                  color={active ? "white" : "gray.600"} cursor="pointer" onClick={() => setCategory(c.key)}>
                  {c.label} ({c.count})
                </Box>
              )
            })}
          </HStack>
          {shown.map((f) => (
            <Box key={f.id} bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={4}>
              <Text fontSize="sm" fontWeight="600">#{f.number} {f.title}</Text>
              <HStack gap={2} flexWrap="wrap" mt={1}>
                <Badge size="sm" colorPalette="gray">{f.categoryLabel}</Badge>
                {fmtAmountCited(f.amountCited) && <Text fontSize="xs" color="gray.600">{fmtAmountCited(f.amountCited)}</Text>}
                {f.linkedReports > 0 && (
                  <Text fontSize="xs" color="teal.700">{f.linkedReports} citizen {f.linkedReports === 1 ? "report" : "reports"}</Text>
                )}
              </HStack>
              {f.summary && <Text fontSize="xs" color="gray.600" mt={1} lineClamp={3}>{f.summary}</Text>}
              <Button size="xs" mt={2} variant="outline" onClick={() => onReport(f)}>Have you seen this?</Button>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  )
}
```

- [ ] **Step 2: `ReportForm` accepts a linked finding**

In `ReportForm.tsx`:
1. Add `linkedFinding?: { id: string; number: number; title: string }` to `Props` and destructure it.
2. Change `const [title, setTitle] = useState("")` to:

```tsx
  const [title, setTitle] = useState(linkedFinding ? `Re: ${linkedFinding.title}`.slice(0, 300) : "")
```

3. In the `createReport({ ... })` call, add `auditFindingId: linkedFinding?.id,`.
4. At the top of the returned form's first child, render:

```tsx
      {linkedFinding && (
        <Text fontSize="xs" color="teal.800" bg="teal.50" borderRadius="md" px={3} py={2} mb={3}>
          Linked audit finding #{linkedFinding.number}: {linkedFinding.title}
        </Text>
      )}
```

- [ ] **Step 3: `CitizenReports` wires the block and the link; `ReportCard` shows the tag**

In `CitizenReports.tsx`:
1. Add `countyCode: string` and `fiscalYear: string` to `Props` and destructure them.
2. Add the imports `import { AuditFindings } from "./AuditFindings"` and `import type { AuditFindingRow } from "@/services/Hesabu"`.
3. Add this state: `const [linkedFinding, setLinkedFinding] = useState<AuditFindingRow | null>(null)`.
4. Add this handler:

```tsx
  const reportFromFinding = (f: AuditFindingRow) => {
    setLinkedFinding(f)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
```

5. **Header button:** change `onClick={() => setShowForm((v) => !v)}` to `onClick={() => { setShowForm((v) => !v); setLinkedFinding(null) }}`.
6. **Form:** pass `key={linkedFinding?.id ?? "new"}` and `linkedFinding={linkedFinding ?? undefined}` to `<ReportForm ... />`. Change its `onCancel` to `() => { setShowForm(false); setLinkedFinding(null) }`.
7. **Empty state:** replace the text node inside it

```tsx
            No {filter !== "ALL" ? filter.toLowerCase() : ""} reports for this county.
```

   with:

```tsx
            {filter === "ALL" && reports.length === 0
              ? "No citizen reports yet. Start with an Auditor-General finding below"
              : `No ${filter !== "ALL" ? filter.toLowerCase() : ""} reports for this county.`}
```

8. **Block:** just before the component's final closing `</Box>`, render `<AuditFindings countyCode={countyCode} fiscalYear={fiscalYear} onReport={reportFromFinding} />`.

In `Dashboard.tsx`, change the `CitizenReports` call to:

```tsx
              <CitizenReports county={county} initialReports={reports} countyCode={currentCountyCode} fiscalYear={currentYear} />
```

In `ReportCard.tsx`, immediately after the element that renders `report.title`, add:

```tsx
            {report.auditFinding && (
              <Text fontSize="2xs" color="teal.700" fontWeight="600">Linked to audit finding #{report.auditFinding.number}</Text>
            )}
```

- [ ] **Step 4: Type-check and smoke-check**

Run: `npx tsc --noEmit -p . 2>&1 | grep "error TS" | grep -v "^.next/" | head`
Expected: no output

Run: `npm run hesabu:test 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add src/components/hesabu/AuditFindings.tsx src/components/hesabu/CitizenReports.tsx src/components/hesabu/ReportForm.tsx src/components/hesabu/ReportCard.tsx src/components/hesabu/Dashboard.tsx
git commit -m "feat(hesabu): Auditor-General findings on Citizen Reports with 'Have you seen this?' linked reports"
```

---

### Task 7: Compare page — Accountability group

**Files:**
- Modify: `src/components/hesabu/compare-metrics.ts`
- Modify: `src/components/hesabu/compare-metrics.test.ts`
- Modify: `src/components/hesabu/compare-data.ts`
- Modify: `src/components/hesabu/compare-data.test.ts`
- Modify: `src/services/Hesabu.ts` (`getCountyComparison`)

**Interfaces:**
- Consumes: `auditForYear`, `shortFiscalYear` from `./audit-format` (Task 1).
- Produces:
  - `MetricGroup` gains `"Accountability"`; `METRIC_GROUPS` becomes `["Budget", "Performance", "Sectors", "Projects", "Accountability"]`.
  - `MetricDef` gains `projectBased?: boolean`.
  - `ComparisonCounty` gains `audit: { fiscalYear: string; findings: number } | null`.
  - `export type AuditCount = { countyCode: string; fiscalYear: string; findings: number }`.
  - `toComparisonCounties(rows, projects, audits: AuditCount[] = [], fiscalYear = "")`.
- **Breaking change inside this task:** `stalledProjects` moves from group `Projects` to `Accountability`. The "not yet scraped" logic must therefore key on `projectBased`, not on the group.

- [ ] **Step 1: Update and add the tests (failing)**

In `compare-metrics.test.ts`:
1. In the `county()` helper's default object, add `audit: { fiscalYear: "2023/2024", findings: 20 },`.
2. In the test `"buildMetrics: budget, performance, one figure per sector (sorted), then projects"`, change the tail of the expected array from `"projects", "stalledProjects",` to `"projects", "auditFindings", "stalledProjects",`.
3. Append:

```ts
test("Accountability group: audit findings and stalled projects", () => {
  const ms = buildMetrics([county("001")])
  const audit = pickMetric(ms, "auditFindings")
  assert.equal(audit.group, "Accountability")
  assert.equal(audit.direction, "neutral")
  assert.equal(audit.note, "FY 2023/24 audit")
  assert.equal(audit.value(county("001")), 20)
  assert.equal(cellText(audit, county("001", { audit: null }), "2025/2026"), "—")
  const stalled = pickMetric(ms, "stalledProjects")
  assert.equal(stalled.group, "Accountability")
  assert.equal(cellText(stalled, county("001", { projects: { state: "not-scraped", total: 0, stalled: 0 } }), "2025/2026"), "Not yet scraped")
})

test("summarizeRanking still reports unscraped counties for stalled projects after the group move", async () => {
  const { summarizeRanking } = await import("./compare-metrics")
  const cs = [county("008", { name: "Wajir" }), county("047", { name: "Nairobi City", projects: { state: "not-scraped", total: 0, stalled: 0 } })]
  const s = summarizeRanking(pickMetric(buildMetrics(cs), "stalledProjects"), cs, ["047"], [], "2025/2026")
  assert.deepEqual(s.notScraped, ["Nairobi City"])
  assert.equal(s.rankLines[0].text, "not yet scraped")
})
```

In `compare-data.test.ts`, append:

```ts
test("audit count uses the latest audit up to the year; none gives null", () => {
  const audits = [{ countyCode: "030", fiscalYear: "2023/2024", findings: 25 }, { countyCode: "030", fiscalYear: "2026/2027", findings: 9 }]
  const [baringo, nairobi] = toComparisonCounties([row("030"), row("047")], null, audits, "2025/2026")
  assert.deepEqual(baringo.audit, { fiscalYear: "2023/2024", findings: 25 })
  assert.equal(nairobi.audit, null)
  assert.equal(toComparisonCounties([row("030")], null, audits, "2015/2016")[0].audit, null)
  assert.equal(toComparisonCounties([row("030")], null)[0].audit, null)
})
```

Run: `npx tsx --test src/components/hesabu/compare-metrics.test.ts src/components/hesabu/compare-data.test.ts 2>&1 | grep -E "^# (pass|fail)|^not ok"`
Expected: FAIL. The buildMetrics order test, the two new metrics tests and the new data test fail; tsx doesn't type-check, so the extra `audit` field doesn't stop the run.

- [ ] **Step 2: Implement**

In `compare-metrics.ts`:

1. Add `import { shortFiscalYear } from "./audit-format"`.
2. Change `export type MetricGroup = "Budget" | "Performance" | "Sectors" | "Projects"` to include `| "Accountability"`, and `METRIC_GROUPS` to `["Budget", "Performance", "Sectors", "Projects", "Accountability"]`.
3. Add `projectBased?: boolean` to `MetricDef` (after `note?: string`).
4. Add `audit: { fiscalYear: string; findings: number } | null` to `ComparisonCounty` (after `projects: ProjectCoverage`).
5. Replace the `PROJECTS` array with:

```ts
const PROJECTS: MetricDef[] = [
  { key: "projects", label: "Documented projects", group: "Projects", unit: "count", direction: "neutral",
    value: scraped((p) => p.total), note: "From scraped public documents", projectBased: true },
]

function auditNote(counties: ComparisonCounty[]): string {
  const years = [...new Set(counties.map((c) => c.audit?.fiscalYear).filter((y): y is string => !!y))]
  return years.length === 1 ? `FY ${shortFiscalYear(years[0])} audit` : "Latest audit up to this year"
}

function accountability(counties: ComparisonCounty[]): MetricDef[] {
  return [
    { key: "auditFindings", label: "Audit findings (latest audit)", group: "Accountability", unit: "count", direction: "neutral",
      value: (c) => c.audit?.findings ?? null, note: auditNote(counties) },
    { key: "stalledProjects", label: "Documented stalled projects", group: "Accountability", unit: "count", direction: "neutral",
      value: scraped((p) => p.stalled), projectBased: true },
  ]
}
```

6. In `buildMetrics`, change the return to `return [...BUDGET_AND_PERFORMANCE, ...sectors, ...PROJECTS, ...accountability(counties)]`.
7. In `cellText`, change `if (v === null && metric.group === "Projects") {` to `if (v === null && metric.projectBased) {`.
8. In `summarizeRanking`, change `const isProjects = metric.group === "Projects"` to `const isProjects = metric.projectBased === true`.

In `compare-data.ts`:

1. Add `import { auditForYear } from "./audit-format"`.
2. Add `export type AuditCount = { countyCode: string; fiscalYear: string; findings: number }`.
3. Change the signature to:

```ts
export function toComparisonCounties(
  rows: CountyRow[], projects: ProjectCounts | null, audits: AuditCount[] = [], fiscalYear = "",
): ComparisonCounty[] {
```

4. In the mapped object, after `projects: coverageFor(r.code, projects),`, add:

```ts
    audit: (() => {
      const a = fiscalYear ? auditForYear(audits.filter((x) => x.countyCode === r.code), fiscalYear) : null
      return a ? { fiscalYear: a.fiscalYear, findings: a.findings } : null
    })(),
```

In `src/services/Hesabu.ts`, in `getCountyComparison`:

1. Change `const [rows, projects] = await Promise.all([` to `const [rows, projects, audits] = await Promise.all([`.
2. Add a third entry to that `Promise.all`:

```ts
      orFallback(
        prisma.hAudit.findMany({ where: { entity: "County Executive" }, select: { countyCode: true, fiscalYear: true, totalFindings: true } })
          .then((r) => r.map((a) => ({ countyCode: a.countyCode, fiscalYear: a.fiscalYear, findings: a.totalFindings }))),
        [], "comparison audits"),
```

3. Change the return to `return toComparisonCounties(rows, projects, audits, fiscalYear)`.

- [ ] **Step 3: Run the tests and type-check**

Run: `npm run hesabu:test 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# fail 0`

Run: `npx tsc --noEmit -p . 2>&1 | grep "error TS" | grep -v "^.next/" | head`
Expected: no output. If a test helper object literal is now missing `audit` (in `compare-data.test.ts` or elsewhere), add `audit: null` to it and record a ruling.

- [ ] **Step 4: Commit**

```bash
git add src/components/hesabu/compare-metrics.ts src/components/hesabu/compare-metrics.test.ts src/components/hesabu/compare-data.ts src/components/hesabu/compare-data.test.ts src/services/Hesabu.ts
git commit -m "feat(hesabu): compare page Accountability group with audit findings count"
```

---

### Task 8: Reload projects, re-run the audit load, browser check

**Files:** none new (a check script lives in the scratchpad).

- [ ] **Step 1: Reload projects with the Hawkeye-only skip**

Run: `npm run hesabu:load -- --dry-run 2>&1 | tail -15`
Expected: one line per seeded county with an `audit-only (Hawkeye)` count above 0 (for example Wajir ≈ 19), and `(dry run — nothing written)`. Counties without ward cards print a "skipped" warning; that is existing behaviour.

Run: `npm run hesabu:load 2>&1 | tail -5`
Expected: `✅ Load complete`

- [ ] **Step 2: Restart the dev server**

The Prisma client changed in Task 2, so a running server would serve the old client. Stop and restart: `rm -rf .next && npx next dev --turbopack -p 3100`.

- [ ] **Step 3: Browser check**

Create `audit-check.mjs` in `/private/tmp/claude-501/-Users-ken-Sites-Javascript-ReactJs-sam-forms/1f1cd11c-cae0-4a8e-ae54-2392c3d996cc/scratchpad/pw` (playwright-core is installed there):

```js
import { chromium } from "playwright-core"
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const base = "http://localhost:3100"
const b = await chromium.launch({ executablePath: exe })
const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
const text = () => p.innerText("body")

await p.goto(`${base}/hesabu?county=001&year=2025/2026`, { waitUntil: "networkidle" })
let t = await text()
console.log("section:", /Audit & accountability/.test(t), "| latest:", /Latest audit: FY 2023\/24/.test(t), "| opinion:", /Qualified opinion/.test(t))
console.log("16 findings:", /16\s*findings raised by the Auditor-General/.test(t), "| 5 reasons:", /5\s*reasons for the opinion/.test(t), "| 6 lawful:", /6\s*on lawful use of public money/.test(t))
console.log("no money total:", !/total (queried|irregular|unsupported)|KES [\d.]+B queried/i.test(t), "| no 24/25:", !/FY 24\/25/.test(t), "| no CADP:", !/CADP/.test(t))
await p.screenshot({ path: "audit-overview.png", fullPage: true })

await p.getByRole("button", { name: /See all 16 findings/ }).click()
await p.waitForSelector("#audit-findings :text('Have you seen this?')")
t = await text()
console.log("block:", /From the Auditor-General \(FY 2023\/24\)/.test(t), "| empty-state:", /Start with an Auditor-General finding below/.test(t))
await p.getByRole("button", { name: "Have you seen this?" }).first().click()
console.log("prefill:", await p.locator("input[value^='Re: ']").count() > 0 || await p.locator("textarea, input").evaluateAll((els) => els.some((e) => e.value?.startsWith("Re: "))),
  "| linked line:", /Linked audit finding #\d+/.test(await text()))
await p.screenshot({ path: "audit-reports.png", fullPage: true })

await p.goto(`${base}/hesabu?county=001&year=2015/2016`, { waitUntil: "networkidle" })
console.log("old year:", /No audit loaded for FY 2015\/2016/.test(await text()))

await p.goto(`${base}/hesabu/compare?view=rank&metric=auditFindings&counties=008&year=2025/2026`, { waitUntil: "networkidle" })
t = await text()
console.log("compare:", t.match(/Wajir: [^\n]+/)?.[0], "| note:", /FY 2023\/24 audit|Audit findings \(latest audit\)/.test(t))

await p.setViewportSize({ width: 375, height: 800 })
await p.goto(`${base}/hesabu?county=001&year=2025/2026`, { waitUntil: "networkidle" })
console.log("scrollWidth at 375:", await p.evaluate(() => document.documentElement.scrollWidth))
await p.screenshot({ path: "audit-mobile.png", fullPage: true })
await b.close()
```

Run: `cd /private/tmp/claude-501/-Users-ken-Sites-Javascript-ReactJs-sam-forms/1f1cd11c-cae0-4a8e-ae54-2392c3d996cc/scratchpad/pw && node audit-check.mjs`

Expected (Mombasa: 16 findings, 5 `opinion_basis`, 6 `lawfulness`; Wajir: 20 findings, tied 9th with Turkana among the 13):
- `section: true | latest: true | opinion: true`
- `16 findings: true | 5 reasons: true | 6 lawful: true`
- `no money total: true | no 24/25: true | no CADP: true`
- `block: true | empty-state: true`
- `prefill: true | linked line: true`
- `old year: true`
- `compare: Wajir: 9th of 13 | note: true`
- `scrollWidth at 375: 375`

Look at `audit-overview.png`, `audit-reports.png` and `audit-mobile.png` with the Read tool. Check the layout and that the wording says "raised" or "queried", never "mismanaged".

If the dashboard has citizen reports for Mombasa by then, `empty-state` is legitimately `false`; record that as a ruling instead of changing code.

- [ ] **Step 4: Re-load the audit data and check that ids are stable**

This proves Review Focus 1. Create `scripts/hesabu/_ids.mts` (temporary):

```ts
import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })
import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
const ids = (await p.hAuditFinding.findMany({ select: { id: true }, orderBy: { id: "asc" } })).map((r) => r.id)
console.log(ids.length, ids.slice(0, 3).join(","), ids.at(-1))
await p.$disconnect()
```

Run: `npx tsx scripts/hesabu/_ids.mts && npm run hesabu:load-audit | tail -2 && npx tsx scripts/hesabu/_ids.mts; rm scripts/hesabu/_ids.mts`
Expected: the two `_ids` lines are identical (`1043 …`), with `47 audits · 1043 findings · 0 skipped` between them.

- [ ] **Step 5: Commit (only if Steps 1–4 required code changes)**

If any code changed, commit it with a message that names the fix. Otherwise there is nothing to commit; record the check results in the ledger.

---

## Self-review notes

**Spec coverage**

| Spec section | Task |
|---|---|
| §1 data model | Task 2 |
| §2 loader, flags, cron | Task 2 |
| §2 Hawkeye-only skip | Task 3 |
| §3 helpers | Task 1 |
| §4 `getAuditSummary`, `getAuditFindings`, `createReport` check | Task 4 |
| §5A Budget Overview section | Task 5 |
| §5B Citizen Reports block, form prefill, tag, empty-state text | Task 6 |
| §5C compare page | Task 7 |
| §6 label fixes | Task 5 |
| Error handling: fetch failure writes nothing | Task 2 (`main().catch` before any write) |
| Error handling: audit unavailable | Tasks 4 and 5 |
| Error handling: inline retry | Task 6 |
| Error handling: invalid finding | Task 4 |
| Testing section | Tasks 1, 2, 3, 5 and 7 (unit); Task 4 (database check); Task 8 (browser and reload) |

**Type consistency.** These names are used identically everywhere: `AuditSummary`, `AuditFindingRow`, `AuditInfo`, `CategoryCount`, `auditForYear`, `projectBased` and `AuditCount`.
