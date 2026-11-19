# Hesabu: county comparison

- **Date:** 2026-11-19
- **Status:** draft, awaiting review
- **Branch:** `feat/hesabu-county-compare`

## Goal

Let a citizen, journalist or official see how counties compare on budget and delivery. There are two ways to compare:

- **Side by side.** Pick 2–4 counties and compare them figure by figure.
- **Ranking.** Pick one figure and see every county with data, ranked.

## Decisions

These were agreed in conversation on 2026-11-19.

1. Both views will be built: side by side and ranking.
2. The comparison gets its own page, `/hesabu/compare`. The county dashboard stays a single-county page.
3. The current dashboard gets a **Compare** button. It opens the compare page with the current county and year already selected.

## What the data can and cannot support

These facts were checked against the database on 2026-11-19. They shape what the page shows and how it labels it.

| Fact | Consequence |
|---|---|
| 13 counties have data for each year from 2018/19 to 2025/26. Older years have 14. | Rankings say "of 13", never "of 47". The count is computed, not hard-coded. |
| All counties use the same 9 sector names, such as "Health Services" and "Water & Environment". | Sectors can be compared directly. No name mapping is needed. |
| Each county's equitable share comes from the Division of Revenue Act (DoRA). Total budget, development share and absorption are set per county in the seed. | These figures differ between counties and can be compared. They are still estimates, and the page says so. |
| **Revenue collected is the target × one rate that is the same for every county in a year.** In 2025/26 that rate is 90.0% for all 13 counties. | A ranking would show a 13-way tie and look like a finding. See the "same for every county" rule in §2. |
| Older years are seeded by scaling each county's 2025/26 figures by a national factor for each year. | The page compares one year at a time. Comparing changes across years is out of scope. |
| Scraped projects (`h_projects`) exist for only 3 counties (Wajir, Kilifi, Baringo). Most of their statuses are `unknown`. | Project figures show which counties have been scraped. "0 projects" is never shown for a county that hasn't been scraped. |
| There is no population data. | Per-person figures are out of scope. |

## Design

### 1. Route and URL

**File:** `src/app/(frontend)/hesabu/compare/page.tsx` (server component).

```
/hesabu/compare?view=side&counties=008,030,047&year=2025/2026
/hesabu/compare?view=rank&metric=absorption&year=2025/2026&counties=008
```

| Param | Meaning | Default and validation |
|---|---|---|
| `view` | `side` or `rank` | `side`. Any other value becomes `side`. |
| `year` | Fiscal year | The latest year that has any county data. A year with no data falls back to that latest year. |
| `counties` | Comma-separated county codes | Unknown codes and duplicates are dropped, and only the first 4 are kept. An empty list is allowed: the side view then asks the user to pick counties. In the ranking view, these counties are **highlighted**. |
| `metric` | Ranking figure (a key from §2) | `absorption`. Unknown keys fall back to `absorption`. |

A pure function `parseCompareParams(raw, { years, countyCodes })` in `src/components/hesabu/compare-params.ts` applies these rules, and unit tests cover it. Switching view keeps `year` and `counties`, so moving between the two views is lossless.

### 2. Figures (metrics)

**File:** `src/components/hesabu/compare-metrics.ts`. It holds pure definitions and helpers, with no I/O.

```ts
type Direction = "higher-better" | "neutral"
interface MetricDef {
  key: string; label: string; group: "Budget" | "Performance" | "Sectors" | "Projects"
  unit: "kes" | "pct" | "count"; direction: Direction
  value: (c: ComparisonCounty) => number | null
  note?: string        // short caveat shown next to the label
}
```

| Key | Label | Group | Unit | Direction | Value |
|---|---|---|---|---|---|
| `totalBudget` | Total budget | Budget | kes | neutral | `totalBudget` |
| `equitableShare` | Equitable share (DoRA) | Budget | kes | neutral | `equitableShare` |
| `devShare` | Development share of budget | Budget | pct | higher-better | development ÷ total |
| `absorption` | Development absorption | Performance | pct | higher-better | `devAbsorptionRate` |
| `revenuePerformance` | Revenue collected vs target | Performance | pct | higher-better | collected ÷ target |
| `sector:<name>` (one per sector, 9 in all) | `<name>` share of budget | Sectors | pct | neutral | sector allocated ÷ total budget |
| `projects` | Documented projects | Projects | count | neutral | Distinct projects, excluding possible duplicates. `null` if the county hasn't been scraped. |
| `stalledProjects` | Documented stalled projects | Projects | count | neutral | Same rule as above, with status `stalled`. |

Notes on the table:
- **Neutral** means more is not better. A bigger budget or more documented projects doesn't make a county better. Neutral figures can be ranked, but they never get a "best" marker.
- **Division:** a zero or missing denominator gives `null`, never `NaN` or `Infinity`.

**Helpers**

*`bestOf(metric, values)`*
- Returns the county codes holding the best value. Ties all count.
- Returns an empty result when any of these is true:
  - the figure is neutral;
  - fewer than 2 counties have a value;
  - the figure is the same for every county (next helper).

*`isUniform(values)`*
- True when the non-null values differ by less than 0.05 percentage points for `pct` figures, or less than 0.1% relative for other units.
- Requires at least 2 values.

*Rule for a figure that is the same for every county*
- **Ranking view:** the chart is replaced by "All N counties have the same value (90.0%). In our data this figure is an estimate, so it can't be ranked yet."
- **Side-by-side view:** the values are still shown, with a small "same for all counties" note and no best marker.
- **Detection is automatic.** No figure is hard-coded as uniform, so the rule stops applying once real data arrives.

### 3. Data: `getCountyComparison(fiscalYear)`

Added to `src/services/Hesabu.ts`. It runs three queries in parallel and returns every county for the year (13 rows). Both views use this one result, and the side view filters it by `counties`.

```ts
type ComparisonCounty = {
  code: string; name: string
  totalBudget: number; equitableShare: number
  developmentExpenditure: number; revenueTarget: number; revenueCollected: number
  devAbsorptionRate: number | null
  sectors: { name: string; allocated: number }[]
  projects: { scraped: boolean; total: number; stalled: number }
}
```

The three queries:
1. `hCounty.findMany({ where: { fiscalYear }, include: { sectors } })`. BigInt values are converted to numbers.
2. `hProject.groupBy({ by: ["countyCode", "status"], where: { fiscalYear, possibleDuplicateOf: null } })`.
3. `hProject.groupBy({ by: ["countyCode"] })`, for any year. This sets `scraped`: a county with rows in some year but none in this year shows `0`. A county with no rows at all shows "Not yet scraped".

If queries 2 and 3 fail, they fall back through the existing `orFallback`. Every county then shows "Project data unavailable", and the page still renders.

Another new function, `getComparisonYears()`, returns the distinct fiscal years in `h_counties`, newest first.

### 4. UI

**`CompareControls`** (client component) updates the URL with `router.replace`:
- A view toggle: **Side by side** | **Ranking**.
- A year select, reusing the existing `YearSelector` styling.
- A county picker, used in both views:
  - The selected counties show as removable chips.
  - "Add county" is disabled at 4.
- A ranking figure select, shown in the ranking view only.

**`CompareTable`** (side by side)
- Layout:
  - Columns are counties; each header links to that county's dashboard (`/hesabu?county=X&year=Y`).
  - Rows are figures, grouped under Budget, Performance, Sectors and Projects.
- Cell content:
  - The best value is bold with a small "Highest" badge.
  - `null` shows "—".
  - Unscraped projects show "Not yet scraped".
- With 0 or 1 county selected, the table shows what it has plus a prompt: "Add up to N more counties to compare".
- **Mobile:** the table scrolls sideways inside its container, with the first (figure) column sticky. The page itself never scrolls sideways.

**`CompareRanking`**
- **Chart:** a horizontal bar chart (`recharts`, already a dependency) with one bar per county that has a value.
  - Sorted best-first for higher-is-better figures, and largest-first for neutral ones.
  - Each bar is labelled with its formatted value.
- **Highlighting:** counties in `counties` get the accent colour, and other bars are muted.
- **Header:** "Ranked among the 13 counties with data for FY 2025/26". For each highlighted county it adds a line like "Wajir: 11th of 13". Ties share a rank.
- **Counties without a value** are listed below the chart under "No data".
- **Uniform figures:** the chart is replaced by the notice from §2.

**Data note** (footer on both views)
- "County figures are compiled estimates from budget documents and the Division of Revenue Act, not audited actuals. Figures marked 'same for all counties' cannot be compared yet. Project counts cover only counties whose public documents have been scraped."

**Dashboard: Compare button**
- In `Dashboard.tsx`, a **Compare counties** button sits next to the county and year selectors.
- It links to `/hesabu/compare?counties=<current code>&year=<current year>`.

**Page metadata:** title "Compare counties — Hesabu".

### 5. Error handling

- **No county data in any year:** the page shows an empty state, "No county data yet", instead of crashing.
- **The main county query fails:** the error propagates to Next's error boundary, as on the dashboard. Without county figures there is nothing to compare.
- **Project queries fail:** handled by the fallback in §3.
- **Bad URL params:** cleaned up by `parseCompareParams`. A bad URL never returns a 404.

## Testing

**`compare-params.test.ts`** (`node:test`, added to `npm run hesabu:test`) checks that:
- Defaults are applied.
- Unknown and duplicate codes are dropped, and only 4 are kept.
- An unknown year falls back to the latest.
- An unknown metric falls back to `absorption`.
- An empty `counties` is allowed.

**`compare-metrics.test.ts`** checks:
- Each figure's value, including a zero denominator giving `null`.
- `bestOf`:
  - ties are all marked;
  - neutral figures get no best;
  - fewer than 2 values gives none;
  - a uniform figure gives none.
- `isUniform`: 90.0% across 13 counties is true; 44–64 is false.
- Ranking order and shared ranks for ties.

**Browser check:**
- The dashboard's Compare button opens the page with the current county.
- Side by side with Wajir, Baringo and Nairobi: the best markers are correct, and revenue shows "same for all counties".
- Ranking by absorption highlights Wajir. Ranking by revenue shows the uniform notice.
- At phone width there is no sideways page scroll.

## Out of scope

- **Per-person figures:** they need population data.
- **Replacing the seeded county figures with real Controller of Budget figures.** This is the recommended follow-up, now that the CoB scraper works with credit. It gets its own spec.
- **Comparing changes across years.** The older years are scaled from 2025/26, so the trends would be artificial.
- **Rank hints on the dashboard's headline figures**, such as "9th of 13".
- **Export or download.**
