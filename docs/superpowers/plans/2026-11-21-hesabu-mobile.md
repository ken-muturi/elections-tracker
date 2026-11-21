# Hesabu Mobile Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/hesabu` (all tabs, project drawer, report form) and `/hesabu/compare` fully usable at a 390px-wide phone viewport, without changing the desktop look.

**Architecture:** Responsive Chakra props (`{ base: …, md: … }`) on existing components; one new pure function `compareRows` in `compare-metrics.ts` feeds both the desktop table and a new stacked phone layout in `CompareTable`. A Playwright check script in the scratchpad is the failing test for every UI task: it prints PASS/FAIL per check per page.

**Tech Stack:** Next.js 15 App Router, React 19, Chakra UI v3 (`chakra.*` factory, `asChild`), recharts 3, `node:test` via `tsx`, playwright-core with the cached Chromium.

**Spec:** `docs/superpowers/specs/2026-11-21-hesabu-mobile-design.md`

## Global Constraints

- "Phone" means below Chakra's `md` breakpoint (768px); phone-only changes use `{ base: …, md: … }` so desktop is untouched.
- Exceptions that apply at every width: content wrapper `w="100%" maxW="8xl"`; Cancel button colour `gray.600` and button padding; `compareRows` refactor (no visual change on desktop).
- Phone tap targets: every button, link, select and input inside Hesabu content is at least 40px tall.
- Phone text: no visible text under 11px inside Hesabu content.
- Out of scope: `AuditSection`/`AuditFindings` (not on `main`), the shared `PublicTopNav`, new features, the dev hydration warning.
- Dev server: `http://localhost:3100` (already running as a background task; port 3000 is another project). If it serves stale code after many edits, restart it with `rm -rf .next && npx next dev --turbopack -p 3100`.
- Tests: `npm run hesabu:test` (node:test). Type check: `npx tsc --noEmit`.
- Browser checker lives at `$PW/mobile-check.mjs`, where
  `PW=/private/tmp/claude-501/-Users-ken-Sites-Javascript-ReactJs-sam-forms/1f1cd11c-cae0-4a8e-ae54-2392c3d996cc/scratchpad/pw`
  (playwright-core is already installed there). It is not committed.

## Review Focus

1. A county with citizen reports (Mombasa has none): report cards and their vote column must not clip at 390px — the checker only sees the empty state; review `ReportCard` for fixed widths.
2. Long county names in the 4-column phone compare layout ("Nairobi City", "Tana River" today; "Elgeyo-Marakwet" once more counties load): must wrap inside their column, never push the grid wider than the screen (`minW={0}` + `overflowWrap="anywhere"` on every grid child).
3. Compare page with 1 county: the stacked layout with a single full-width column must still read correctly, and the "Add up to N more counties" line must show.
4. Project drawer with many sources: wrapped 40px source links must not overflow the drawer width.
5. Landscape phones / small tablets (768–1024px) get the desktop layout: the desktop compare table must still scroll inside its card, and the dashboard must not clip at 800px.

Items 2 and 3 are pinned by checker pages `compare-side-long` and `compare-side-1` (Task 1); item 5 by the `--width=800` run in Task 6. Items 1 and 4 are read by the final reviewer.

---

### Task 1: Browser checker and test hooks

**Files:**
- Create: `$PW/mobile-check.mjs` (scratchpad, not committed)
- Modify: `src/components/hesabu/Dashboard.tsx` (root `Box` at line 67; tab `Box` in the tab bar)
- Modify: `src/components/hesabu/CompareView.tsx` (root `Box`)

**Interfaces:**
- Produces: DOM hooks `data-hesabu-root` on the Dashboard and CompareView root boxes; `data-tab="budget" | "wards" | "reports"` on each tab button. Task 5 adds `data-compare-col` / `data-compare-cell`; the checker already looks for them.
- Produces: `node $PW/mobile-check.mjs [--only=<page>] [--width=<px>] [--shots=<tag>]` printing lines `PASS|FAIL <check> <page> <details>` and a final `SUMMARY <n> fail`.

- [ ] **Step 1: Add the test hooks**

In `Dashboard.tsx`, the root:

```tsx
    <Box bg="#f8fafc" minH="100vh" color="#0f172a" data-hesabu-root="">
```

and on the tab button `Box` (inside `tabs.map`), add the attribute after `key={tab.id}`:

```tsx
                  data-tab={tab.id}
```

In `CompareView.tsx`, the root:

```tsx
    <Box bg="#f8fafc" minH="100vh" color="#0f172a" data-hesabu-root="">
```

- [ ] **Step 2: Write the checker**

`$PW/mobile-check.mjs`:

```js
import { chromium } from "playwright-core"
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const base = "http://localhost:3100"
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1]
const only = arg("only"), shots = arg("shots"), width = Number(arg("width") ?? 390)
const phone = width < 768

const b = await chromium.launch({ executablePath: exe })
const p = await b.newPage({ viewport: { width, height: phone ? 844 : 900 }, isMobile: phone, hasTouch: phone })
let fails = 0
const out = (ok, check, page, detail = "") => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"} ${check} ${page} ${detail}`) }

// Runs in the page: collects problems inside Hesabu content (root + open drawer).
const inspect = () => {
  const vw = document.documentElement.clientWidth
  const scopes = [...document.querySelectorAll("[data-hesabu-root], [data-scope=drawer][data-part=content]")]
  const inScope = (el) => scopes.some((s) => s.contains(el))
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" }
  const inScroller = (el) => { for (let a = el.parentElement; a && inScope(a); a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === "auto" || o === "scroll") return true } return false }
  const label = (el) => `${el.tagName.toLowerCase()} "${(el.innerText || el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 30)}"`
  const all = [...document.querySelectorAll("body *")].filter((el) => inScope(el) && visible(el))

  const clipped = all.filter((el) => el.getBoundingClientRect().right > vw + 1 && !inScroller(el))
    .filter((el) => !(el.parentElement && clipped0(el.parentElement)))
  function clipped0(el) { return el.getBoundingClientRect().right > vw + 1 && inScope(el) && !inScroller(el) }

  const targets = all.filter((el) => el.matches("a, button, select, input, textarea, [role=button]"))
    .filter((el) => el.getBoundingClientRect().height < 40)
    .map((el) => `${Math.round(el.getBoundingClientRect().height)}px ${label(el)}`)

  const small = all.filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 11)
    .map((el) => `${getComputedStyle(el).fontSize} ${label(el)}`)

  const tabs = [...document.querySelectorAll("[data-tab]")].map((el) => { const r = el.getBoundingClientRect(); return { id: el.dataset.tab, ok: r.left >= 0 && r.right <= vw } })
  const cols = [...document.querySelectorAll("[data-compare-col], [data-compare-cell]")].filter(visible)
  const colsOut = cols.filter((el) => { const r = el.getBoundingClientRect(); return r.left < 0 || r.right > vw + 1 }).map(label)
  const table = [...document.querySelectorAll("[data-hesabu-root] table")].some(visible)
  return { clipped: clipped.map(label), targets: [...new Set(targets)], small: [...new Set(small)], tabs, cols: cols.length, colsOut, table }
}

async function check(name, { tabs = false, side = 0 } = {}) {
  const r = await p.evaluate(inspect)
  out(r.clipped.length === 0, "clip", name, r.clipped.slice(0, 6).join(" | "))
  if (phone) {
    out(r.targets.length === 0, "targets", name, r.targets.slice(0, 8).join(" | "))
    out(r.small.length === 0, "text", name, r.small.slice(0, 8).join(" | "))
    if (tabs) out(r.tabs.length === 3 && r.tabs.every((t) => t.ok), "tabs", name, JSON.stringify(r.tabs))
    if (side) out(r.cols >= side * 2 && r.colsOut.length === 0, "side", name, `cells=${r.cols} out=${r.colsOut.slice(0, 4).join(" | ")}`)
  } else if (side) {
    out(r.table, "desktop-table", name)
  }
  if (shots) await p.screenshot({ path: `${shots}-${name}.png`, fullPage: true })
}

const go = (u) => p.goto(base + u, { waitUntil: "networkidle" })
const pages = {
  "dash-overview": async () => { await go("/hesabu?county=001"); await check("dash-overview", { tabs: true }) },
  "dash-wards": async () => { await go("/hesabu?county=001"); await p.click("[data-tab=wards]"); await p.waitForTimeout(500); await check("dash-wards", { tabs: true }) },
  "dash-reports": async () => {
    await go("/hesabu?county=001"); await p.click("[data-tab=reports]"); await p.waitForTimeout(500)
    await p.locator("button").filter({ hasText: /Flag a Gap/ }).click(); await p.waitForTimeout(500)
    await check("dash-reports", { tabs: true })
  },
  "dash-drawer": async () => {
    await go("/hesabu?county=001")
    await p.locator("button").filter({ hasText: /documented project/ }).first().click()
    await p.waitForSelector("[data-scope=drawer][data-part=content]"); await p.waitForTimeout(1200)
    await check("dash-drawer")
  },
  "compare-side-1": async () => { await go("/hesabu/compare?counties=001"); await check("compare-side-1", { side: 1 }) },
  "compare-side-3": async () => { await go("/hesabu/compare?counties=001,008,047"); await check("compare-side-3", { side: 3 }) },
  "compare-side-long": async () => { await go("/hesabu/compare?counties=047,004,037,016"); await check("compare-side-long", { side: 4 }) },
  "compare-rank": async () => { await go("/hesabu/compare?view=rank&counties=001"); await check("compare-rank") },
}
for (const [name, run] of Object.entries(pages)) if (!only || only === name) await run()
console.log(`SUMMARY ${fails} fail (width ${width})`)
await b.close()
```

(County codes: 047 Nairobi City, 004 Tana River, 037 Kakamega, 016 Machakos — the four longest names among counties with data, for Review Focus item 2.)

- [ ] **Step 3: Run it against the current code (RED baseline)**

Run: `cd $PW && node mobile-check.mjs --shots=before`
Expected: FAIL lines including `clip dash-overview` (the 1440px wrapper), `tabs dash-*`, `targets` and `text` on several pages, and `side compare-side-*` with `cells=0` (no stacked layout yet). `SUMMARY` > 10 fail. Record the count in the ledger.

- [ ] **Step 4: Commit the hooks**

```bash
git add src/components/hesabu/Dashboard.tsx src/components/hesabu/CompareView.tsx
git commit -m "test(hesabu): DOM hooks for the mobile browser check

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `compareRows` and desktop table refactor

**Files:**
- Modify: `src/components/hesabu/compare-metrics.ts` (append after `cellText`, line ~153)
- Modify: `src/components/hesabu/compare-metrics.test.ts` (append; extend the import)
- Modify: `src/components/hesabu/CompareTable.tsx` (tbody)

**Interfaces:**
- Consumes: `METRIC_GROUPS`, `isUniform`, `bestOf`, `cellText`, `MetricDef`, `Column`, `ComparisonCounty`, `MetricGroup` (all existing in `compare-metrics.ts`).
- Produces:
  ```ts
  export type CompareCell = { code: string; text: string; isBest: boolean; missing: boolean }
  export type CompareRow = { key: string; label: string; note?: string; uniform: boolean; cells: CompareCell[] }
  export type CompareGroup = { group: MetricGroup; rows: CompareRow[] }
  export function compareRows(metrics: MetricDef[], columns: Column[], allCounties: ComparisonCounty[], year: string): CompareGroup[]
  ```

- [ ] **Step 1: Write the failing tests**

Extend the import in `compare-metrics.test.ts` with `compareRows, type Column`, then append:

```ts
const col = (c: ComparisonCounty | null, code = c?.code ?? "099"): Column => ({ code, name: c?.name ?? "Missing", county: c })

test("compareRows: groups follow METRIC_GROUPS order and empty groups are left out", () => {
  const cs = [county("001"), county("002")]
  const ms = buildMetrics(cs).filter((m) => m.group === "Projects" || m.group === "Budget")
  const groups = compareRows(ms, cs.map((c) => col(c)), cs, "2025/2026")
  assert.deepEqual(groups.map((g) => g.group), ["Budget", "Projects"])
  assert.deepEqual(groups[0].rows.map((r) => r.key), ["totalBudget", "equitableShare", "devShare"])
})

test("compareRows: flags the best cell", () => {
  const cs = [county("001", { devAbsorptionRate: 60 }), county("002", { devAbsorptionRate: 80 })]
  const row = compareRows(buildMetrics(cs), cs.map((c) => col(c)), cs, "2025/2026")
    .flatMap((g) => g.rows).find((r) => r.key === "absorption")!
  assert.deepEqual(row.cells.map((c) => [c.code, c.isBest]), [["001", false], ["002", true]])
  assert.equal(row.cells[1].text, "80.0%")
})

test("compareRows: a uniform figure flags no best cell", () => {
  const cs = [county("001"), county("002")]
  const row = compareRows(buildMetrics(cs), cs.map((c) => col(c)), cs, "2025/2026")
    .flatMap((g) => g.rows).find((r) => r.key === "revenuePerformance")!
  assert.equal(row.uniform, true)
  assert.ok(row.cells.every((c) => !c.isBest))
})

test("compareRows: a column with no county data is missing with the year in its text", () => {
  const cs = [county("001")]
  const row = compareRows(buildMetrics(cs), [col(cs[0]), col(null, "099")], cs, "2025/2026")[0].rows[0]
  assert.deepEqual(row.cells[1], { code: "099", text: "No data for FY 2025/2026", isBest: false, missing: true })
})

test("compareRows: a county never scraped says so on project figures", () => {
  const cs = [county("001", { projects: { state: "not-scraped", total: 0, stalled: 0 } })]
  const row = compareRows(buildMetrics(cs), [col(cs[0])], cs, "2025/2026")
    .flatMap((g) => g.rows).find((r) => r.key === "projects")!
  assert.equal(row.cells[0].text, "Not yet scraped")
  assert.equal(row.cells[0].missing, false)
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx tsx --test src/components/hesabu/compare-metrics.test.ts`
Expected: FAIL — `compareRows` is not exported (SyntaxError / "does not provide an export named 'compareRows'").

- [ ] **Step 3: Implement**

Append to `compare-metrics.ts`:

```ts
export type CompareCell = { code: string; text: string; isBest: boolean; missing: boolean }
export type CompareRow = { key: string; label: string; note?: string; uniform: boolean; cells: CompareCell[] }
export type CompareGroup = { group: MetricGroup; rows: CompareRow[] }

/** Side-by-side rows for the selected columns, grouped in METRIC_GROUPS order (empty groups omitted). */
export function compareRows(metrics: MetricDef[], columns: Column[], allCounties: ComparisonCounty[], year: string): CompareGroup[] {
  return METRIC_GROUPS.map((group) => ({
    group,
    rows: metrics.filter((m) => m.group === group).map((m) => {
      const uniform = isUniform(allCounties.map((c) => m.value(c)), m.unit)
      const best = bestOf(m, columns.map((c) => ({ code: c.code, value: c.county ? m.value(c.county) : null })), uniform)
      return {
        key: m.key, label: m.label, note: m.note, uniform,
        cells: columns.map((c) => ({ code: c.code, text: cellText(m, c.county, year), isBest: best.includes(c.code), missing: c.county === null })),
      }
    }),
  })).filter((g) => g.rows.length > 0)
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx tsx --test src/components/hesabu/compare-metrics.test.ts`
Expected: PASS, all tests (the 5 new ones included).

- [ ] **Step 5: Refactor the desktop table onto `compareRows`**

In `CompareTable.tsx`: change the import to

```tsx
import { MAX_COMPARE, compareRows, type Column, type ComparisonCounty, type MetricDef } from "./compare-metrics"
```

add `const groups = compareRows(metrics, columns, allCounties, year)` after `const remaining = …`, and replace the whole `<tbody>…</tbody>` with:

```tsx
          <tbody>
            {groups.map(({ group, rows }) => (
              <Fragment key={group}>
                <tr>
                  <td colSpan={columns.length + 1} style={{ background: "#f9fafb", padding: "8px 12px", fontSize: 12, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563" }}>
                    {group}
                  </td>
                </tr>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <Box as="th" {...stickyCell} textAlign="left" fontWeight="500" px={3} py={2} borderBottom="1px solid" borderColor="gray.100">
                      {row.label}
                      {row.uniform && <Text fontSize="2xs" color="orange.700">same for all counties</Text>}
                      {row.note && <Text fontSize="2xs" color="gray.500">{row.note}</Text>}
                    </Box>
                    {row.cells.map((cell) => (
                      <Box as="td" key={cell.code} textAlign="right" px={3} py={2} borderBottom="1px solid" borderColor="gray.100"
                        fontWeight={cell.isBest ? "700" : "400"} color={cell.missing ? "gray.500" : "inherit"} whiteSpace="nowrap">
                        {cell.text}
                        {cell.isBest && <Badge ml={2} colorPalette="green" size="xs">Highest</Badge>}
                      </Box>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
```

- [ ] **Step 6: Verify nothing changed on desktop**

Run: `npx tsc --noEmit && npm run hesabu:test 2>&1 | tail -4 && cd $PW && node mobile-check.mjs --width=1280 --only=compare-side-3`
Expected: tsc clean; suite all pass; `PASS clip compare-side-3`, `PASS desktop-table compare-side-3`.

- [ ] **Step 7: Commit**

```bash
git add src/components/hesabu/compare-metrics.ts src/components/hesabu/compare-metrics.test.ts src/components/hesabu/CompareTable.tsx
git commit -m "refactor(hesabu): compareRows feeds the compare table

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Dashboard layout — width, tabs, chart, label size

**Files:**
- Modify: `src/components/hesabu/Dashboard.tsx` (tabs array ~line 64; content wrapper line 144; tab bar ~190–222)
- Modify: `src/components/hesabu/BudgetOverview.tsx` (chart header `HStack` ~line 45; labels at lines 85, 127)
- Modify: `src/components/hesabu/TrendChart.tsx` (wrapper div; `XAxis`)
- Modify: `src/components/hesabu/KPICards.tsx` (label at line 76)

**Interfaces:**
- Consumes: `data-tab` hooks from Task 1.
- Produces: nothing other tasks use.

- [ ] **Step 1: Confirm the RED lines for this task**

Run: `cd $PW && node mobile-check.mjs --only=dash-overview`
Expected: `FAIL clip dash-overview`, `FAIL tabs dash-overview`, `FAIL text dash-overview` (10px labels).

- [ ] **Step 2: Content width**

`Dashboard.tsx`, the content wrapper:

```tsx
      <Box w="100%" maxW="8xl" mx="auto" px={{ base: 4, md: 8 }} py={6}>
```

- [ ] **Step 3: Tabs — short labels on phones, one scrollable row, 40px**

Tabs array:

```tsx
  const tabs: { id: Tab; label: string; short: string; icon: string }[] = [
    { id: "budget", label: "Budget Overview", short: "Overview", icon: "🏛️" },
    { id: "wards", label: "Ward Comparison", short: "Wards", icon: "🗺️" },
    { id: "reports", label: "Citizen Reports", short: "Reports", icon: "🚩" },
  ];
```

Tab bar `HStack`: add `overflowX="auto"` and change `px={4}` to `px={{ base: 2, md: 4 }}`. On each tab `Box` add:

```tsx
                  flexShrink={0}
                  whiteSpace="nowrap"
                  minH={{ base: "40px", md: "auto" }}
```

change its `px={4}` to `px={{ base: 3, md: 4 }}`, and replace the content `{tab.icon} {tab.label}` with:

```tsx
                  {tab.icon}{" "}
                  <Box as="span" display={{ base: "inline", md: "none" }}>{tab.short}</Box>
                  <Box as="span" display={{ base: "none", md: "inline" }}>{tab.label}</Box>
```

- [ ] **Step 4: Chart header stacks on phones; chart height and year labels**

`BudgetOverview.tsx`: add `Stack` to the Chakra import, and replace the chart header opening `<HStack justify="space-between" mb={4}>` (and its matching closing `</HStack>`, the one right before `<TrendChart`) with:

```tsx
          <Stack direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={{ base: 2, md: 4 }} mb={4}>
```

```tsx
          </Stack>
```

`TrendChart.tsx`: add `import { Box } from "@chakra-ui/react"`, replace `<div style={{ width: "100%", height: 320 }}>` / its closing `</div>` with `<Box w="100%" h={{ base: "260px", md: "320px" }}>` / `</Box>`, and add to the `XAxis`:

```tsx
            interval="preserveStartEnd"
            minTickGap={12}
```

- [ ] **Step 5: 10px labels become 11px on phones**

In `KPICards.tsx` (line 76) and `BudgetOverview.tsx` (lines 85 and 127) replace `fontSize="10px"` with:

```tsx
            fontSize={{ base: "11px", md: "10px" }}
```

- [ ] **Step 6: Run the checker for the dashboard pages**

Run: `cd $PW && node mobile-check.mjs --only=dash-overview; node mobile-check.mjs --only=dash-wards`
Expected: `PASS clip`, `PASS tabs`, `PASS text` on both. `targets` may still FAIL (Task 4). If `text` lists an element not covered above, it is Hesabu content in a file this task already touches: apply the same `{ base: "11px", md: <old> }` pattern and ledger a ruling.

- [ ] **Step 7: Type check, then commit**

Run: `npx tsc --noEmit`
Expected: no output.

```bash
git add src/components/hesabu/Dashboard.tsx src/components/hesabu/BudgetOverview.tsx src/components/hesabu/TrendChart.tsx src/components/hesabu/KPICards.tsx
git commit -m "fix(hesabu): dashboard fits phone screens; short tab labels; chart and labels readable

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Dashboard tap targets, drawer, report form

**Files:**
- Modify: `src/components/hesabu/CountySelector.tsx`, `src/components/hesabu/YearSelector.tsx`
- Modify: `src/components/hesabu/Dashboard.tsx` (the "⇄ Compare counties" `Link`)
- Modify: `src/components/hesabu/SectorCard.tsx` (~line 114), `src/components/hesabu/WardCard.tsx` (~line 113), `src/components/hesabu/CountyWideCard.tsx` (~line 26)
- Modify: `src/components/hesabu/CitizenReports.tsx` (Flag a Gap button; filter pills)
- Modify: `src/components/hesabu/ReportForm.tsx` (buttons ~line 145)
- Modify: `src/components/hesabu/ProjectDrawer.tsx` (chips line 70; badges/links/notes lines 127–171; CloseButton)

**Interfaces:**
- Consumes: checker pages `dash-overview`, `dash-wards`, `dash-reports`, `dash-drawer` from Task 1.
- Produces: nothing other tasks use.

- [ ] **Step 1: Confirm the RED lines**

Run: `cd $PW && node mobile-check.mjs --only=dash-reports; node mobile-check.mjs --only=dash-drawer`
Expected: `FAIL targets` on both (selects ~31px, pills 30px, chips ~32px, source links ~20px), `FAIL text dash-drawer` (2xs = 10px).

- [ ] **Step 2: Header selects and compare link**

`CountySelector.tsx` and `YearSelector.tsx`: add `import { chakra } from "@chakra-ui/react"`, change `<select` to `<chakra.select minH={{ base: "40px", md: "auto" }}` and `</select>` to `</chakra.select>` (keep the `style` prop as is).

`Dashboard.tsx`: wrap the compare `Link`:

```tsx
            <Box asChild display="inline-flex" alignItems="center" minH={{ base: "40px", md: "auto" }}>
              <Link
                href={buildCompareHref({ view: "side", year: currentYear, counties: [currentCountyCode], metric: DEFAULT_METRIC })}
                style={{
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8,
                  color: "white", fontSize: 13, fontWeight: 600, padding: "6px 12px", whiteSpace: "nowrap",
                }}
              >
                ⇄ Compare counties
              </Link>
            </Box>
```

- [ ] **Step 3: "documented projects" buttons**

In `SectorCard.tsx`, `WardCard.tsx` and `CountyWideCard.tsx`, on the `Box as={… ? "button" : "div"}` add:

```tsx
        display="flex"
        alignItems="center"
        minH={{ base: "40px", md: "auto" }}
```

and in `CountyWideCard.tsx` also `w="full"`.

- [ ] **Step 4: Citizen reports button, pills and form buttons**

`CitizenReports.tsx`: on the "+ Flag a Gap" `Button` and on each filter pill `Box as="button"` add `minH={{ base: "40px", md: "auto" }}`; on the pills also `display="inline-flex"` and `alignItems="center"`.

`ReportForm.tsx`, the two buttons:

```tsx
          <Button
            variant="ghost"
            color="gray.600"
            onClick={onCancel}
            disabled={submitting}
            size="sm"
            px={4}
            minH={{ base: "40px", md: "auto" }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            bg="#0f172a"
            color="white"
            fontWeight="bold"
            size="sm"
            px={4}
            minH={{ base: "40px", md: "auto" }}
            loading={submitting}
            loadingText="Submitting…"
            _hover={{ bg: "#1e3a5f" }}
          >
            Submit Report
          </Button>
```

- [ ] **Step 5: Project drawer**

`ProjectDrawer.tsx`:
- `chip`: add `minH={{ base: "40px", md: "auto" }}` to the `Button`.
- Both `Badge`s (status, "Possible duplicate"), the duplicate note `Text`, the "Matched on" `Text` and the footer `Text`: `fontSize="2xs"` → `fontSize={{ base: "11px", md: "2xs" }}`.
- Source `Link`: `fontSize="2xs"` → `fontSize={{ base: "11px", md: "2xs" }}`, and add `display="inline-flex" alignItems="center" minH={{ base: "40px", md: "auto" }}`.
- `CloseButton size="sm"` → `size={{ base: "md", md: "sm" }}`.

- [ ] **Step 6: Run the checker for the dashboard pages**

Run: `cd $PW && for p in dash-overview dash-wards dash-reports dash-drawer; do node mobile-check.mjs --only=$p | grep -v SUMMARY; done`
Expected: every line `PASS`. If `targets` lists the form's text inputs/selects at 38–39px, add `minHeight: 40` to `inputStyle` in `ReportForm.tsx` and ledger a ruling (applies at all widths; a 40px form field on desktop is harmless).

- [ ] **Step 7: Type check, suite, commit**

Run: `npx tsc --noEmit && npm run hesabu:test 2>&1 | tail -3`
Expected: tsc clean; all pass.

```bash
git add src/components/hesabu/CountySelector.tsx src/components/hesabu/YearSelector.tsx src/components/hesabu/Dashboard.tsx src/components/hesabu/SectorCard.tsx src/components/hesabu/WardCard.tsx src/components/hesabu/CountyWideCard.tsx src/components/hesabu/CitizenReports.tsx src/components/hesabu/ReportForm.tsx src/components/hesabu/ProjectDrawer.tsx
git commit -m "fix(hesabu): 40px tap targets and readable drawer text on phones; visible Cancel button

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Compare page on phones

**Files:**
- Modify: `src/components/hesabu/CompareTable.tsx` (add the stacked layout; card overflow)
- Modify: `src/components/hesabu/CompareControls.tsx` (toggles, selects, chip ×)
- Modify: `src/components/hesabu/CompareView.tsx` (back link)

**Interfaces:**
- Consumes: `compareRows`, `CompareGroup` from Task 2; checker pages `compare-side-1`, `compare-side-3`, `compare-side-long`, `compare-rank`.
- Produces: `data-compare-col` on each phone header column, `data-compare-cell` on each phone value cell.

- [ ] **Step 1: Confirm the RED lines**

Run: `cd $PW && node mobile-check.mjs --only=compare-side-3`
Expected: `FAIL side compare-side-3 cells=0`, `FAIL targets` (toggles 34px, selects 31px, × 24px, back link 16px).

- [ ] **Step 2: Stacked phone layout**

`CompareTable.tsx`: add `Grid` to the Chakra import. On the outer card `Box` change `overflow="hidden"` to `overflow={{ base: "visible", md: "hidden" }}` (a sticky header cannot stick inside `overflow: hidden`). Wrap the existing `<Box overflowX="auto">…</Box>` table block in `<Box display={{ base: "none", md: "block" }}>…</Box>`, and insert before it:

```tsx
      <Box display={{ base: "block", md: "none" }}>
        <Grid templateColumns={cols} gap={2} px={3} py={1} position="sticky" top={0} zIndex={1} bg="white"
          borderTopRadius="lg" borderBottom="1px solid" borderColor="gray.200">
          {columns.map((c) => (
            <Box key={c.code} data-compare-col="" textAlign="center" minW={0}>
              <Link href={`/hesabu?county=${c.code}&year=${encodeURIComponent(year)}`}
                style={{ color: "#0e7490", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center",
                  justifyContent: "center", minHeight: 40, overflowWrap: "anywhere" }}>
                {c.name}
              </Link>
            </Box>
          ))}
        </Grid>
        {groups.map(({ group, rows }) => (
          <Box key={group}>
            <Text bg="gray.50" px={3} py={2} fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em" color="gray.600">
              {group}
            </Text>
            {rows.map((row) => (
              <Box key={row.key} px={3} py={2} borderBottom="1px solid" borderColor="gray.100">
                <Text fontSize="sm" fontWeight="500">{row.label}</Text>
                {row.uniform && <Text fontSize="11px" color="orange.700">same for all counties</Text>}
                {row.note && <Text fontSize="11px" color="gray.500">{row.note}</Text>}
                <Grid templateColumns={cols} gap={2} mt={1}>
                  {row.cells.map((cell) => (
                    <Box key={cell.code} data-compare-cell="" textAlign="center" minW={0} overflowWrap="anywhere" fontSize="sm"
                      fontWeight={cell.isBest ? "700" : "400"} color={cell.missing ? "gray.500" : "inherit"}>
                      {cell.text}
                      {cell.isBest && <Text fontSize="11px" fontWeight="600" color="green.700">Highest</Text>}
                    </Box>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
```

with, next to `const groups = …`:

```tsx
  const cols = `repeat(${columns.length}, minmax(0, 1fr))`
```

- [ ] **Step 3: Controls and back link**

`CompareControls.tsx`: add `chakra` to the Chakra import. Change each `<button … style={toggleStyle(…)}>` to `<chakra.button minH={{ base: "40px", md: "auto" }} … style={toggleStyle(…)}>` (closing `</chakra.button>`), and each of the three `<select … style={selectStyle}>` to `<chakra.select minH={{ base: "40px", md: "auto" }} … style={selectStyle}>` (closing `</chakra.select>`). On the chip's remove `Box as="button"` add:

```tsx
              display="inline-flex" alignItems="center" justifyContent="center"
              minW={{ base: "40px", md: "auto" }} minH={{ base: "40px", md: "auto" }}
```

`CompareView.tsx`: wrap the back link:

```tsx
          <Box asChild display="inline-flex" alignItems="center" minH={{ base: "40px", md: "auto" }}>
            <Link href={back} style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>← Back to county dashboard</Link>
          </Box>
```

- [ ] **Step 4: Run the checker for the compare pages**

Run: `cd $PW && for p in compare-side-1 compare-side-3 compare-side-long compare-rank; do node mobile-check.mjs --only=$p | grep -v SUMMARY; done`
Expected: every line `PASS`, including `side … cells=` 2, 6 and 8 for side-1, side-3 and side-long (header + first-row cells at minimum; actual counts are higher).

- [ ] **Step 5: Desktop still uses the table**

Run: `cd $PW && node mobile-check.mjs --width=1280 --only=compare-side-3`
Expected: `PASS clip compare-side-3`, `PASS desktop-table compare-side-3`.

- [ ] **Step 6: Type check, suite, commit**

Run: `npx tsc --noEmit && npm run hesabu:test 2>&1 | tail -3`
Expected: tsc clean; all pass.

```bash
git add src/components/hesabu/CompareTable.tsx src/components/hesabu/CompareControls.tsx src/components/hesabu/CompareView.tsx
git commit -m "feat(hesabu): compare page stacks counties side by side on phones; 40px controls

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Whole-branch verification

**Files:** none changed unless a check fails.

- [ ] **Step 1: Full phone run with screenshots**

Run: `cd $PW && node mobile-check.mjs --shots=after`
Expected: every line `PASS`; `SUMMARY 0 fail (width 390)`.

- [ ] **Step 2: Desktop and in-between widths**

Run: `cd $PW && node mobile-check.mjs --width=1280 && node mobile-check.mjs --width=800`
Expected: `SUMMARY 0 fail` for both (only `clip` and `desktop-table` checks run at these widths).

- [ ] **Step 3: Look at the screenshots**

Open `$PW/after-dash-overview.png`, `$PW/after-dash-reports.png` and `$PW/after-compare-side-long.png` and compare with their `before-` versions. Expected: no right-edge cropping; three tabs on one row; four county columns with wrapped long names; Cancel visible.

- [ ] **Step 4: Lint, types, suite**

Run: `npx tsc --noEmit && npx eslint src/components/hesabu && npm run hesabu:test 2>&1 | tail -3`
Expected: no tsc output; no eslint errors; all tests pass.
