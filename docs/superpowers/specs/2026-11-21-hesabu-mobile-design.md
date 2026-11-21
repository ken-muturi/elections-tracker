# Hesabu mobile pass — design

**Date:** 2026-11-21
**Branch:** `feat/hesabu-mobile` (from `main` at 4291ce8)
**Status:** approved in chat, awaiting spec review

## Goal

Hesabu must be fully usable on a phone, the device most citizens will open it on. The county
dashboard (all three tabs and the project drawer) and the compare page (both views) must work at
a 390px-wide viewport. Desktop keeps its current look.

## Scope

In scope: `/hesabu` (Dashboard and its tabs, project drawer, report form) and `/hesabu/compare`.

Out of scope:
- The audit components (`AuditSection`, `AuditFindings`): they are not on `main` yet. They get
  their own pass after `feat/hesabu-audit-findings` merges.
- The shared site header `PublicTopNav` (its Login button is 30px tall): it is used by the
  elections pages too and is not Hesabu's to change in this pass.
- New features, new data, and the dev-only hydration warning already on `main`.

## Breakpoint rule

"Phone" means below Chakra's `md` breakpoint (768px). Every change below applies only under
`md` unless it says otherwise, written with Chakra responsive props (`{ base: …, md: … }`) so
desktop styles are untouched.

## Changes

### 1. Content width (all screens) — the root bug
`Dashboard.tsx` sets the content wrapper to `w="8xl"`, a fixed 1440px. On a phone the page crops
everything past 390px: card edges, the chart, and the whole Citizen Reports tab. Change it to
`w="100%" maxW="8xl"`. This is a bug fix and applies at every width. Screens 1440px and wider look
exactly as now; narrower desktops (a 1280px laptop loses about 160px on the right today) are fixed
too.

### 2. Tab bar
The three tabs need about 490px. On phones:
- labels shorten to **Overview**, **Wards**, **Reports** (icons stay); desktop keeps the full labels;
- the bar is one row that scrolls sideways if it still does not fit (`overflowX="auto"`,
  `flexShrink={0}` on each tab), so a tab can never be hidden;
- each tab is at least 40px tall.

### 3. Budget trend chart
- The title and the colour key stack vertically on phones (key below the title) instead of
  sitting side by side.
- The x-axis shows fewer year labels on phones so they do not overlap
  (`interval="preserveStartEnd"` with a `minTickGap`).
- Chart height drops from 320px to 260px on phones.

### 4. Compare table: stacked rows on phones
Below `md`, `CompareTable` renders a stacked layout instead of the table:
- a header row with one column per selected county (county name, linked as today), pinned to the
  top of the card while scrolling (`position: sticky`);
- for each metric group, the group heading, then per metric: the metric label (with its note and
  "same for all counties" line) across the full width, and beneath it one value per county in the
  same columns as the header;
- columns are equal width (`repeat(n, 1fr)`); 4 counties fit at 390px (~85px each); values may
  wrap; the best value is bold and shows "Highest" on its own line under the value.

At `md` and up the existing table renders unchanged.

Both layouts read the same data through one new pure function in `compare-metrics.ts`:

```ts
export type CompareCell = { code: string; text: string; isBest: boolean; missing: boolean }
export type CompareRow = { key: string; label: string; note?: string; uniform: boolean; cells: CompareCell[] }
export type CompareGroup = { group: MetricGroup; rows: CompareRow[] }
export function compareRows(metrics: MetricDef[], columns: Column[], allCounties: ComparisonCounty[], year: string): CompareGroup[]
```

It moves the per-row logic now inline in `CompareTable` (`isUniform`, `bestOf`, `cellText`) into
one tested place; groups with no metrics are omitted, in `METRIC_GROUPS` order.

### 5. Tap targets (phones: at least 40px tall)
- County and year selects in the Dashboard header; the "⇄ Compare counties" link.
- Compare page: "Side by side"/"Ranking" toggles, year and metric selects, "+ Add county" select,
  "← Back to county dashboard" link (now 16px).
- The "×" on each compare county chip gets a 40×40px hit area (the visible glyph may stay small).
- Report filter pills (All / Unresolved / Investigating / Resolved).
- The "📄 N documented projects →" buttons on sector, ward and county-wide cards.
- Project drawer filter chips (`size="xs"` today).
- Report form Cancel and Submit buttons.

### 6. Text size (phones: no text under 11px)
The 10px uppercase labels on `KPICards` and `BudgetOverview` cards become 11px on phones.

### 7. Report form buttons (all screens)
- Cancel uses `whiteAlpha.600` text on a light grey card, so it is nearly invisible: change to
  `gray.600`.
- Both buttons get horizontal padding so their text does not touch their edges.

## Testing

**Unit (node:test):** `compareRows` — groups in `METRIC_GROUPS` order with empty groups omitted;
best cell flagged; uniform rows flag no best; a column with no county gives
`missing: true` and "No data for FY …"; not-scraped project counts give "Not yet scraped".

**Browser (Playwright, scratchpad, not committed):** at 390×844 with touch, on
`/hesabu?county=001` (Overview, Wards, Reports with the form open, the project drawer) and
`/hesabu/compare` (side view with 3 and 4 counties, ranking view). Each must print PASS for:
1. no element extends past the viewport's right edge (checked on every element, not just the
   document scroll width, since an `overflow: hidden` ancestor hides clipping);
2. all three tabs are fully inside the viewport;
3. every button, link, select and input inside Hesabu content is at least 40px tall
   (the shared `PublicTopNav` is excluded);
4. no visible text under 11px inside Hesabu content;
5. side view: all selected county names and all their values are inside the viewport without
   sideways scrolling.

Plus a desktop check at 1280×900: the compare page still renders a `<table>`; Dashboard content
fits the viewport with nothing past its right edge. Before/after screenshots at 390px for both pages.
