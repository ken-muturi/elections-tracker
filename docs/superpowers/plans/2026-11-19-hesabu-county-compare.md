# Hesabu County Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/hesabu/compare` page with a side-by-side view (2–4 counties) and a ranking view (every county with data, for one figure), plus a **Compare counties** button on the existing dashboard.

**Architecture:**
- **Pure logic** lives in three small modules under `src/components/hesabu/`, each with `node:test` tests:
  - `compare-metrics.ts`: figure definitions, best value, uniform detection, ranking, formatting.
  - `compare-params.ts`: URL parsing and building.
  - `compare-data.ts`: converts database rows to comparison objects.
- **Data:** `src/services/Hesabu.ts` gets two thin server functions. They load every county for one fiscal year in one query, plus project counts that fall back gracefully if they fail.
- **UI:** a server page fetches the data. Client components render the controls, the table and a recharts bar chart.

**Tech Stack:** Next.js 15 App Router (server components plus `"use client"` components), React 19, Chakra UI v3, recharts 3, Prisma 6 (Neon Postgres), `node:test` run through `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-19-hesabu-county-compare-design.md`

## Global Constraints

**Page and URL**
- Route: `/hesabu/compare`. Params: `view` (`side`|`rank`, default `side`), `year` (default the latest year with data), `counties` (comma-separated codes, unknown codes and duplicates dropped, max 4), `metric` (default `absorption`).
- A bad URL param never causes a 404; it falls back to the default.
- Page title: "Compare counties — Hesabu".

**Figures**
- `kes` figures are formatted with the existing `fmtKesShort`, `pct` to one decimal with `%`, and `count` with `toLocaleString("en-KE")`. A null value shows "—".
- A zero or missing denominator gives `null`, never `NaN` or `Infinity`.
- `isUniform`: values differ by less than 0.05 percentage points (`pct`) or less than 0.1% relative (other units). It needs at least 2 non-null values. It is computed across **all counties for the year**.
- A uniform figure is never marked best and never charted. The ranking view shows: "All N counties have the same value (X). In our data this figure is an estimate, so it can't be ranked yet."
- Neutral figures (`totalBudget`, `equitableShare`, sector shares, `projects`, `stalledProjects`) are never marked best.
- Ties share a rank (1, 2, 2, 4) and all get the "Highest" badge.

**Wording**
- Rank lines read "Wajir: 12th of 13".
- The header reads "N counties with data for FY {year}". The ranking header reads "Ranked among the N counties with data for FY {year}". N is always computed, never hard-coded.
- Project cells:
  - a county with no scraped rows in any year: "Not yet scraped";
  - the project queries failed: "Unavailable";
  - scraped, but nothing for this year: `0`.
- A selected county with no data for the year shows "No data for FY {year}" in its column.
- Data note on both views, verbatim: "County figures are compiled estimates from budget documents and the Division of Revenue Act, not audited actuals. Figures marked 'same for all counties' cannot be compared yet. Project counts cover only counties whose public documents have been scraped."

**Layout and links**
- At phone width (375px) the page has no sideways scroll. The table scrolls sideways inside its own container, with a sticky first column.
- The Compare button on the dashboard links to `/hesabu/compare?view=side&year=<current year>&counties=<current code>`.

**Repo rules**
- Pure modules use **relative** imports (no `@/`) so `tsx --test` can resolve them.
- `src/services/Hesabu.ts` is a `"use server"` file. Every exported function there must be `async`.
- Do not run `prisma format`. No schema change is needed.

## Review Focus

1. **A county in the URL with no data for the chosen year** (e.g. `counties=007` with `year=2025/2026` when Tana River only has 2015/16 data). Its column should say "No data for FY 2025/2026" and the page must not crash. Pinned by the `selectedColumns` and `cellText` tests in Task 1.
2. **A `metric` param for a sector key that doesn't exist in the chosen year, or a garbage metric.** Ranking should fall back to Development absorption, and the select should show that. Pinned by the `pickMetric` tests in Task 1.
3. **A county with total budget 0 or revenue target 0.** It should show "—", not "NaN%" or "Infinity%". Pinned by the zero-denominator test in Task 1.
4. **Three different project states**: project queries failed, county never scraped, and county scraped but with no rows this year. They should read "Unavailable", "Not yet scraped" and "0". Pinned by the `toComparisonCounties` tests in Task 3 and the `cellText` tests in Task 1.
5. **A highlighted county with no value for the ranking figure.** It should appear as "Wajir: no data" and be listed under "No data", not silently vanish. Pinned by the `rankRows` missing test in Task 1 and the rank-line logic in Task 4.

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `src/components/hesabu/compare-metrics.ts` | new | Types (`ComparisonCounty`, `MetricDef`), `buildMetrics`, `pickMetric`, `isUniform`, `bestOf`, `rankRows`, `formatValue`, `ordinal`, `selectedColumns`, `cellText`, constants |
| `src/components/hesabu/compare-metrics.test.ts` | new | Tests for the above |
| `src/components/hesabu/compare-params.ts` | new | `parseCompareParams`, `buildCompareHref`, `CompareParams` |
| `src/components/hesabu/compare-params.test.ts` | new | Tests |
| `src/components/hesabu/compare-data.ts` | new | `toComparisonCounties` (database rows → `ComparisonCounty[]`) |
| `src/components/hesabu/compare-data.test.ts` | new | Tests |
| `src/services/Hesabu.ts` | modify | `getCountyComparison`, `getComparisonYears` |
| `src/components/hesabu/CompareControls.tsx` | new | View toggle, year, county chips and picker, ranking figure select |
| `src/components/hesabu/CompareTable.tsx` | new | Side-by-side table |
| `src/components/hesabu/CompareRanking.tsx` | new | Ranking bar chart, uniform notice, rank lines, "No data" list |
| `src/components/hesabu/CompareView.tsx` | new | Page shell: header, controls, active view, data note |
| `src/app/(frontend)/hesabu/compare/page.tsx` | new | Server page: params, data fetch, empty state |
| `src/components/hesabu/Dashboard.tsx` | modify | "Compare counties" button in the header |
| `package.json` | modify | Add the three test files to `hesabu:test` |

---

### Task 1: Figure definitions and helpers (`compare-metrics.ts`)

**Files:**
- Create: `src/components/hesabu/compare-metrics.ts`
- Create: `src/components/hesabu/compare-metrics.test.ts`
- Modify: `package.json` (the `hesabu:test` script)

**Interfaces:**
- Consumes: `fmtKesShort(n: number): string` from `./project-format` (existing).
- Produces:
  ```ts
  export type ProjectCoverage = { state: "scraped" | "not-scraped" | "unavailable"; total: number; stalled: number }
  export type ComparisonCounty = { code: string; name: string; totalBudget: number; equitableShare: number;
    developmentExpenditure: number; revenueTarget: number; revenueCollected: number; devAbsorptionRate: number | null;
    sectors: { name: string; allocated: number }[]; projects: ProjectCoverage }
  export type Direction = "higher-better" | "neutral"
  export type MetricGroup = "Budget" | "Performance" | "Sectors" | "Projects"
  export type MetricUnit = "kes" | "pct" | "count"
  export interface MetricDef { key: string; label: string; group: MetricGroup; unit: MetricUnit; direction: Direction;
    value: (c: ComparisonCounty) => number | null; note?: string }
  export interface ValueRow { code: string; value: number | null }
  export interface RankedRow { code: string; value: number; rank: number }
  export interface Column { code: string; name: string; county: ComparisonCounty | null }
  export const DEFAULT_METRIC = "absorption"; export const MAX_COMPARE = 4; export const METRIC_GROUPS: MetricGroup[]
  export function buildMetrics(counties: ComparisonCounty[]): MetricDef[]
  export function pickMetric(metrics: MetricDef[], key: string | undefined): MetricDef
  export function isUniform(values: (number | null)[], unit: MetricUnit): boolean
  export function bestOf(metric: MetricDef, rows: ValueRow[], uniform: boolean): string[]
  export function rankRows(rows: ValueRow[]): { ranked: RankedRow[]; missing: string[] }
  export function formatValue(unit: MetricUnit, v: number | null): string
  export function ordinal(n: number): string
  export function selectedColumns(codes: string[], counties: ComparisonCounty[], options: { code: string; name: string }[]): Column[]
  export function cellText(metric: MetricDef, county: ComparisonCounty | null, year: string): string
  ```
- **Ruling (deviation from spec §3):** the spec gives `projects` as `{ scraped: boolean; total; stalled }`. A boolean can't tell "never scraped" apart from "project query failed", but the spec requires different text for each. So `ProjectCoverage.state` is a 3-way union.

- [ ] **Step 1: Write the failing tests**

Create `src/components/hesabu/compare-metrics.test.ts`:

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  ComparisonCounty, buildMetrics, pickMetric, isUniform, bestOf, rankRows,
  formatValue, ordinal, selectedColumns, cellText, DEFAULT_METRIC,
} from "./compare-metrics"

function county(code: string, over: Partial<ComparisonCounty> = {}): ComparisonCounty {
  return {
    code, name: `County ${code}`,
    totalBudget: 10_000_000_000, equitableShare: 8_000_000_000, developmentExpenditure: 3_000_000_000,
    revenueTarget: 1_000_000_000, revenueCollected: 900_000_000, devAbsorptionRate: 60,
    sectors: [{ name: "Health Services", allocated: 2_500_000_000 }, { name: "Water & Environment", allocated: 1_000_000_000 }],
    projects: { state: "scraped", total: 12, stalled: 3 },
    ...over,
  }
}
const metric = (key: string, cs: ComparisonCounty[] = [county("001")]) => pickMetric(buildMetrics(cs), key)

test("buildMetrics: budget, performance, one figure per sector (sorted), then projects", () => {
  const keys = buildMetrics([county("001"), county("002", { sectors: [{ name: "Agriculture & Livestock", allocated: 1 }] })]).map((m) => m.key)
  assert.deepEqual(keys, [
    "totalBudget", "equitableShare", "devShare", "absorption", "revenuePerformance",
    "sector:Agriculture & Livestock", "sector:Health Services", "sector:Water & Environment",
    "projects", "stalledProjects",
  ])
})

test("figure values", () => {
  const c = county("001")
  assert.equal(metric("devShare").value(c), 30)
  assert.equal(metric("absorption").value(c), 60)
  assert.equal(metric("revenuePerformance").value(c), 90)
  assert.equal(metric("sector:Health Services").value(c), 25)
  assert.equal(metric("projects").value(c), 12)
  assert.equal(metric("stalledProjects").value(c), 3)
})

test("zero or missing denominators give null, never NaN or Infinity", () => {
  const c = county("001", { totalBudget: 0, revenueTarget: 0 })
  assert.equal(metric("devShare").value(c), null)
  assert.equal(metric("revenuePerformance").value(c), null)
  assert.equal(metric("sector:Health Services").value(c), null)
  assert.equal(metric("sector:Water & Environment").value(county("002", { sectors: [] })), null)
})

test("project figures are null unless the county was scraped", () => {
  assert.equal(metric("projects").value(county("001", { projects: { state: "not-scraped", total: 0, stalled: 0 } })), null)
  assert.equal(metric("projects").value(county("001", { projects: { state: "unavailable", total: 0, stalled: 0 } })), null)
  assert.equal(metric("projects").value(county("001", { projects: { state: "scraped", total: 0, stalled: 0 } })), 0)
})

test("pickMetric falls back to absorption for unknown or missing keys", () => {
  const ms = buildMetrics([county("001")])
  assert.equal(pickMetric(ms, "sector:Nonexistent").key, DEFAULT_METRIC)
  assert.equal(pickMetric(ms, "garbage").key, DEFAULT_METRIC)
  assert.equal(pickMetric(ms, undefined).key, DEFAULT_METRIC)
  assert.equal(pickMetric(ms, "devShare").key, "devShare")
})

test("isUniform", () => {
  assert.equal(isUniform(Array(13).fill(90), "pct"), true)
  assert.equal(isUniform([90, 90.04, null], "pct"), true)
  assert.equal(isUniform([44, 50, 64], "pct"), false)
  assert.equal(isUniform([90], "pct"), false)
  assert.equal(isUniform([90, null], "pct"), false)
  assert.equal(isUniform([1_000_000, 1_000_500], "kes"), true)
  assert.equal(isUniform([1_000_000, 1_002_000], "kes"), false)
  assert.equal(isUniform([0, 0], "count"), true)
})

test("bestOf marks ties, ignores neutral and uniform figures, needs 2 values", () => {
  const abs = metric("absorption")
  assert.deepEqual(bestOf(abs, [{ code: "a", value: 64 }, { code: "b", value: 64 }, { code: "c", value: 50 }], false), ["a", "b"])
  assert.deepEqual(bestOf(abs, [{ code: "a", value: 64 }, { code: "b", value: null }], false), [])
  assert.deepEqual(bestOf(abs, [{ code: "a", value: 64 }, { code: "b", value: 50 }], true), [])
  assert.deepEqual(bestOf(metric("totalBudget"), [{ code: "a", value: 2 }, { code: "b", value: 1 }], false), [])
})

test("rankRows sorts descending, ties share a rank, nulls listed as missing", () => {
  const { ranked, missing } = rankRows([
    { code: "a", value: 50 }, { code: "b", value: 64 }, { code: "c", value: null }, { code: "d", value: 64 }, { code: "e", value: 44 },
  ])
  assert.deepEqual(ranked.map((r) => [r.code, r.rank]), [["b", 1], ["d", 1], ["a", 3], ["e", 4]])
  assert.deepEqual(missing, ["c"])
})

test("formatValue and ordinal", () => {
  assert.equal(formatValue("pct", 63.96), "64.0%")
  assert.equal(formatValue("kes", 9_459_567_317), "KES 9.46B")
  assert.equal(formatValue("count", 1234), (1234).toLocaleString("en-KE"))
  assert.equal(formatValue("pct", null), "—")
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map(ordinal),
    ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st"])
})

test("selectedColumns keeps URL order and names counties without data for the year", () => {
  const cols = selectedColumns(["030", "007"], [county("030", { name: "Baringo" })], [{ code: "007", name: "Tana River" }, { code: "030", name: "Baringo" }])
  assert.deepEqual(cols.map((c) => [c.code, c.name, c.county !== null]), [["030", "Baringo", true], ["007", "Tana River", false]])
})

test("cellText", () => {
  const y = "2025/2026"
  assert.equal(cellText(metric("absorption"), null, y), "No data for FY 2025/2026")
  assert.equal(cellText(metric("absorption"), county("001"), y), "60.0%")
  assert.equal(cellText(metric("projects"), county("001", { projects: { state: "not-scraped", total: 0, stalled: 0 } }), y), "Not yet scraped")
  assert.equal(cellText(metric("projects"), county("001", { projects: { state: "unavailable", total: 0, stalled: 0 } }), y), "Unavailable")
  assert.equal(cellText(metric("projects"), county("001", { projects: { state: "scraped", total: 0, stalled: 0 } }), y), "0")
  assert.equal(cellText(metric("devShare"), county("001", { totalBudget: 0 }), y), "—")
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/components/hesabu/compare-metrics.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` ... `compare-metrics`

- [ ] **Step 3: Implement**

Create `src/components/hesabu/compare-metrics.ts`:

```ts
/** County comparison: figure definitions and pure helpers (no I/O). */
import { fmtKesShort } from "./project-format"

export type ProjectCoverage = { state: "scraped" | "not-scraped" | "unavailable"; total: number; stalled: number }

export type ComparisonCounty = {
  code: string
  name: string
  totalBudget: number
  equitableShare: number
  developmentExpenditure: number
  revenueTarget: number
  revenueCollected: number
  devAbsorptionRate: number | null
  sectors: { name: string; allocated: number }[]
  projects: ProjectCoverage
}

export type Direction = "higher-better" | "neutral"
export type MetricGroup = "Budget" | "Performance" | "Sectors" | "Projects"
export type MetricUnit = "kes" | "pct" | "count"

export interface MetricDef {
  key: string
  label: string
  group: MetricGroup
  unit: MetricUnit
  direction: Direction
  value: (c: ComparisonCounty) => number | null
  note?: string
}

export interface ValueRow { code: string; value: number | null }
export interface RankedRow { code: string; value: number; rank: number }
export interface Column { code: string; name: string; county: ComparisonCounty | null }

export const DEFAULT_METRIC = "absorption"
export const MAX_COMPARE = 4
export const METRIC_GROUPS: MetricGroup[] = ["Budget", "Performance", "Sectors", "Projects"]

const EPS = 1e-9

function pctOf(part: number, whole: number): number | null {
  return whole > 0 && Number.isFinite(part) ? (part / whole) * 100 : null
}

const scraped = (pick: (p: ProjectCoverage) => number) => (c: ComparisonCounty) =>
  c.projects.state === "scraped" ? pick(c.projects) : null

const BUDGET_AND_PERFORMANCE: MetricDef[] = [
  { key: "totalBudget", label: "Total budget", group: "Budget", unit: "kes", direction: "neutral", value: (c) => c.totalBudget },
  { key: "equitableShare", label: "Equitable share (DoRA)", group: "Budget", unit: "kes", direction: "neutral", value: (c) => c.equitableShare },
  { key: "devShare", label: "Development share of budget", group: "Budget", unit: "pct", direction: "higher-better",
    value: (c) => pctOf(c.developmentExpenditure, c.totalBudget) },
  { key: "absorption", label: "Development absorption", group: "Performance", unit: "pct", direction: "higher-better",
    value: (c) => c.devAbsorptionRate },
  { key: "revenuePerformance", label: "Revenue collected vs target", group: "Performance", unit: "pct", direction: "higher-better",
    value: (c) => pctOf(c.revenueCollected, c.revenueTarget) },
]

const PROJECTS: MetricDef[] = [
  { key: "projects", label: "Documented projects", group: "Projects", unit: "count", direction: "neutral",
    value: scraped((p) => p.total), note: "From scraped public documents" },
  { key: "stalledProjects", label: "Documented stalled projects", group: "Projects", unit: "count", direction: "neutral",
    value: scraped((p) => p.stalled) },
]

/** All figures for this set of counties: one sector-share figure per sector name present */
export function buildMetrics(counties: ComparisonCounty[]): MetricDef[] {
  const names = [...new Set(counties.flatMap((c) => c.sectors.map((s) => s.name)))].sort((a, b) => a.localeCompare(b))
  const sectors: MetricDef[] = names.map((name) => ({
    key: `sector:${name}`,
    label: `${name} share of budget`,
    group: "Sectors",
    unit: "pct",
    direction: "neutral",
    value: (c) => {
      const s = c.sectors.find((x) => x.name === name)
      return s ? pctOf(s.allocated, c.totalBudget) : null
    },
  }))
  return [...BUDGET_AND_PERFORMANCE, ...sectors, ...PROJECTS]
}

export function pickMetric(metrics: MetricDef[], key: string | undefined): MetricDef {
  return metrics.find((m) => m.key === key) ?? metrics.find((m) => m.key === DEFAULT_METRIC)!
}

/** True when every county has (practically) the same value: such a figure can't be ranked */
export function isUniform(values: (number | null)[], unit: MetricUnit): boolean {
  const v = values.filter((x): x is number => x !== null)
  if (v.length < 2) return false
  const max = Math.max(...v)
  const min = Math.min(...v)
  const spread = max - min
  if (unit === "pct") return spread < 0.05
  const scale = Math.max(Math.abs(max), Math.abs(min))
  return scale === 0 || spread / scale < 0.001
}

/** Codes holding the best value; empty for neutral or uniform figures or fewer than 2 values */
export function bestOf(metric: MetricDef, rows: ValueRow[], uniform: boolean): string[] {
  if (metric.direction === "neutral" || uniform) return []
  const present = rows.filter((r): r is { code: string; value: number } => r.value !== null)
  if (present.length < 2) return []
  const best = Math.max(...present.map((r) => r.value))
  return present.filter((r) => Math.abs(r.value - best) < EPS).map((r) => r.code)
}

/** Highest first; ties share a rank (1, 2, 2, 4); null values listed as missing */
export function rankRows(rows: ValueRow[]): { ranked: RankedRow[]; missing: string[] } {
  const present = rows
    .filter((r): r is { code: string; value: number } => r.value !== null)
    .sort((a, b) => b.value - a.value)
  const ranked: RankedRow[] = []
  present.forEach((r, i) => {
    const prev = ranked[i - 1]
    const rank = prev && Math.abs(prev.value - r.value) < EPS ? prev.rank : i + 1
    ranked.push({ code: r.code, value: r.value, rank })
  })
  return { ranked, missing: rows.filter((r) => r.value === null).map((r) => r.code) }
}

export function formatValue(unit: MetricUnit, v: number | null): string {
  if (v === null) return "—"
  if (unit === "kes") return fmtKesShort(v)
  if (unit === "pct") return `${v.toFixed(1)}%`
  return v.toLocaleString("en-KE")
}

export function ordinal(n: number): string {
  const lastTwo = n % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`
}

/** Columns for the side-by-side table, in URL order; county is null when it has no data for the year */
export function selectedColumns(codes: string[], counties: ComparisonCounty[], options: { code: string; name: string }[]): Column[] {
  return codes.map((code) => {
    const county = counties.find((c) => c.code === code) ?? null
    return { code, name: county?.name ?? options.find((o) => o.code === code)?.name ?? code, county }
  })
}

export function cellText(metric: MetricDef, county: ComparisonCounty | null, year: string): string {
  if (!county) return `No data for FY ${year}`
  const v = metric.value(county)
  if (v === null && metric.group === "Projects") {
    if (county.projects.state === "not-scraped") return "Not yet scraped"
    if (county.projects.state === "unavailable") return "Unavailable"
  }
  return formatValue(metric.unit, v)
}
```

In `package.json`, insert ` src/components/hesabu/compare-metrics.test.ts` immediately after `src/components/hesabu/project-format.test.ts` in the `hesabu:test` script.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test src/components/hesabu/compare-metrics.test.ts`
Expected: `# pass 11`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add src/components/hesabu/compare-metrics.ts src/components/hesabu/compare-metrics.test.ts package.json
git commit -m "feat(hesabu): county comparison figures, ranking and uniform detection"
```

---

### Task 2: URL params (`compare-params.ts`)

**Files:**
- Create: `src/components/hesabu/compare-params.ts`
- Create: `src/components/hesabu/compare-params.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `DEFAULT_METRIC`, `MAX_COMPARE` from `./compare-metrics` (Task 1).
- Produces:
  ```ts
  export type CompareView = "side" | "rank"
  export interface CompareParams { view: CompareView; year: string; counties: string[]; metric: string }
  export type RawSearchParams = Record<string, string | string[] | undefined>
  export function parseCompareParams(raw: RawSearchParams, ctx: { years: string[]; countyCodes: string[] }): CompareParams
  export function buildCompareHref(p: CompareParams): string
  ```
- `metric` is returned as a raw string, which may be invalid. The view resolves it with `pickMetric` (Task 1) after the figures for the year are known.
- `parseCompareParams` requires `ctx.years` to be non-empty; the page checks this first.

- [ ] **Step 1: Write the failing tests**

Create `src/components/hesabu/compare-params.test.ts`:

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { parseCompareParams, buildCompareHref } from "./compare-params"

const ctx = { years: ["2025/2026", "2024/2025"], countyCodes: ["001", "008", "030", "047", "042"] }

test("defaults", () => {
  assert.deepEqual(parseCompareParams({}, ctx), { view: "side", year: "2025/2026", counties: [], metric: "absorption" })
})

test("valid params pass through", () => {
  assert.deepEqual(
    parseCompareParams({ view: "rank", year: "2024/2025", counties: "008,030", metric: "devShare" }, ctx),
    { view: "rank", year: "2024/2025", counties: ["008", "030"], metric: "devShare" },
  )
})

test("unknown view and year fall back", () => {
  const p = parseCompareParams({ view: "grid", year: "1999/2000" }, ctx)
  assert.equal(p.view, "side")
  assert.equal(p.year, "2025/2026")
})

test("counties: unknown and duplicate codes dropped, spaces trimmed, max 4", () => {
  assert.deepEqual(parseCompareParams({ counties: "008, 999,008,030,047,042,001" }, ctx).counties, ["008", "030", "047", "042"])
  assert.deepEqual(parseCompareParams({ counties: "" }, ctx).counties, [])
})

test("array-valued params use the first value", () => {
  assert.equal(parseCompareParams({ view: ["rank", "side"] }, ctx).view, "rank")
})

test("blank metric falls back to absorption; other strings are kept for pickMetric to resolve", () => {
  assert.equal(parseCompareParams({ metric: "  " }, ctx).metric, "absorption")
  assert.equal(parseCompareParams({ metric: "sector:Health Services" }, ctx).metric, "sector:Health Services")
})

test("buildCompareHref round-trips through parseCompareParams", () => {
  const p = { view: "rank" as const, year: "2024/2025", counties: ["008", "030"], metric: "sector:Health Services" }
  const href = buildCompareHref(p)
  assert.ok(href.startsWith("/hesabu/compare?"))
  const raw = Object.fromEntries(new URL(href, "http://x").searchParams)
  assert.deepEqual(parseCompareParams(raw, ctx), p)
})

test("buildCompareHref omits empty counties and the default metric", () => {
  const href = buildCompareHref({ view: "side", year: "2025/2026", counties: [], metric: "absorption" })
  const q = new URL(href, "http://x").searchParams
  assert.equal(q.has("counties"), false)
  assert.equal(q.has("metric"), false)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/components/hesabu/compare-params.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` ... `compare-params`

- [ ] **Step 3: Implement**

Create `src/components/hesabu/compare-params.ts`:

```ts
/** /hesabu/compare URL params: parse with fallbacks (never 404) and build links */
import { DEFAULT_METRIC, MAX_COMPARE } from "./compare-metrics"

export type CompareView = "side" | "rank"
export interface CompareParams { view: CompareView; year: string; counties: string[]; metric: string }
export type RawSearchParams = Record<string, string | string[] | undefined>

const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v)

export function parseCompareParams(raw: RawSearchParams, ctx: { years: string[]; countyCodes: string[] }): CompareParams {
  const view: CompareView = first(raw.view) === "rank" ? "rank" : "side"
  const yearRaw = first(raw.year)
  const year = yearRaw && ctx.years.includes(yearRaw) ? yearRaw : ctx.years[0]
  const known = new Set(ctx.countyCodes)
  const counties: string[] = []
  for (const code of (first(raw.counties) ?? "").split(",").map((c) => c.trim())) {
    if (known.has(code) && !counties.includes(code) && counties.length < MAX_COMPARE) counties.push(code)
  }
  const metric = first(raw.metric)?.trim() || DEFAULT_METRIC
  return { view, year, counties, metric }
}

export function buildCompareHref(p: CompareParams): string {
  const q = new URLSearchParams()
  q.set("view", p.view)
  q.set("year", p.year)
  if (p.counties.length > 0) q.set("counties", p.counties.join(","))
  if (p.metric !== DEFAULT_METRIC) q.set("metric", p.metric)
  return `/hesabu/compare?${q.toString()}`
}
```

In `package.json`, insert ` src/components/hesabu/compare-params.test.ts` immediately after `src/components/hesabu/compare-metrics.test.ts` in `hesabu:test`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test src/components/hesabu/compare-params.test.ts`
Expected: `# pass 8`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add src/components/hesabu/compare-params.ts src/components/hesabu/compare-params.test.ts package.json
git commit -m "feat(hesabu): compare page URL params"
```

---

### Task 3: Comparison data (`compare-data.ts` and service functions)

**Files:**
- Create: `src/components/hesabu/compare-data.ts`
- Create: `src/components/hesabu/compare-data.test.ts`
- Modify: `src/services/Hesabu.ts` (append a new section at the end of the file)
- Modify: `package.json`

**Interfaces:**
- Consumes: `ComparisonCounty`, `ProjectCoverage` (Task 1); the existing `orFallback(promise, fallback, label)` from `@/components/hesabu/project-format`; the existing `prisma` and `handleReturnError` imports in `Hesabu.ts`.
- Produces:
  ```ts
  // compare-data.ts
  export type CountyRow = { code: string; name: string; totalBudget: bigint; equitableShare: bigint;
    developmentExpenditure: bigint; revenueTarget: bigint; revenueCollected: bigint; devAbsorptionRate: number | null;
    sectors: { name: string; allocatedAmount: bigint }[] }
  export type ProjectCounts = { groups: { countyCode: string; status: string; count: number }[]; scrapedCodes: string[] }
  export function toComparisonCounties(rows: CountyRow[], projects: ProjectCounts | null): ComparisonCounty[]
  // Hesabu.ts
  export const getCountyComparison: (fiscalYear: string) => Promise<ComparisonCounty[]>
  export const getComparisonYears: () => Promise<string[]>   // newest first
  ```

- [ ] **Step 1: Write the failing tests**

Create `src/components/hesabu/compare-data.test.ts`:

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { toComparisonCounties, CountyRow } from "./compare-data"

const row = (code: string): CountyRow => ({
  code, name: `County ${code}`,
  totalBudget: 9_459_567_317n, equitableShare: 6_000_000_000n, developmentExpenditure: 3_670_966_482n,
  revenueTarget: 9_193_000_000n, revenueCollected: 8_271_000_000n, devAbsorptionRate: 64,
  sectors: [{ name: "Health Services", allocatedAmount: 2_000_000_000n }],
})

test("converts BigInt figures to numbers and keeps sectors", () => {
  const [c] = toComparisonCounties([row("030")], { groups: [], scrapedCodes: [] })
  assert.equal(c.totalBudget, 9_459_567_317)
  assert.equal(c.devAbsorptionRate, 64)
  assert.deepEqual(c.sectors, [{ name: "Health Services", allocated: 2_000_000_000 }])
})

test("project coverage: scraped, scraped-with-nothing-this-year, never scraped, unavailable", () => {
  const counts = {
    groups: [
      { countyCode: "030", status: "stalled", count: 23 },
      { countyCode: "030", status: "ongoing", count: 16 },
      { countyCode: "030", status: "unknown", count: 10 },
    ],
    scrapedCodes: ["030", "003"],
  }
  const [baringo, kilifi, nairobi] = toComparisonCounties([row("030"), row("003"), row("047")], counts)
  assert.deepEqual(baringo.projects, { state: "scraped", total: 49, stalled: 23 })
  assert.deepEqual(kilifi.projects, { state: "scraped", total: 0, stalled: 0 })
  assert.deepEqual(nairobi.projects, { state: "not-scraped", total: 0, stalled: 0 })
  const [failed] = toComparisonCounties([row("030")], null)
  assert.deepEqual(failed.projects, { state: "unavailable", total: 0, stalled: 0 })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test src/components/hesabu/compare-data.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` ... `compare-data`

- [ ] **Step 3: Implement `compare-data.ts`**

```ts
/** Database rows → ComparisonCounty (pure, so the mapping is testable without a database) */
import type { ComparisonCounty, ProjectCoverage } from "./compare-metrics"

export type CountyRow = {
  code: string
  name: string
  totalBudget: bigint
  equitableShare: bigint
  developmentExpenditure: bigint
  revenueTarget: bigint
  revenueCollected: bigint
  devAbsorptionRate: number | null
  sectors: { name: string; allocatedAmount: bigint }[]
}

/** groups: distinct projects (possible duplicates excluded) for the year, by county and status.
 *  scrapedCodes: counties with project rows in any year. null = the project queries failed. */
export type ProjectCounts = { groups: { countyCode: string; status: string; count: number }[]; scrapedCodes: string[] }

function coverageFor(code: string, projects: ProjectCounts | null): ProjectCoverage {
  if (!projects) return { state: "unavailable", total: 0, stalled: 0 }
  if (!projects.scrapedCodes.includes(code)) return { state: "not-scraped", total: 0, stalled: 0 }
  const mine = projects.groups.filter((g) => g.countyCode === code)
  return {
    state: "scraped",
    total: mine.reduce((s, g) => s + g.count, 0),
    stalled: mine.filter((g) => g.status === "stalled").reduce((s, g) => s + g.count, 0),
  }
}

export function toComparisonCounties(rows: CountyRow[], projects: ProjectCounts | null): ComparisonCounty[] {
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    totalBudget: Number(r.totalBudget),
    equitableShare: Number(r.equitableShare),
    developmentExpenditure: Number(r.developmentExpenditure),
    revenueTarget: Number(r.revenueTarget),
    revenueCollected: Number(r.revenueCollected),
    devAbsorptionRate: r.devAbsorptionRate,
    sectors: r.sectors.map((s) => ({ name: s.name, allocated: Number(s.allocatedAmount) })),
    projects: coverageFor(r.code, projects),
  }))
}
```

In `package.json`, insert ` src/components/hesabu/compare-data.test.ts` immediately after `src/components/hesabu/compare-params.test.ts` in `hesabu:test`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test src/components/hesabu/compare-data.test.ts`
Expected: `# pass 2`, `# fail 0`

- [ ] **Step 5: Add the service functions**

In `src/services/Hesabu.ts`, add these imports below the existing `import type { ProjectCardSummary } ...` line:

```ts
import { orFallback } from "@/components/hesabu/project-format"
import { toComparisonCounties, type ProjectCounts } from "@/components/hesabu/compare-data"
import type { ComparisonCounty } from "@/components/hesabu/compare-metrics"
```

Append at the end of the file:

```ts
// ─────────────────────────────────────────────────────────────────────────────
// County comparison
// ─────────────────────────────────────────────────────────────────────────────

/** Fiscal years with any county data, newest first */
export const getComparisonYears = async (): Promise<string[]> => {
  try {
    const rows = await prisma.hCounty.findMany({
      where: { isDataAvailable: true },
      distinct: ["fiscalYear"],
      orderBy: { fiscalYear: "desc" },
      select: { fiscalYear: true },
    })
    return rows.map((r) => r.fiscalYear)
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

async function loadProjectCounts(fiscalYear: string): Promise<ProjectCounts> {
  const [groups, scraped] = await Promise.all([
    prisma.hProject.groupBy({
      by: ["countyCode", "status"],
      where: { fiscalYear, possibleDuplicateOf: null },
      _count: { _all: true },
    }),
    prisma.hProject.groupBy({ by: ["countyCode"], _count: { _all: true } }),
  ])
  return {
    groups: groups.map((g) => ({ countyCode: g.countyCode, status: g.status, count: g._count._all })),
    scrapedCodes: scraped.map((s) => s.countyCode),
  }
}

/** Every county with data for the year, with project coverage; project failures degrade to "unavailable" */
export const getCountyComparison = async (fiscalYear: string): Promise<ComparisonCounty[]> => {
  if (typeof fiscalYear !== "string") throw new Error("Invalid parameters.")
  try {
    const [rows, projects] = await Promise.all([
      prisma.hCounty.findMany({
        where: { fiscalYear, isDataAvailable: true },
        orderBy: { name: "asc" },
        select: {
          code: true, name: true, totalBudget: true, equitableShare: true, developmentExpenditure: true,
          revenueTarget: true, revenueCollected: true, devAbsorptionRate: true,
          sectors: { select: { name: true, allocatedAmount: true } },
        },
      }),
      orFallback<ProjectCounts | null>(loadProjectCounts(fiscalYear), null, "comparison project counts"),
    ])
    return toComparisonCounties(rows, projects)
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
```

- [ ] **Step 6: Type-check and run the whole suite**

Run: `npx tsc --noEmit -p . 2>&1 | grep -c "error TS"`
Expected: `0`

Run: `npm run hesabu:test 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# pass 73`, `# fail 0` (52 existing + 11 + 8 + 2)

- [ ] **Step 7: Commit**

```bash
git add src/components/hesabu/compare-data.ts src/components/hesabu/compare-data.test.ts src/services/Hesabu.ts package.json
git commit -m "feat(hesabu): county comparison data service"
```

---

### Task 4: Compare page UI

**Files:**
- Create: `src/components/hesabu/CompareControls.tsx`
- Create: `src/components/hesabu/CompareTable.tsx`
- Create: `src/components/hesabu/CompareRanking.tsx`
- Create: `src/components/hesabu/CompareView.tsx`
- Create: `src/app/(frontend)/hesabu/compare/page.tsx`

**Interfaces:**
- Consumes: everything Task 1 produces; `CompareParams`, `buildCompareHref`, `parseCompareParams`, `RawSearchParams` (Task 2); `getCountyComparison`, `getComparisonYears` (Task 3); the existing `getUniqueCounties(): Promise<CountyOption[]>` and `CountyOption = { code: string; name: string }` from `@/services/Hesabu`.
- Produces: the route `/hesabu/compare`. The `MetricDef` objects contain functions, so they are built **inside** client components and never passed from the server page.

- [ ] **Step 1: `CompareControls.tsx`**

```tsx
"use client"

import { useRouter } from "next/navigation"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { MAX_COMPARE } from "./compare-metrics"
import { buildCompareHref, type CompareParams } from "./compare-params"

type Props = {
  params: CompareParams
  years: string[]
  countyOptions: { code: string; name: string }[]
  metricOptions: { key: string; label: string }[]
}

const selectStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600,
  padding: "6px 10px", background: "white", color: "#0f172a", maxWidth: "100%",
}

const toggleStyle = (active: boolean): React.CSSProperties => ({
  border: "1px solid", borderColor: active ? "#0e7490" : "#cbd5e1", borderRadius: 8,
  background: active ? "#0e7490" : "white", color: active ? "white" : "#0f172a",
  fontSize: 13, fontWeight: 600, padding: "6px 12px", cursor: "pointer",
})

export function CompareControls({ params, years, countyOptions, metricOptions }: Props) {
  const router = useRouter()
  const go = (changes: Partial<CompareParams>) =>
    router.replace(buildCompareHref({ ...params, ...changes }), { scroll: false })
  const nameOf = (code: string) => countyOptions.find((o) => o.code === code)?.name ?? code
  const full = params.counties.length >= MAX_COMPARE
  const addable = countyOptions.filter((o) => !params.counties.includes(o.code))

  return (
    <VStack align="stretch" gap={3} bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={4}>
      <HStack gap={2} flexWrap="wrap">
        {(["side", "rank"] as const).map((v) => (
          <button key={v} type="button" aria-pressed={params.view === v} onClick={() => go({ view: v })} style={toggleStyle(params.view === v)}>
            {v === "side" ? "Side by side" : "Ranking"}
          </button>
        ))}
        <select aria-label="Fiscal year" value={params.year} onChange={(e) => go({ year: e.target.value })} style={selectStyle}>
          {years.map((y) => <option key={y} value={y}>FY {y}</option>)}
        </select>
        {params.view === "rank" && (
          <select aria-label="Figure to rank by" value={params.metric} onChange={(e) => go({ metric: e.target.value })} style={selectStyle}>
            {metricOptions.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        )}
      </HStack>
      <HStack gap={2} flexWrap="wrap">
        <Text fontSize="sm" color="gray.600">{params.view === "rank" ? "Highlight:" : "Counties:"}</Text>
        {params.counties.map((code) => (
          <HStack key={code} gap={1} bg="cyan.50" border="1px solid" borderColor="cyan.200" borderRadius="full" pl={3} pr={1} py={0.5}>
            <Text fontSize="sm" fontWeight="600" color="cyan.900">{nameOf(code)}</Text>
            <Box as="button" aria-label={`Remove ${nameOf(code)}`} onClick={() => go({ counties: params.counties.filter((c) => c !== code) })}
              px={1.5} borderRadius="full" color="cyan.900" cursor="pointer" _hover={{ bg: "cyan.100" }}>
              ×
            </Box>
          </HStack>
        ))}
        <select aria-label="Add county" value="" disabled={full} style={selectStyle}
          onChange={(e) => e.target.value && go({ counties: [...params.counties, e.target.value] })}>
          <option value="">{full ? `Up to ${MAX_COMPARE} counties` : "+ Add county"}</option>
          {addable.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
        </select>
      </HStack>
    </VStack>
  )
}
```

- [ ] **Step 2: `CompareTable.tsx`**

```tsx
"use client"

import { Fragment } from "react"
import Link from "next/link"
import { Badge, Box, Text } from "@chakra-ui/react"
import {
  METRIC_GROUPS, MAX_COMPARE, bestOf, cellText, isUniform,
  type Column, type ComparisonCounty, type MetricDef,
} from "./compare-metrics"

type Props = { metrics: MetricDef[]; columns: Column[]; allCounties: ComparisonCounty[]; year: string }

const stickyCell = { position: "sticky" as const, left: 0, bg: "white", zIndex: 1 }

export function CompareTable({ metrics, columns, allCounties, year }: Props) {
  if (columns.length === 0) {
    return (
      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={6}>
        <Text color="gray.600">Pick up to {MAX_COMPARE} counties above to compare them side by side.</Text>
      </Box>
    )
  }
  const remaining = MAX_COMPARE - columns.length
  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" overflow="hidden">
      <Box overflowX="auto">
        <Box as="table" w="100%" fontSize="sm" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 200 + columns.length * 150 }}>
          <thead>
            <tr>
              <Box as="th" {...stickyCell} textAlign="left" p={3} borderBottom="1px solid" borderColor="gray.200" minW="200px" />
              {columns.map((c) => (
                <Box as="th" key={c.code} textAlign="right" p={3} borderBottom="1px solid" borderColor="gray.200" minW="150px">
                  <Link href={`/hesabu?county=${c.code}&year=${encodeURIComponent(year)}`} style={{ color: "#0e7490", fontWeight: 700 }}>
                    {c.name}
                  </Link>
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_GROUPS.map((group) => {
              const rows = metrics.filter((m) => m.group === group)
              if (rows.length === 0) return null
              return (
                <Fragment key={group}>
                  <tr>
                    <Box as="td" colSpan={columns.length + 1} bg="gray.50" px={3} py={2} fontSize="xs" fontWeight="700"
                      textTransform="uppercase" letterSpacing="wider" color="gray.600">
                      {group}
                    </Box>
                  </tr>
                  {rows.map((m) => {
                    const uniform = isUniform(allCounties.map((c) => m.value(c)), m.unit)
                    const best = bestOf(m, columns.map((c) => ({ code: c.code, value: c.county ? m.value(c.county) : null })), uniform)
                    return (
                      <tr key={m.key}>
                        <Box as="th" {...stickyCell} textAlign="left" fontWeight="500" px={3} py={2} borderBottom="1px solid" borderColor="gray.100">
                          {m.label}
                          {uniform && <Text fontSize="2xs" color="orange.700">same for all counties</Text>}
                          {m.note && <Text fontSize="2xs" color="gray.500">{m.note}</Text>}
                        </Box>
                        {columns.map((c) => {
                          const isBest = best.includes(c.code)
                          return (
                            <Box as="td" key={c.code} textAlign="right" px={3} py={2} borderBottom="1px solid" borderColor="gray.100"
                              fontWeight={isBest ? "700" : "400"} color={c.county ? "inherit" : "gray.500"} whiteSpace="nowrap">
                              {cellText(m, c.county, year)}
                              {isBest && <Badge ml={2} colorPalette="green" size="xs">Highest</Badge>}
                            </Box>
                          )
                        })}
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
        </Box>
      </Box>
      {columns.length < 2 && (
        <Text px={3} py={3} fontSize="sm" color="gray.600" borderTop="1px solid" borderColor="gray.100">
          Add up to {remaining} more {remaining === 1 ? "county" : "counties"} to compare.
        </Text>
      )}
    </Box>
  )
}
```

- [ ] **Step 3: `CompareRanking.tsx`**

```tsx
"use client"

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Box, Text, VStack } from "@chakra-ui/react"
import { formatValue, isUniform, ordinal, rankRows, type ComparisonCounty, type MetricDef } from "./compare-metrics"

type Props = { metric: MetricDef; counties: ComparisonCounty[]; highlighted: string[]; year: string }

export function CompareRanking({ metric, counties, highlighted, year }: Props) {
  const rows = counties.map((c) => ({ code: c.code, value: metric.value(c) }))
  const nameOf = (code: string) => counties.find((c) => c.code === code)?.name ?? code
  const n = counties.length
  const uniform = isUniform(rows.map((r) => r.value), metric.unit)
  const { ranked, missing } = rankRows(rows)
  const data = ranked.map((r) => ({ ...r, label: `${r.rank}. ${nameOf(r.code)}`, highlighted: highlighted.includes(r.code) }))

  return (
    <VStack align="stretch" gap={3} bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={4}>
      <Text fontWeight="700">{metric.label}</Text>
      <Text fontSize="sm" color="gray.600">Ranked among the {n} counties with data for FY {year}</Text>
      {highlighted.length > 0 && !uniform && (
        <VStack align="start" gap={0}>
          {highlighted.map((code) => {
            const r = ranked.find((x) => x.code === code)
            return (
              <Text key={code} fontSize="sm" fontWeight="600" color="cyan.800">
                {nameOf(code)}: {r ? `${ordinal(r.rank)} of ${n}` : "no data"}
              </Text>
            )
          })}
        </VStack>
      )}
      {uniform ? (
        <Box bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="md" p={4}>
          <Text fontSize="sm" color="orange.900">
            All {ranked.length} counties have the same value ({formatValue(metric.unit, ranked[0]?.value ?? null)}). In our data this
            figure is an estimate, so it can&apos;t be ranked yet.
          </Text>
        </Box>
      ) : (
        <Box w="100%" h={`${Math.max(160, data.length * 34 + 30)}px`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 8 }}>
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatValue(metric.unit, Number(v))} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {data.map((d) => <Cell key={d.code} fill={d.highlighted ? "#0e7490" : "#cbd5e1"} />)}
                <LabelList dataKey="value" position="right" formatter={(v) => formatValue(metric.unit, Number(v))} style={{ fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
      {missing.length > 0 && (
        <Text fontSize="sm" color="gray.600">No data: {missing.map(nameOf).join(", ")}</Text>
      )}
    </VStack>
  )
}
```

- [ ] **Step 4: `CompareView.tsx`**

```tsx
"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Box, Text, VStack } from "@chakra-ui/react"
import { buildMetrics, pickMetric, selectedColumns, type ComparisonCounty } from "./compare-metrics"
import type { CompareParams } from "./compare-params"
import { CompareControls } from "./CompareControls"
import { CompareTable } from "./CompareTable"
import { CompareRanking } from "./CompareRanking"

const DATA_NOTE =
  "County figures are compiled estimates from budget documents and the Division of Revenue Act, not audited actuals. " +
  "Figures marked 'same for all counties' cannot be compared yet. Project counts cover only counties whose public documents have been scraped."

type Props = {
  params: CompareParams
  years: string[]
  countyOptions: { code: string; name: string }[]
  counties: ComparisonCounty[]
}

export function CompareView({ params, years, countyOptions, counties }: Props) {
  const metrics = useMemo(() => buildMetrics(counties), [counties])
  const metric = pickMetric(metrics, params.metric)
  const effective: CompareParams = { ...params, metric: metric.key }
  const back = params.counties[0]
    ? `/hesabu?county=${params.counties[0]}&year=${encodeURIComponent(params.year)}`
    : "/hesabu"

  return (
    <Box bg="#f8fafc" minH="100vh" color="#0f172a">
      <Box bg="linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #155e75 100%)" px={{ base: 4, md: 8 }} py={6}>
        <Box maxW="1200px" mx="auto">
          <Link href={back} style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>← Back to county dashboard</Link>
          <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color="white" mt={2}>Compare counties</Text>
          <Text fontSize="xs" color="rgba(255,255,255,0.6)" textTransform="uppercase" letterSpacing="widest">
            {counties.length} counties with data for FY {params.year}
          </Text>
        </Box>
      </Box>
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={6}>
        <VStack align="stretch" gap={5}>
          <CompareControls params={effective} years={years} countyOptions={countyOptions}
            metricOptions={metrics.map((m) => ({ key: m.key, label: m.label }))} />
          {params.view === "side" ? (
            <CompareTable metrics={metrics} columns={selectedColumns(params.counties, counties, countyOptions)}
              allCounties={counties} year={params.year} />
          ) : (
            <CompareRanking metric={metric} counties={counties} highlighted={params.counties} year={params.year} />
          )}
          <Text fontSize="xs" color="gray.500">{DATA_NOTE}</Text>
        </VStack>
      </Box>
    </Box>
  )
}
```

- [ ] **Step 5: The page, `src/app/(frontend)/hesabu/compare/page.tsx`**

```tsx
import { Box, Text } from "@chakra-ui/react"
import { getComparisonYears, getCountyComparison, getUniqueCounties } from "@/services/Hesabu"
import { CompareView } from "@/components/hesabu/CompareView"
import { parseCompareParams, type RawSearchParams } from "@/components/hesabu/compare-params"

export const metadata = {
  title: "Compare counties — Hesabu",
  description: "Compare Kenya counties side by side or ranked on budget and delivery figures.",
}

type Props = { searchParams: Promise<RawSearchParams> }

export default async function ComparePage({ searchParams }: Props) {
  const raw = await searchParams
  const [years, countyOptions] = await Promise.all([getComparisonYears(), getUniqueCounties()])

  if (years.length === 0) {
    return (
      <Box p={8}>
        <Text fontWeight="700">No county data yet</Text>
      </Box>
    )
  }

  const params = parseCompareParams(raw, { years, countyCodes: countyOptions.map((c) => c.code) })
  const counties = await getCountyComparison(params.year)

  return <CompareView params={params} years={years} countyOptions={countyOptions} counties={counties} />
}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit -p . 2>&1 | grep "error TS" | head`
Expected: no output. If recharts 3 rejects the `formatter` signatures, adjust only the parameter annotation (for example `(v: unknown) => ...`) and keep the `Number(v)` conversion. Record the change as a ruling.

- [ ] **Step 7: Smoke-check the route**

Make sure this project's dev server is running on port 3100 (`npx next dev --turbopack -p 3100`). Port 3000 is a different project.

Run: `curl -s -o /tmp/cmp.html -w "%{http_code}\n" "http://localhost:3100/hesabu/compare?view=side&counties=008,030,047&year=2025/2026" && grep -o "Compare counties\|Highest\|same for all counties\|Not yet scraped" /tmp/cmp.html | sort | uniq -c`
Expected: `200`, and the output includes `Compare counties`, `Highest`, `same for all counties` and `Not yet scraped` (each count ≥ 1).

Run: `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3100/hesabu/compare?view=bogus&counties=zzz&year=1900/1901&metric=nope"`
Expected: `200`

- [ ] **Step 8: Commit**

```bash
git add src/components/hesabu/CompareControls.tsx src/components/hesabu/CompareTable.tsx src/components/hesabu/CompareRanking.tsx src/components/hesabu/CompareView.tsx "src/app/(frontend)/hesabu/compare/page.tsx"
git commit -m "feat(hesabu): county comparison page (side by side and ranking)"
```

---

### Task 5: Dashboard Compare button and browser check

**Files:**
- Modify: `src/components/hesabu/Dashboard.tsx` (imports at the top; the header `HStack` that holds `CountySelector` and `YearSelector`, currently around lines 112–122)

**Interfaces:**
- Consumes: `buildCompareHref` (Task 2), `DEFAULT_METRIC` (Task 1); the existing Dashboard props `currentCountyCode: string` and `currentYear: string`.

- [ ] **Step 1: Add the button**

Add these imports to `Dashboard.tsx`:

```tsx
import Link from "next/link"
import { buildCompareHref } from "@/components/hesabu/compare-params"
import { DEFAULT_METRIC } from "@/components/hesabu/compare-metrics"
```

In the header `HStack gap={2} flexWrap="wrap"` that contains `<CountySelector ... />` and `<YearSelector ... />`, add this after `<YearSelector ... />`:

```tsx
<Link
  href={buildCompareHref({ view: "side", year: currentYear, counties: [currentCountyCode], metric: DEFAULT_METRIC })}
  style={{
    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8,
    color: "white", fontSize: 13, fontWeight: 600, padding: "6px 12px", whiteSpace: "nowrap",
  }}
>
  ⇄ Compare counties
</Link>
```

- [ ] **Step 2: Type-check and run the full suite**

Run: `npx tsc --noEmit -p . 2>&1 | grep -c "error TS"`
Expected: `0`

Run: `npm run hesabu:test 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# pass 73`, `# fail 0`

- [ ] **Step 3: Browser check**

playwright-core is installed at `/private/tmp/claude-501/-Users-ken-Sites-Javascript-ReactJs-sam-forms/1f1cd11c-cae0-4a8e-ae54-2392c3d996cc/scratchpad/pw`. If the scratchpad has been cleared, reinstall it there with `npm i playwright-core@1.56.1`. Create `compare-check.mjs` in that directory:

```js
import { chromium } from "playwright-core"
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const base = "http://localhost:3100"
const b = await chromium.launch({ executablePath: exe })
const p = await b.newPage({ viewport: { width: 1280, height: 900 } })

await p.goto(`${base}/hesabu?county=008`, { waitUntil: "networkidle" })
await p.getByRole("link", { name: /Compare counties/ }).click()
await p.waitForURL(/\/hesabu\/compare/)
console.log("button →", p.url())

await p.goto(`${base}/hesabu/compare?view=side&counties=008,030,047&year=2025/2026`, { waitUntil: "networkidle" })
console.log("Highest badges:", await p.getByText("Highest", { exact: true }).count())
console.log("same-for-all notes:", await p.getByText("same for all counties").count())
console.log("Not yet scraped:", await p.getByText("Not yet scraped").count())
await p.screenshot({ path: "compare-side.png", fullPage: true })

await p.goto(`${base}/hesabu/compare?view=rank&metric=absorption&counties=008&year=2025/2026`, { waitUntil: "networkidle" })
console.log("rank line:", await p.getByText(/^Wajir: /).textContent())
await p.screenshot({ path: "compare-rank.png", fullPage: true })

await p.goto(`${base}/hesabu/compare?view=rank&metric=revenuePerformance&year=2025/2026`, { waitUntil: "networkidle" })
console.log("uniform notice:", await p.getByText(/can't be ranked yet/).count())

await p.setViewportSize({ width: 375, height: 800 })
await p.goto(`${base}/hesabu/compare?view=side&counties=008,030,047&year=2025/2026`, { waitUntil: "networkidle" })
console.log("page scrollWidth at 375:", await p.evaluate(() => document.documentElement.scrollWidth))
await p.screenshot({ path: "compare-mobile.png", fullPage: true })
await b.close()
```

Run: `cd /private/tmp/claude-501/-Users-ken-Sites-Javascript-ReactJs-sam-forms/1f1cd11c-cae0-4a8e-ae54-2392c3d996cc/scratchpad/pw && node compare-check.mjs`

Expected, given the 2025/26 data on 2026-11-19:
- `button →` URL contains `/hesabu/compare?view=side&year=2025%2F2026&counties=008`
- `Highest badges: 3` (Baringo on development share; Baringo and Nairobi tied at 64% on absorption; nothing on revenue, which is uniform)
- `same-for-all notes:` ≥ 1
- `Not yet scraped: 2` (Nairobi on both project rows)
- `rank line: Wajir: 12th of 13`
- `uniform notice: 1`
- `page scrollWidth at 375: 375`

Look at the three screenshots, `compare-side.png`, `compare-rank.png` and `compare-mobile.png` (Read tool). Check that the sticky first column, the bar highlighting and the chips render sensibly. If the data changed after 2026-11-19 (for example after a reload), the counts can differ. Verify against the data and record the difference as a ruling; don't change the code to match these numbers.

- [ ] **Step 4: Commit**

```bash
git add src/components/hesabu/Dashboard.tsx
git commit -m "feat(hesabu): Compare counties button on the dashboard"
```

---

## Self-review notes

**Spec coverage**

| Spec section | Where it's built |
|---|---|
| §1 route and params | Task 2, Task 4 Step 5 |
| §2 figures, helpers and the uniform rule | Task 1, and the Task 4 table and ranking |
| §3 data | Task 3 |
| §4 controls | Task 4 Step 1 |
| §4 table | Task 4 Step 2 |
| §4 ranking | Task 4 Step 3 |
| §4 data note and header | Task 4 Step 4 |
| §4 Compare button | Task 5 |
| §4 metadata | Task 4 Step 5 |
| §5 empty state | Task 4 Step 5 |
| §5 project failure | Task 3 (`orFallback` → `unavailable`) |
| §5 bad params | Task 2, plus `pickMetric` in Task 1 |
| Testing section | Tasks 1–3 tests; Task 4 Step 7 and Task 5 Step 3 checks |

**Ruling carried in the plan:** `ProjectCoverage.state` replaces the spec's `scraped: boolean` (Task 1 Interfaces).
