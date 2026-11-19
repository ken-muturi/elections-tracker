# Hesabu Project Drill-down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a citizen open a ward card on the Hesabu dashboard and see the scraped projects behind it, with cost, status and source links. The cards' seeded numbers stay unchanged.

**Architecture:**
- A static IEBC ward list plus a pure name matcher place each scraped project under a ward card, or under a "county-wide" bucket.
- A loader writes the projects into a new `h_projects` table, replacing all of one county's rows at a time.
- Server actions return a per-card summary for the cards, and per-card project lists for a Chakra drawer.

**Tech Stack:** Next.js 15 (App Router, server actions), React 19, Chakra UI v3, Prisma 6 on PostgreSQL, `tsx` 4, and `node:test` run through `npx tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-hesabu-project-drilldown-design.md`

## Global Constraints

- **Branch:** `feat/hesabu-project-drilldown`, which branches off `feat/hesabu-scraper-sources`.
- **No new npm dependencies.** Tests use `node:test` and `node:assert/strict` via `npx tsx --test <files>`.
- **The project is ESM** (`"type": "module"`). In scripts, use `fileURLToPath(import.meta.url)`, never `__dirname` or `require`.
- **Seeded card numbers must not change.** These are Total, Done, Pending, Stalled, completion and satisfaction.
- **The loader never writes** to `HReport`, `HVote`, `HWard` or `HCounty`.
- **Matching rules:**
  - Match whole words only.
  - Ignore names shorter than 4 characters.
  - Ignore a name equal to the county's own name.
  - Split IEBC names on `/` and `-` and match each part.
  - When a location points to a constituency that several cards share, the project goes to `null` (county-wide).
- **Totals sum stated amounts only.** When some projects have no amount, the label says `(stated for X of Y)`.
- **Drawer disclaimer, verbatim:** "Projects are compiled from public documents. Card totals above are separate estimates."
- **County-wide card label, verbatim:** `County-wide / location not stated`.
- **Card line text:**
  - `📄 {count} documented projects · {total}`
  - When the count is 0: `No documented projects yet`
- **Database safety:** never run `prisma migrate reset` or `prisma db push --force-reset`. If `prisma migrate status` reports drift, stop and ask the user.

## Review Focus

These failure modes are not otherwise covered by tests. Each has a test in the task named in brackets.

1. **Generic ward names cause false matches.** IEBC wards named `Township`, `Central`, `Town` or `Majengo` would match unrelated text, for example "Sessi Township". These names must be ignored. [Task 2]
2. **Spacing differs between card and text.** The card "Garba Tulla" must still match text that writes "Garbatulla", and the reverse. [Task 2]
3. **Whitespace in the source CSV.** The CSV has double spaces, as in `BARINGO  NORTH`. Constituency lookup must still match the card subCounty "Baringo North". [Task 1]
4. **Running the loader twice.** A second load must produce the same row count, with no duplicates. Two identical items in one county file collapse into one row. [Task 4]
5. **Projects with no amount.** These sort last in the drawer. Summary labels never show a partial sum as if it were complete. [Task 5 helper test and Task 6 query ordering]

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `scripts/hesabu/data/build-wards.ts` | new | One-off converter from the IEBC CSV to JSON; records provenance |
| `scripts/hesabu/data/kenya-wards.json` | new, generated | Lists counties, then constituencies, then wards |
| `scripts/hesabu/lib/wards.ts` | new | `getCountyConstituencies(countyCode)` |
| `scripts/hesabu/lib/wards.test.ts` | new | Checks counts and whitespace normalisation |
| `scripts/hesabu/processors/location-matcher.ts` | new | Pure `matchCard()` |
| `scripts/hesabu/processors/location-matcher.test.ts` | new | Matcher tests |
| `scripts/hesabu/processors/project-rows.ts` | new | Pure `buildProjectRows()`: scraper output to DB rows plus stats |
| `scripts/hesabu/processors/project-rows.test.ts` | new | Tests the dedup key, unknown FY and empty titles |
| `scripts/hesabu/load.ts` | new | CLI `hesabu:load` |
| `src/constants/hesabu-sources.ts` | new | `SOURCE_INFO`, `SourceKey`, shared by the scraper and the UI |
| `scripts/hesabu/lib/sources.ts` | modify | Re-exports from `src/constants/hesabu-sources.ts` |
| `prisma/schema.prisma` | modify | Adds the `HProject` model |
| `prisma/migrations/20261117000000_add_h_projects/migration.sql` | new | Migration for the new table |
| `src/services/Hesabu.ts` | modify | `getProjectSummaryByCard`, `getProjectsForCard` |
| `src/components/hesabu/project-format.ts` | new | Pure label helpers and equity-flag helpers |
| `src/components/hesabu/project-format.test.ts` | new | Helper tests |
| `src/components/hesabu/ProjectDrawer.tsx` | new | The drawer |
| `src/components/hesabu/WardCard.tsx` | modify | Adds the project line |
| `src/components/hesabu/CountyWideCard.tsx` | new | The county-wide bucket card |
| `src/components/hesabu/WardComparison.tsx` | modify | Wiring and drawer state |
| `src/components/hesabu/Dashboard.tsx` | modify | Passes `projectSummary`; footer fix |
| `src/app/(frontend)/hesabu/page.tsx` | modify | Fetches the project summary |
| `src/components/hesabu/EquityAlert.tsx` | modify | County name and flagging fixes |
| `scripts/hesabu/cron.sh` | modify | Runs `hesabu:load` after a scrape |
| `package.json` | modify | Adds `hesabu:load` and `hesabu:test` |

**Deviation from the spec, noted on purpose:** the spec says the drawer "reuses `StatusBadge`". That component is typed to citizen-report statuses (`UNRESOLVED`, `INVESTIGATING`, `RESOLVED`), so the drawer gets its own small badge map for `stalled`, `ongoing`, `completed` and `unknown`.

---

### Task 1: IEBC ward reference data

**Files:**
- Create: `scripts/hesabu/data/build-wards.ts`
- Create: `scripts/hesabu/data/kenya-wards.json` (generated)
- Create: `scripts/hesabu/lib/wards.ts`
- Test: `scripts/hesabu/lib/wards.test.ts`
- Modify: `package.json`, to add `hesabu:test`

**Interfaces:**
- Produces:
  - `export interface ConstituencyWards { name: string; wards: string[] }`
  - `export function getCountyConstituencies(countyCode: string): ConstituencyWards[]`. The code is 3 digits, e.g. `"008"`. Unknown codes return `[]`.

- [ ] **Step 1: Download the source CSV into the scratchpad**

```bash
mkdir -p "$TMPDIR/hesabu-wards" && curl -sL -o "$TMPDIR/hesabu-wards/wards.csv" \
  "https://raw.githubusercontent.com/pkiage/data-Kenya-Counties-Constituencies-Wards/main/csv-Kenya-Counties-Constituencies-Wards.csv"
head -2 "$TMPDIR/hesabu-wards/wards.csv"
```
Expected header: `COUNTY ID,COUNTY NAME,CONSTITUENCY ID,CONSTITUENCY NAME,WARD ID,WARD NAME`, which may start with a BOM. The file has 1,450 data rows.

- [ ] **Step 2: Write the converter `scripts/hesabu/data/build-wards.ts`**

```ts
/**
 * Builds kenya-wards.json from the IEBC-derived CSV in
 * https://github.com/pkiage/data-Kenya-Counties-Constituencies-Wards (no licence file; data is
 * IEBC public record). 47 counties · 290 constituencies · 1,450 wards.
 *
 * Usage: npx tsx scripts/hesabu/data/build-wards.ts <path-to-csv>
 */
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvPath = process.argv[2]
if (!csvPath) throw new Error("Usage: build-wards.ts <csv>")

const clean = (s: string) =>
  s.replace(/^﻿/, "").replace(/\s+/g, " ").trim().toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())

const lines = fs.readFileSync(csvPath, "utf-8").split(/\r?\n/).filter(Boolean)
const [, ...rows] = lines

type County = { countyCode: string; county: string; constituencies: { name: string; wards: string[] }[] }
const counties = new Map<string, County>()

for (const line of rows) {
  const [countyId, countyName, , constituency, , ward] = line.split(",")
  const code = countyId.replace(/^﻿/, "").trim().padStart(3, "0")
  const county = counties.get(code) ?? { countyCode: code, county: clean(countyName), constituencies: [] }
  counties.set(code, county)
  const consName = clean(constituency)
  let cons = county.constituencies.find((c) => c.name === consName)
  if (!cons) county.constituencies.push((cons = { name: consName, wards: [] }))
  cons.wards.push(clean(ward))
}

const out = {
  source: "https://github.com/pkiage/data-Kenya-Counties-Constituencies-Wards (IEBC)",
  generatedAt: new Date().toISOString().slice(0, 10),
  counties: [...counties.values()].sort((a, b) => a.countyCode.localeCompare(b.countyCode)),
}
const dest = path.join(__dirname, "kenya-wards.json")
fs.writeFileSync(dest, JSON.stringify(out, null, 1) + "\n")
const cons = out.counties.reduce((n, c) => n + c.constituencies.length, 0)
const wards = out.counties.reduce((n, c) => n + c.constituencies.reduce((m, k) => m + k.wards.length, 0), 0)
console.log(`Wrote ${dest}: ${out.counties.length} counties, ${cons} constituencies, ${wards} wards`)
```

- [ ] **Step 3: Generate the JSON**

Run: `npx tsx scripts/hesabu/data/build-wards.ts "$TMPDIR/hesabu-wards/wards.csv"`

Expected: `Wrote …/kenya-wards.json: 47 counties, 290 constituencies, 1450 wards`

- [ ] **Step 4: Write the failing test `scripts/hesabu/lib/wards.test.ts`**

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { getCountyConstituencies } from "./wards"

test("Wajir has 6 constituencies incl. Tarbaj with Wargadud ward", () => {
  const cons = getCountyConstituencies("008")
  assert.equal(cons.length, 6)
  const tarbaj = cons.find((c) => c.name === "Tarbaj")
  assert.ok(tarbaj?.wards.includes("Wargadud"))
})

test("double spaces in source names are collapsed (Baringo North)", () => {
  const names = getCountyConstituencies("030").map((c) => c.name)
  assert.ok(names.includes("Baringo North"), names.join(", "))
})

test("unknown county code returns []", () => {
  assert.deepEqual(getCountyConstituencies("999"), [])
})
```

- [ ] **Step 5: Run it and confirm it fails**

Run: `npx tsx --test scripts/hesabu/lib/wards.test.ts`

Expected: FAIL, because the module `./wards` is not found.

- [ ] **Step 6: Implement `scripts/hesabu/lib/wards.ts`**

```ts
/** IEBC constituencies and wards per county (data/kenya-wards.json, built by data/build-wards.ts) */
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

export interface ConstituencyWards { name: string; wards: string[] }
interface WardFile { counties: { countyCode: string; county: string; constituencies: ConstituencyWards[] }[] }

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "../data/kenya-wards.json")
let _data: WardFile | null = null

export function getCountyConstituencies(countyCode: string): ConstituencyWards[] {
  _data ??= JSON.parse(fs.readFileSync(FILE, "utf-8")) as WardFile
  return _data.counties.find((c) => c.countyCode === countyCode)?.constituencies ?? []
}
```

- [ ] **Step 7: Run the test and confirm it passes**

Run: `npx tsx --test scripts/hesabu/lib/wards.test.ts`

Expected: 3 tests pass.

- [ ] **Step 8: Add the test script to `package.json`**

Add this line under `"scripts"`, next to the other `hesabu:*` entries:

```json
"hesabu:test": "tsx --test scripts/hesabu/lib/wards.test.ts",
```

Later tasks append their test files to this command.

- [ ] **Step 9: Commit**

```bash
git add scripts/hesabu/data scripts/hesabu/lib/wards.ts scripts/hesabu/lib/wards.test.ts package.json
git commit -m "feat(hesabu): IEBC ward reference data"
```

---

### Task 2: Location matcher

**Files:**
- Create: `scripts/hesabu/processors/location-matcher.ts`
- Test: `scripts/hesabu/processors/location-matcher.test.ts`
- Modify: `package.json`, to append the test file to `hesabu:test`

**Interfaces:**
- Consumes: `ConstituencyWards` from `scripts/hesabu/lib/wards.ts`
- Produces:
  - `export interface Card { name: string; subCounty: string }`
  - `export interface MatchResult { cardName: string | null; matchedOn: string | null; method: "card-name" | "ward" | "constituency" | null }`
  - `export function matchCard(project: { ward?: string; title: string; summary: string }, cards: Card[], constituencies: ConstituencyWards[], countyName: string): MatchResult`

- [ ] **Step 1: Write the failing tests**

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { matchCard, Card } from "./location-matcher"
import type { ConstituencyWards } from "../lib/wards"

const WAJIR_CARDS: Card[] = [
  { name: "Wajir Town", subCounty: "Wajir East" },
  { name: "Wajir North", subCounty: "Wajir North" },
  { name: "Wajir South", subCounty: "Wajir South" },
  { name: "Wajir West", subCounty: "Wajir West" },
  { name: "Tarbaj", subCounty: "Tarbaj" },
  { name: "Eldas", subCounty: "Eldas" },
]
const WAJIR_CONS: ConstituencyWards[] = [
  { name: "Wajir North", wards: ["Gurar", "Bute", "Korondile", "Malkagufu", "Batalu", "Danaba", "Godoma"] },
  { name: "Wajir East", wards: ["Wagberi", "Township", "Barwago", "Khorof/Harar"] },
  { name: "Tarbaj", wards: ["Elben", "Sarman", "Tarbaj", "Wargadud"] },
  { name: "Wajir West", wards: ["Arbajahan", "Hadado/Athibohol", "Ademasajide", "Wagalla/Ganyure"] },
  { name: "Eldas", wards: ["Eldas", "Della", "Lakoley South/Basir", "Elnur/Tula Tula"] },
  { name: "Wajir South", wards: ["Benane", "Burder", "Dadaja Bulla", "Habasswein", "Lagboghol South", "Ibrahim Ure", "Diif"] },
]
const p = (title: string, ward?: string, summary = "") => ({ title, ward, summary })
const wajir = (proj: ReturnType<typeof p>) => matchCard(proj, WAJIR_CARDS, WAJIR_CONS, "Wajir")

test("constituency name in ward field → that card", () => {
  const r = wajir(p("Construction of borehole", "Holoke In Tarbaj"))
  assert.equal(r.cardName, "Tarbaj")
})

test("ward name → its constituency's card", () => {
  const r = wajir(p("Wargadud dispensary upgrade"))
  assert.deepEqual(r, { cardName: "Tarbaj", matchedOn: "wargadud", method: "ward" })
})

test("slash-named ward matches on either part", () => {
  assert.equal(wajir(p("Mau Mau at Wagalla water pan")).cardName, "Wajir West")
  assert.equal(wajir(p("Ganyure classroom")).cardName, "Wajir West")
})

test("card name wins over ward lookup (Wajir Town card)", () => {
  const r = wajir(p("Wajir Town drainage works"))
  assert.equal(r.cardName, "Wajir Town")
  assert.equal(r.method, "card-name")
})

test("county name alone does not match", () => {
  assert.equal(wajir(p("Wajir County fleet purchase")).cardName, null)
})

test("generic ward name 'Township' is ignored", () => {
  assert.equal(wajir(p("Sessi Township market shed")).cardName, null)
})

test("search order: ward field before title", () => {
  const r = wajir(p("Wargadud road", "Danaba"))
  assert.equal(r.cardName, "Wajir North")
})

test("summary is searched last", () => {
  assert.equal(wajir(p("Dispensary upgrade", undefined, "Located in Bute ward.")).cardName, "Wajir North")
})

test("no location → null", () => {
  assert.deepEqual(wajir(p("Supply of drugs")), { cardName: null, matchedOn: null, method: null })
})

test("names under 4 chars ignored, whole-word only (Adu vs education)", () => {
  const cards: Card[] = [{ name: "Magarini", subCounty: "Magarini" }]
  const cons: ConstituencyWards[] = [{ name: "Magarini", wards: ["Adu", "Garashi"] }]
  assert.equal(matchCard(p("Education support"), cards, cons, "Kilifi").cardName, null)
  assert.equal(matchCard(p("Adu dispensary"), cards, cons, "Kilifi").cardName, null)
  assert.equal(matchCard(p("Garashi dispensary"), cards, cons, "Kilifi").cardName, "Magarini")
})

test("constituency shared by two cards → null", () => {
  const cards: Card[] = [{ name: "Tiaty East", subCounty: "Tiaty" }, { name: "Tiaty West", subCounty: "Tiaty" }]
  const cons: ConstituencyWards[] = [{ name: "Tiaty", wards: ["Tirioko", "Kolowa"] }]
  assert.equal(matchCard(p("Tirioko water project"), cards, cons, "Baringo").cardName, null)
})

test("spacing variants: card 'Garba Tulla' matches 'Garbatulla' and vice versa", () => {
  const cards: Card[] = [{ name: "Garba Tulla", subCounty: "Merti" }, { name: "Isiolo Town", subCounty: "Isiolo" }]
  const cons: ConstituencyWards[] = [{ name: "Isiolo South", wards: ["Garbatulla", "Kinna", "Sericho"] }]
  assert.equal(matchCard(p("Garbatulla hospital"), cards, cons, "Isiolo").cardName, "Garba Tulla")
  assert.equal(matchCard(p("Garba Tulla hospital"), cards, cons, "Isiolo").cardName, "Garba Tulla")
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx tsx --test scripts/hesabu/processors/location-matcher.test.ts`

Expected: FAIL, because the module is not found.

- [ ] **Step 3: Implement `scripts/hesabu/processors/location-matcher.ts`**

```ts
/**
 * Places a scraped project under a dashboard ward card using place names in its text.
 * Pure function — no I/O. See spec §2 for the rules.
 */
import type { ConstituencyWards } from "../lib/wards"

export interface Card { name: string; subCounty: string }
export interface MatchResult {
  cardName: string | null
  matchedOn: string | null
  method: "card-name" | "ward" | "constituency" | null
}

/** IEBC ward names that are common words — matching them causes false positives */
const GENERIC = new Set(["township", "central", "town", "majengo", "market", "mjini", "county", "headquarters"])

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()

/** Strip trailing "ward" / "sub county" / "constituency" so "Bute Ward" → "bute" */
const stripSuffix = (s: string) => s.replace(/\s+(ward|sub county|subcounty|constituency)$/, "")

/** Normalised aliases for a place name: split on / and -, plus a no-space form */
function aliases(name: string, countyNorm: string): string[] {
  const out = new Set<string>()
  for (const part of name.split(/[\/-]/)) {
    const n = stripSuffix(norm(part))
    if (!n) continue
    for (const a of [n, n.replace(/ /g, "")]) {
      if (a.replace(/ /g, "").length < 4 || a === countyNorm || GENERIC.has(a)) continue
      out.add(a)
    }
  }
  return [...out]
}

/** Text → set of searchable forms: spaced text plus each adjacent-word pair joined */
function contains(text: string, alias: string): boolean {
  if (` ${text} `.includes(` ${alias} `)) return true
  // "garba tulla" in text should match alias "garbatulla"
  const words = text.split(" ")
  for (let i = 0; i < words.length - 1; i++) if (words[i] + words[i + 1] === alias) return true
  return false
}

export function matchCard(
  project: { ward?: string; title: string; summary: string },
  cards: Card[],
  constituencies: ConstituencyWards[],
  countyName: string
): MatchResult {
  const countyNorm = norm(countyName)
  const cardAliases = cards.map((c) => ({ card: c, aliases: aliases(c.name, countyNorm) }))

  /** Distinct card names whose subCounty or name equals the constituency */
  const cardsFor = (constituency: string) => {
    const n = norm(constituency)
    return [...new Set(cards.filter((c) => norm(c.subCounty) === n || norm(c.name) === n).map((c) => c.name))]
  }

  const fields = [project.ward, project.title, project.summary].filter((f): f is string => !!f && !!f.trim())

  for (const field of fields) {
    const text = stripSuffix(norm(field))

    // 1. Card's own name — longest alias wins ("wajir north" over a shorter match)
    let best: { name: string; alias: string } | null = null
    for (const { card, aliases: as } of cardAliases)
      for (const a of as) if (contains(text, a) && (!best || a.length > best.alias.length)) best = { name: card.name, alias: a }
    if (best) return { cardName: best.name, matchedOn: best.alias, method: "card-name" }

    // 2. IEBC ward → constituency → card
    for (const cons of constituencies)
      for (const ward of cons.wards)
        for (const a of aliases(ward, countyNorm))
          if (contains(text, a)) {
            const names = cardsFor(cons.name)
            return names.length === 1
              ? { cardName: names[0], matchedOn: a, method: "ward" }
              : { cardName: null, matchedOn: a, method: null }
          }

    // 3. Constituency name → card
    for (const cons of constituencies)
      for (const a of aliases(cons.name, countyNorm))
        if (contains(text, a)) {
          const names = cardsFor(cons.name)
          return names.length === 1
            ? { cardName: names[0], matchedOn: a, method: "constituency" }
            : { cardName: null, matchedOn: a, method: null }
        }
  }

  return { cardName: null, matchedOn: null, method: null }
}
```

A note on the test "search order: ward field before title". The ward field "Danaba" is searched first. Danaba is not a card name, but it is a Wajir North ward, so step 2 returns Wajir North before the title is ever searched.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx tsx --test scripts/hesabu/processors/location-matcher.test.ts`

Expected: all 12 tests pass. If "Holoke In Tarbaj" fails, check that `contains` finds `tarbaj` as a whole word.

- [ ] **Step 5: Append the test file to the `hesabu:test` script in `package.json`**

```json
"hesabu:test": "tsx --test scripts/hesabu/lib/wards.test.ts scripts/hesabu/processors/location-matcher.test.ts",
```

- [ ] **Step 6: Commit**

```bash
git add scripts/hesabu/processors/location-matcher.ts scripts/hesabu/processors/location-matcher.test.ts package.json
git commit -m "feat(hesabu): location matcher for placing projects on ward cards"
```

---

### Task 3: `HProject` table and shared source info

**Files:**
- Modify: `prisma/schema.prisma`, adding the model after `HVote` (around line 246)
- Create: `prisma/migrations/20261117000000_add_h_projects/migration.sql`
- Create: `src/constants/hesabu-sources.ts`
- Modify: `scripts/hesabu/lib/sources.ts`

**Interfaces:**
- Produces:
  - The Prisma model `hProject`, with fields exactly as in the schema below.
  - `src/constants/hesabu-sources.ts` exports `SOURCE_KEYS`, `SourceKey`, and `SOURCE_INFO`.
  - `scripts/hesabu/lib/sources.ts` keeps exporting `SOURCE_KEYS`, `SourceKey`, `SOURCE_INFO`, `SourceRef` and `SourceCoverage` under the same names.

- [ ] **Step 1: Move `SOURCE_KEYS`, `SourceKey` and `SOURCE_INFO` to `src/constants/hesabu-sources.ts`**

Cut these three declarations verbatim from `scripts/hesabu/lib/sources.ts` and paste them into the new file, under this header comment:

```ts
/**
 * Hesabu data sources — shared by the scraper (scripts/hesabu) and the dashboard UI.
 */
```

Then, in `scripts/hesabu/lib/sources.ts`, replace the removed declarations with:

```ts
export { SOURCE_KEYS, SOURCE_INFO } from "../../../src/constants/hesabu-sources"
export type { SourceKey } from "../../../src/constants/hesabu-sources"
import type { SourceKey } from "../../../src/constants/hesabu-sources"
```

Keep `SourceRef` and `SourceCoverage` in `scripts/hesabu/lib/sources.ts`.

- [ ] **Step 2: Confirm the scraper still type-checks**

Run: `cd scripts/hesabu && npx tsc --noEmit --module esnext --moduleResolution bundler --skipLibCheck --strict --target es2022 index.ts; cd -`

Expected: no output.

- [ ] **Step 3: Add the model to `prisma/schema.prisma`**

```prisma
/// Project or audit item scraped from public sources (not citizen-filed).
/// Linked to dashboard cards by (countyCode, fiscalYear, cardName), not FK — HWard rows are per-year.
model HProject {
  id              String   @id @default(cuid()) @db.VarChar(50)
  countyCode      String   @map("county_code") @db.VarChar(5)
  fiscalYear      String   @map("fiscal_year") @db.VarChar(15)
  /// Matched card name (HWard.name) — null = county-wide / location not stated
  cardName        String?  @map("card_name") @db.VarChar(150)
  locationText    String?  @map("location_text") @db.VarChar(300)
  matchedOn       String?  @map("matched_on") @db.VarChar(150)
  title           String   @db.VarChar(500)
  sector          String   @db.VarChar(100)
  status          String   @db.VarChar(20)
  budgetAllocated BigInt?  @map("budget_allocated")
  budgetSpent     BigInt?  @map("budget_spent")
  summary         String   @db.Text
  confidence      String   @db.VarChar(20)
  primarySource   String   @map("primary_source") @db.VarChar(30)
  /// [{ source, url }]
  sources         Json
  sourceDate      String?  @map("source_date") @db.VarChar(20)
  dedupKey        String   @map("dedup_key") @db.VarChar(64)
  scrapedAt       DateTime @map("scraped_at")
  loadedAt        DateTime @default(now()) @map("loaded_at")

  @@unique([countyCode, dedupKey])
  @@index([countyCode, fiscalYear, cardName])
  @@map("h_projects")
}
```

- [ ] **Step 4: Check migration status. This is a gate.**

Run: `npx prisma migrate status`

Continue only if the output says the database schema is up to date with all migrations applied. **If it reports drift, or that migrations are missing, stop and ask the user.** Never reset the database.

- [ ] **Step 5: Generate the SQL for the new table only**

Diff the committed schema against the edited schema, so that no unrelated drift ends up in the migration:

```bash
git show HEAD:prisma/schema.prisma > "$TMPDIR/schema.before.prisma"
mkdir -p prisma/migrations/20261117000000_add_h_projects
npx prisma migrate diff --from-schema-datamodel "$TMPDIR/schema.before.prisma" \
  --to-schema-datamodel prisma/schema.prisma --script \
  > prisma/migrations/20261117000000_add_h_projects/migration.sql
cat prisma/migrations/20261117000000_add_h_projects/migration.sql
```

Expected: a `CREATE TABLE "h_projects"` statement, one unique index, one index, and nothing else.

- [ ] **Step 6: Apply the migration and regenerate the client**

Run: `npx prisma migrate deploy && npx prisma generate`

Expected: `1 migration applied`, then the generated client output.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20261117000000_add_h_projects src/constants/hesabu-sources.ts scripts/hesabu/lib/sources.ts
git commit -m "feat(hesabu): h_projects table; share source info with UI"
```

---

### Task 4: Row builder and `hesabu:load`

**Files:**
- Create: `scripts/hesabu/processors/project-rows.ts`
- Test: `scripts/hesabu/processors/project-rows.test.ts`
- Create: `scripts/hesabu/load.ts`
- Modify: `package.json`, to add `hesabu:load` and append to `hesabu:test`
- Modify: `scripts/hesabu/cron.sh`

**Interfaces:**
- Consumes:
  - `matchCard`, `Card` from Task 2
  - `getCountyConstituencies` from Task 1
  - `ExtractedReport` from `scripts/hesabu/lib/claude.ts`
  - the Prisma `hProject` model from Task 3
- Produces:
  - `export interface ProjectRow`. Its shape is identical to `Prisma.HProjectCreateManyInput`, minus `id` and `loadedAt`.
  - `export interface LoadStats { total: number; placed: number; byMethod: Record<"card-name" | "ward" | "constituency", number>; countyWide: number; unknownFy: number; skippedEmpty: number; duplicates: number }`
  - `export function buildProjectRows(input: { countyCode: string; countyName: string; scrapedAt: string; reports: ExtractedReport[] }, cards: Card[], constituencies: ConstituencyWards[]): { rows: ProjectRow[]; stats: LoadStats }`
  - `export function dedupKey(fiscalYear: string, title: string, amount?: number): string`
  - The CLI: `npm run hesabu:load -- [--counties=A,B] [--dry-run]`

- [ ] **Step 1: Write the failing tests**

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { buildProjectRows, dedupKey } from "./project-rows"
import type { ExtractedReport } from "../lib/claude"

const cards = [{ name: "Tarbaj", subCounty: "Tarbaj" }]
const cons = [{ name: "Tarbaj", wards: ["Wargadud"] }]
const rep = (o: Partial<ExtractedReport>): ExtractedReport => ({
  title: "Wargadud dispensary", fiscalYear: "2025/2026", sector: "Health", status: "ongoing",
  summary: "s", confidence: "verified", sourceUrl: "https://tenders.go.ke/tenders/1",
  source: "tenders", sources: [{ source: "tenders", url: "https://tenders.go.ke/tenders/1" }], ...o,
})
const build = (reports: ExtractedReport[]) =>
  buildProjectRows({ countyCode: "008", countyName: "Wajir", scrapedAt: "2026-11-16T00:00:00Z", reports }, cards, cons)

test("maps a report to a placed row with BigInt amount and sources", () => {
  const { rows, stats } = build([rep({ budgetAllocated: 1_250_000.4 })])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].cardName, "Tarbaj")
  assert.equal(rows[0].budgetAllocated, 1_250_000n)
  assert.equal(rows[0].primarySource, "tenders")
  assert.deepEqual(rows[0].sources, [{ source: "tenders", url: "https://tenders.go.ke/tenders/1" }])
  assert.equal(stats.placed, 1)
  assert.equal(stats.byMethod.ward, 1)
})

test("identical items in one file collapse to one row", () => {
  const { rows, stats } = build([rep({}), rep({ title: "  WARGADUD   Dispensary " })])
  assert.equal(rows.length, 1)
  assert.equal(stats.duplicates, 1)
})

test("dedupKey is stable and differs by amount", () => {
  assert.equal(dedupKey("2025/2026", "A b", 5), dedupKey("2025/2026", "a  B", 5))
  assert.notEqual(dedupKey("2025/2026", "A b", 5), dedupKey("2025/2026", "A b", 6))
})

test("empty titles skipped, unknown FY counted but kept", () => {
  const { rows, stats } = build([rep({ title: "  " }), rep({ fiscalYear: "unknown", title: "Other" })])
  assert.equal(stats.skippedEmpty, 1)
  assert.equal(stats.unknownFy, 1)
  assert.equal(rows.length, 1)
  assert.equal(stats.countyWide, 1)
})

test("missing sources fall back to sourceUrl", () => {
  const { rows } = build([rep({ source: undefined, sources: undefined })])
  assert.deepEqual(rows[0].sources, [{ source: "unknown", url: "https://tenders.go.ke/tenders/1" }])
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx tsx --test scripts/hesabu/processors/project-rows.test.ts`

Expected: FAIL, because the module is not found.

- [ ] **Step 3: Implement `scripts/hesabu/processors/project-rows.ts`**

```ts
/** Scraper output → h_projects rows (pure; the loader does the DB writes) */
import { createHash } from "crypto"
import type { ExtractedReport } from "../lib/claude"
import type { ConstituencyWards } from "../lib/wards"
import { matchCard, Card } from "./location-matcher"

export interface ProjectRow {
  countyCode: string
  fiscalYear: string
  cardName: string | null
  locationText: string | null
  matchedOn: string | null
  title: string
  sector: string
  status: string
  budgetAllocated: bigint | null
  budgetSpent: bigint | null
  summary: string
  confidence: string
  primarySource: string
  sources: { source: string; url: string }[]
  sourceDate: string | null
  dedupKey: string
  scrapedAt: Date
}

export interface LoadStats {
  total: number
  placed: number
  byMethod: Record<"card-name" | "ward" | "constituency", number>
  countyWide: number
  unknownFy: number
  skippedEmpty: number
  duplicates: number
}

const normTitle = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim()

export function dedupKey(fiscalYear: string, title: string, amount?: number): string {
  return createHash("sha1").update(`${fiscalYear}|${normTitle(title)}|${amount ?? ""}`).digest("hex")
}

const toBig = (n?: number) => (n == null || !isFinite(n) ? null : BigInt(Math.round(n)))
const cut = (s: string | undefined | null, n: number) => (s ? s.slice(0, n) : null)

export function buildProjectRows(
  input: { countyCode: string; countyName: string; scrapedAt: string; reports: ExtractedReport[] },
  cards: Card[],
  constituencies: ConstituencyWards[]
): { rows: ProjectRow[]; stats: LoadStats } {
  const stats: LoadStats = {
    total: input.reports.length, placed: 0, byMethod: { "card-name": 0, ward: 0, constituency: 0 },
    countyWide: 0, unknownFy: 0, skippedEmpty: 0, duplicates: 0,
  }
  const rows: ProjectRow[] = []
  const seen = new Set<string>()

  for (const r of input.reports) {
    const title = r.title?.trim()
    if (!title) { stats.skippedEmpty++; continue }
    const key = dedupKey(r.fiscalYear, title, r.budgetAllocated)
    if (seen.has(key)) { stats.duplicates++; continue }
    seen.add(key)
    if (r.fiscalYear === "unknown") stats.unknownFy++

    const m = matchCard({ ward: r.ward, title, summary: r.summary ?? "" }, cards, constituencies, input.countyName)
    if (m.cardName && m.method) { stats.placed++; stats.byMethod[m.method]++ } else stats.countyWide++

    rows.push({
      countyCode: input.countyCode,
      fiscalYear: r.fiscalYear,
      cardName: m.cardName,
      locationText: cut(r.ward, 300),
      matchedOn: cut(m.matchedOn, 150),
      title: title.slice(0, 500),
      sector: (r.sector || "Other").slice(0, 100),
      status: r.status,
      budgetAllocated: toBig(r.budgetAllocated),
      budgetSpent: toBig(r.budgetSpent),
      summary: r.summary ?? "",
      confidence: r.confidence,
      primarySource: r.source ?? r.sources?.[0]?.source ?? "unknown",
      sources: r.sources?.length ? r.sources : [{ source: r.source ?? "unknown", url: r.sourceUrl }],
      sourceDate: cut(r.sourceDate, 20),
      dedupKey: key,
      scrapedAt: new Date(input.scrapedAt),
    })
  }
  return { rows, stats }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx tsx --test scripts/hesabu/processors/project-rows.test.ts`

Expected: 5 tests pass.

- [ ] **Step 5: Implement `scripts/hesabu/load.ts`**

```ts
/**
 * Load scraper output into h_projects.
 *   npm run hesabu:load                         # every county file in output/
 *   npm run hesabu:load -- --counties=Wajir     # named counties
 *   npm run hesabu:load -- --dry-run            # match report only, no writes
 * Replaces each county's rows in one transaction. Never touches citizen reports or ward cards.
 */
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import { fileURLToPath } from "url"
import { PrismaClient } from "@prisma/client"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { COUNTIES } from "./constants"
import { getCountyConstituencies } from "./lib/wards"
import { buildProjectRows } from "./processors/project-rows"
import type { ExtractedReport } from "./lib/claude"

const OUTPUT_DIR = path.resolve(__dirname, "output")
const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  const only = args.find((a) => a.startsWith("--counties="))?.slice(11).split(",").map((s) => s.trim().toLowerCase())
  return { only, dryRun: args.includes("--dry-run") }
}

async function main() {
  const { only, dryRun } = parseArgs()
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  let failed = 0

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, file), "utf-8")) as {
      county: { name: string; code: string }; scrapedAt: string; reports: ExtractedReport[]
    }
    const name = data.county?.name
    if (only && !only.includes(name?.toLowerCase())) continue
    const meta = COUNTIES.find((c) => c.name.toLowerCase() === name?.toLowerCase())
    if (!meta) { console.warn(`⚠  ${file}: unknown county "${name}" — skipped`); continue }

    try {
      const cards = await prisma.hWard.findMany({
        where: { county: { code: meta.code } },
        select: { name: true, subCounty: true },
        distinct: ["name"],
      })
      if (cards.length === 0) { console.warn(`⚠  ${meta.name}: no ward cards for code ${meta.code} — skipped`); continue }
      const constituencies = getCountyConstituencies(meta.code)
      if (constituencies.length === 0) console.warn(`⚠  ${meta.name}: no IEBC wards for ${meta.code} — card-name matching only`)

      const { rows, stats } = buildProjectRows(
        { countyCode: meta.code, countyName: meta.name, scrapedAt: data.scrapedAt, reports: data.reports }, cards, constituencies
      )
      const m = stats.byMethod
      console.log(
        `${meta.name.padEnd(10)} ${String(rows.length).padStart(4)} projects · ${stats.placed} placed ` +
        `(card-name ${m["card-name"]}, ward ${m.ward}, constituency ${m.constituency}) · ${stats.countyWide} county-wide · ` +
        `${stats.unknownFy} unknown FY · ${stats.duplicates} dup · ${stats.skippedEmpty} empty`
      )

      if (!dryRun) {
        await prisma.$transaction([
          prisma.hProject.deleteMany({ where: { countyCode: meta.code } }),
          prisma.hProject.createMany({ data: rows, skipDuplicates: true }),
        ])
      }
    } catch (err) {
      failed++
      console.error(`✗ ${meta.name}: ${err instanceof Error ? err.message : String(err)} — previous rows kept`)
    }
  }

  console.log(dryRun ? "\n(dry run — nothing written)" : "\n✅ Load complete")
  await prisma.$disconnect()
  if (failed) process.exit(1)
}

main().catch(async (err) => { console.error("💥", err); await prisma.$disconnect(); process.exit(1) })
```

- [ ] **Step 6: Add the npm scripts**

```json
"hesabu:load": "tsx scripts/hesabu/load.ts",
"hesabu:test": "tsx --test scripts/hesabu/lib/wards.test.ts scripts/hesabu/processors/location-matcher.test.ts scripts/hesabu/processors/project-rows.test.ts",
```

- [ ] **Step 7: Dry run against the existing output**

Run: `npm run hesabu:load -- --dry-run`

Expected: one line per county, for Baringo, Isiolo, Kilifi, Marsabit and Wajir, with nonzero `placed` for Kilifi and Wajir, followed by `(dry run — nothing written)`.

Then spot-check about 10 placements per county. Temporarily add `console.table(rows.filter(r => r.cardName).slice(0, 10).map(r => ({ card: r.cardName, on: r.matchedOn, title: r.title.slice(0, 60) })))` after the summary line, check the output, and remove the line before committing.

If a generic place word produces wrong matches (for example a common word that is also a ward name), add it to `GENERIC` in Task 2's matcher, and add a test there.

- [ ] **Step 8: Real load, run twice, to confirm the count is stable**

```bash
npm run hesabu:load
npx tsx -e 'import {PrismaClient} from "@prisma/client"; const p=new PrismaClient(); console.log(await p.hProject.count()); await p.$disconnect()'
npm run hesabu:load
npx tsx -e 'import {PrismaClient} from "@prisma/client"; const p=new PrismaClient(); console.log(await p.hProject.count()); await p.$disconnect()'
```

Expected: both counts are identical and equal the sum of the `projects` column.

- [ ] **Step 9: Run the load after a scrape in `scripts/hesabu/cron.sh`**

Replace the line `npm run "$SCRIPT" >> "$LOG" 2>&1` with:

```bash
npm run "$SCRIPT" >> "$LOG" 2>&1
# Load fresh output into the dashboard DB (set -e: only runs if the scrape succeeded)
if [[ "$SCRIPT" == hesabu:scrape* ]]; then
  echo "=== $(date) — npm run hesabu:load ===" >> "$LOG"
  npm run hesabu:load >> "$LOG" 2>&1
fi
```

- [ ] **Step 10: Commit**

```bash
git add scripts/hesabu/processors/project-rows.ts scripts/hesabu/processors/project-rows.test.ts scripts/hesabu/load.ts scripts/hesabu/cron.sh package.json
git commit -m "feat(hesabu): hesabu:load — scraper output into h_projects"
```

---

### Task 5: Label and equity helpers

**Files:**
- Create: `src/components/hesabu/project-format.ts`
- Test: `src/components/hesabu/project-format.test.ts`
- Modify: `package.json`, to append to `hesabu:test`

**Interfaces:**
- Produces:
  - `export type ProjectCardSummary = { cardName: string | null; count: number; withAmount: number; totalAllocated: number }`. Task 6 imports this type from here.
  - `export function fmtKesShort(n: number): string`
  - `export function projectTotalLabel(s: ProjectCardSummary): string`
  - `export function projectLine(s: ProjectCardSummary | undefined): string`
  - `export function joinNames(names: string[]): string`
  - `export function pickEquityFlags<T extends { citizenSatisfactionScore: number }>(wards: T[], threshold?: number): T[]`

- [ ] **Step 1: Write the failing tests**

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { fmtKesShort, projectTotalLabel, projectLine, joinNames, pickEquityFlags } from "./project-format"

test("fmtKesShort scales B / M / plain", () => {
  assert.equal(fmtKesShort(2_340_000_000), "KES 2.34B")
  assert.equal(fmtKesShort(45_200_000), "KES 45.2M")
  assert.equal(fmtKesShort(850_000), "KES 850,000")
})

test("totals never present a partial sum as complete", () => {
  assert.equal(projectTotalLabel({ cardName: "A", count: 9, withAmount: 7, totalAllocated: 45_200_000 }), "KES 45.2M (stated for 7 of 9)")
  assert.equal(projectTotalLabel({ cardName: "A", count: 3, withAmount: 3, totalAllocated: 45_200_000 }), "KES 45.2M")
  assert.equal(projectTotalLabel({ cardName: "A", count: 2, withAmount: 0, totalAllocated: 0 }), "amounts not stated")
})

test("projectLine handles empty and singular", () => {
  assert.equal(projectLine(undefined), "No documented projects yet")
  assert.equal(projectLine({ cardName: "A", count: 1, withAmount: 1, totalAllocated: 2_000_000 }), "📄 1 documented project · KES 2.0M")
  assert.equal(projectLine({ cardName: "A", count: 3, withAmount: 3, totalAllocated: 2_000_000 }), "📄 3 documented projects · KES 2.0M")
})

test("joinNames", () => {
  assert.equal(joinNames(["A"]), "A")
  assert.equal(joinNames(["A", "B"]), "A and B")
  assert.equal(joinNames(["A", "B", "C"]), "A, B and C")
})

test("pickEquityFlags: lowest third under threshold, max 3", () => {
  const w = (s: number) => ({ citizenSatisfactionScore: s })
  const six = [w(25), w(22), w(34), w(36), w(42), w(35)]
  assert.deepEqual(pickEquityFlags(six).map((x) => x.citizenSatisfactionScore), [22, 25])
  assert.deepEqual(pickEquityFlags([w(80), w(70)]), [])
  const twelve = Array.from({ length: 12 }, (_, i) => w(10 + i))
  assert.equal(pickEquityFlags(twelve).length, 3)
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx tsx --test src/components/hesabu/project-format.test.ts`

Expected: FAIL, because the module is not found.

- [ ] **Step 3: Implement `src/components/hesabu/project-format.ts`**

```ts
/** Pure formatting helpers for the Hesabu project drill-down (no React, no server imports) */

export type ProjectCardSummary = {
  cardName: string | null
  count: number
  withAmount: number
  totalAllocated: number
}

export function fmtKesShort(n: number): string {
  if (n >= 1e9) return `KES ${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `KES ${(n / 1e6).toFixed(1)}M`
  return `KES ${Math.round(n).toLocaleString("en-KE")}`
}

export function projectTotalLabel(s: ProjectCardSummary): string {
  if (s.withAmount === 0) return "amounts not stated"
  const total = fmtKesShort(s.totalAllocated)
  return s.withAmount < s.count ? `${total} (stated for ${s.withAmount} of ${s.count})` : total
}

export function projectLine(s: ProjectCardSummary | undefined): string {
  if (!s || s.count === 0) return "No documented projects yet"
  return `📄 ${s.count} documented project${s.count === 1 ? "" : "s"} · ${projectTotalLabel(s)}`
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("")
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

/** Wards below the threshold that are also in the bottom third by satisfaction (max 3), lowest first */
export function pickEquityFlags<T extends { citizenSatisfactionScore: number }>(wards: T[], threshold = 50): T[] {
  const limit = Math.min(3, Math.ceil(wards.length / 3))
  return [...wards]
    .sort((a, b) => a.citizenSatisfactionScore - b.citizenSatisfactionScore)
    .slice(0, limit)
    .filter((w) => w.citizenSatisfactionScore < threshold)
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx tsx --test src/components/hesabu/project-format.test.ts`

Expected: 5 tests pass.

- [ ] **Step 5: Append the test file to `hesabu:test`, then run the full suite**

Add ` src/components/hesabu/project-format.test.ts` to the end of the `hesabu:test` command, then run `npm run hesabu:test`.

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/hesabu/project-format.ts src/components/hesabu/project-format.test.ts package.json
git commit -m "feat(hesabu): project label and equity helpers"
```

---

### Task 6: Server functions

**Files:**
- Modify: `src/services/Hesabu.ts`, appending a new section before the trailing comment at the end of the file

**Interfaces:**
- Consumes:
  - the `hProject` model from Task 3
  - `ProjectCardSummary` from Task 5
- Produces:
  - `export const getProjectSummaryByCard: (countyCode: string, fiscalYear: string) => Promise<ProjectCardSummary[]>`
  - `export type ProjectRowData = { id: string; title: string; sector: string; status: string; budgetAllocated: number | null; budgetSpent: number | null; summary: string; confidence: string; primarySource: string; sources: { source: string; url: string }[]; sourceDate: string | null; matchedOn: string | null; locationText: string | null }`
  - `export const getProjectsForCard: (countyCode: string, fiscalYear: string, cardName: string | null) => Promise<ProjectRowData[]>`

- [ ] **Step 1: Add the functions**

```ts
// ─────────────────────────────────────────────────────────────────────────────
// Scraped projects (h_projects) — drill-down behind ward cards
// ─────────────────────────────────────────────────────────────────────────────

import type { ProjectCardSummary } from "@/components/hesabu/project-format"

export type ProjectRowData = {
  id: string
  title: string
  sector: string
  status: string
  budgetAllocated: number | null
  budgetSpent: number | null
  summary: string
  confidence: string
  primarySource: string
  sources: { source: string; url: string }[]
  sourceDate: string | null
  matchedOn: string | null
  locationText: string | null
}

/** Per-card project count and stated-amount total (cardName null = county-wide). One query. */
export const getProjectSummaryByCard = async (
  countyCode: string,
  fiscalYear: string,
): Promise<ProjectCardSummary[]> => {
  try {
    const groups = await prisma.hProject.groupBy({
      by: ["cardName"],
      where: { countyCode, fiscalYear },
      _count: { _all: true, budgetAllocated: true },
      _sum: { budgetAllocated: true },
    })
    return groups.map((g) => ({
      cardName: g.cardName,
      count: g._count._all,
      withAmount: g._count.budgetAllocated,
      totalAllocated: Number(g._sum.budgetAllocated ?? 0n),
    }))
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Projects for one card (null = county-wide), highest amount first, unstated amounts last. */
export const getProjectsForCard = async (
  countyCode: string,
  fiscalYear: string,
  cardName: string | null,
): Promise<ProjectRowData[]> => {
  try {
    const rows = await prisma.hProject.findMany({
      where: { countyCode, fiscalYear, cardName },
      orderBy: [{ budgetAllocated: { sort: "desc", nulls: "last" } }, { title: "asc" }],
    })
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      sector: r.sector,
      status: r.status,
      budgetAllocated: r.budgetAllocated == null ? null : Number(r.budgetAllocated),
      budgetSpent: r.budgetSpent == null ? null : Number(r.budgetSpent),
      summary: r.summary,
      confidence: r.confidence,
      primarySource: r.primarySource,
      sources: r.sources as ProjectRowData["sources"],
      sourceDate: r.sourceDate,
      matchedOn: r.matchedOn,
      locationText: r.locationText,
    }))
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
```

Move the `import type { ProjectCardSummary }` line up to the import block at the top of the file. Type imports are allowed in a `"use server"` file. Only exported async functions become server actions.

- [ ] **Step 2: Type-check, and run a smoke query against the data loaded in Task 4**

```bash
npx tsc --noEmit -p . 2>&1 | grep -E "src/services/Hesabu|project-format" || echo "no errors in touched files"
npx tsx -e 'import {PrismaClient} from "@prisma/client"; const p=new PrismaClient(); console.log(await p.hProject.groupBy({by:["cardName"],where:{countyCode:"008",fiscalYear:"2025/2026"},_count:{_all:true,budgetAllocated:true},_sum:{budgetAllocated:true}})); await p.$disconnect()'
```

Expected: no errors in the touched files. The groupBy output lists the Wajir cards plus a `null` row, and `_count.budgetAllocated` is no greater than `_all` for each card.

- [ ] **Step 3: Commit**

```bash
git add src/services/Hesabu.ts
git commit -m "feat(hesabu): server functions for project drill-down"
```

---

### Task 7: Card line, county-wide card and drawer

**Files:**
- Create: `src/components/hesabu/ProjectDrawer.tsx`
- Create: `src/components/hesabu/CountyWideCard.tsx`
- Modify: `src/components/hesabu/WardCard.tsx`, adding the project line after the satisfaction row at the end of the card
- Modify: `src/components/hesabu/WardComparison.tsx`
- Modify: `src/components/hesabu/Dashboard.tsx`, adding a prop and passing it to `WardComparison`
- Modify: `src/app/(frontend)/hesabu/page.tsx`

**Interfaces:**
- Consumes:
  - from Task 6: `getProjectsForCard`, `ProjectRowData`, `getProjectSummaryByCard`
  - from Task 5: `ProjectCardSummary`, `projectLine`, `projectTotalLabel`, `fmtKesShort`
  - `SOURCE_INFO` and `SourceKey` from `@/constants/hesabu-sources`
- Produces:
  - `ProjectDrawer({ open, onClose, countyCode, fiscalYear, cardName, label })`
  - `WardCard({ ward, projects?, onOpenProjects? })`
  - `CountyWideCard({ summary?, onOpen })`
  - `WardComparison({ county, countyCode, fiscalYear, projectSummary })`
  - `HesabuDashboard` gains the prop `projectSummary: ProjectCardSummary[]`

- [ ] **Step 1: Fetch the summary in `page.tsx`**

Replace the `Promise.all` that loads `county` and `trendData` with:

```tsx
  const [county, trendData, projectSummary] = await Promise.all([
    getCountyByCode(resolvedCode, fiscalYear),
    getHistoricalTrend(resolvedCode),
    getProjectSummaryByCard(resolvedCode, fiscalYear),
  ]);
```

Add `getProjectSummaryByCard` to the import from `@/services/Hesabu`, and pass `projectSummary={projectSummary}` to `<HesabuDashboard … />`.

- [ ] **Step 2: Thread the prop through `Dashboard.tsx`**

- Add `projectSummary: ProjectCardSummary[];` to `Props`, and destructure it.
- Import the type: `import type { ProjectCardSummary } from "@/components/hesabu/project-format"`.
- Change the wards tab line to:

```tsx
            {activeTab === "wards" && (
              <WardComparison
                county={county}
                countyCode={currentCountyCode}
                fiscalYear={currentYear}
                projectSummary={projectSummary}
              />
            )}
```

- [ ] **Step 3: Add the project line to `WardCard.tsx`**

Change the props and signature:

```tsx
import { ProjectCardSummary, projectLine } from "./project-format"

type Props = { ward: WardData; projects?: ProjectCardSummary; onOpenProjects?: () => void }

export const WardCard = ({ ward, projects, onOpenProjects }: Props) => {
```

Add the line as the last child of the outer `Box`, after the satisfaction `HStack`:

```tsx
      {/* Documented projects (scraped) — opens drill-down */}
      <Box
        as={projects?.count ? "button" : "div"}
        mt={4}
        pt={3}
        w="full"
        textAlign="left"
        borderTop="1px solid"
        borderColor="gray.100"
        cursor={projects?.count ? "pointer" : "default"}
        onClick={projects?.count ? onOpenProjects : undefined}
        _hover={projects?.count ? { color: "teal.700" } : undefined}
      >
        <Text fontSize="xs" fontWeight="semibold" color={projects?.count ? "teal.600" : "gray.400"}>
          {projectLine(projects)}
          {projects?.count ? " →" : ""}
        </Text>
      </Box>
```

- [ ] **Step 4: Create `CountyWideCard.tsx`**

```tsx
import { Box, Text } from "@chakra-ui/react"
import { ProjectCardSummary, projectLine } from "./project-format"

type Props = { summary?: ProjectCardSummary; onOpen: () => void }

export const CountyWideCard = ({ summary, onOpen }: Props) => (
  <Box
    bg="gray.50"
    border="1px dashed"
    borderColor="gray.300"
    borderRadius="xl"
    p={5}
    boxShadow="sm"
    display="flex"
    flexDirection="column"
    justifyContent="space-between"
  >
    <Box>
      <Text fontWeight="bold" color="gray.900" fontSize="md" mb={0.5}>
        County-wide / location not stated
      </Text>
      <Text fontSize="xs" color="gray.500" mb={4}>
        Projects that cover the whole county, or whose documents don&apos;t name a ward or constituency.
      </Text>
    </Box>
    <Box
      as={summary?.count ? "button" : "div"}
      textAlign="left"
      cursor={summary?.count ? "pointer" : "default"}
      onClick={summary?.count ? onOpen : undefined}
    >
      <Text fontSize="xs" fontWeight="semibold" color={summary?.count ? "teal.600" : "gray.400"}>
        {projectLine(summary)}
        {summary?.count ? " →" : ""}
      </Text>
    </Box>
  </Box>
)
```

- [ ] **Step 5: Create `ProjectDrawer.tsx`**

```tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge, Box, Button, CloseButton, Drawer, HStack, Link, Portal, Spinner, Text, VStack } from "@chakra-ui/react"
import { getProjectsForCard, ProjectRowData } from "@/services/Hesabu"
import { SOURCE_INFO, SourceKey } from "@/constants/hesabu-sources"
import { fmtKesShort, projectTotalLabel } from "./project-format"

type Props = {
  open: boolean
  onClose: () => void
  countyCode: string
  fiscalYear: string
  /** null = county-wide bucket */
  cardName: string | null
  label: string
}

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  stalled: { label: "Stalled", bg: "#E63946", color: "#fff" },
  ongoing: { label: "Ongoing", bg: "#E9C46A", color: "#0B0F1A" },
  completed: { label: "Completed", bg: "#2A9D8F", color: "#fff" },
  unknown: { label: "Status unknown", bg: "#e2e8f0", color: "#334155" },
}

const sourceLabel = (key: string) =>
  key in SOURCE_INFO ? SOURCE_INFO[key as SourceKey].name.split(" — ")[0] : key

export const ProjectDrawer = ({ open, onClose, countyCode, fiscalYear, cardName, label }: Props) => {
  const [rows, setRows] = useState<ProjectRowData[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setRows(null)
    setError(null)
    setStatus(null)
    setSource(null)
    getProjectsForCard(countyCode, fiscalYear, cardName)
      .then((r) => { if (!cancelled) setRows(r) })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load projects") })
    return () => { cancelled = true }
  }, [open, countyCode, fiscalYear, cardName, attempt])

  const statuses = useMemo(() => [...new Set((rows ?? []).map((r) => r.status))], [rows])
  const sources = useMemo(() => [...new Set((rows ?? []).flatMap((r) => r.sources.map((s) => s.source)))], [rows])
  const visible = (rows ?? []).filter(
    (r) => (!status || r.status === status) && (!source || r.sources.some((s) => s.source === source))
  )
  const summary = rows && {
    cardName,
    count: rows.length,
    withAmount: rows.filter((r) => r.budgetAllocated != null).length,
    totalAllocated: rows.reduce((s, r) => s + (r.budgetAllocated ?? 0), 0),
  }

  const chip = (active: boolean, text: string, onClick: () => void) => (
    <Button key={text} size="xs" variant={active ? "solid" : "outline"} colorPalette="teal" onClick={onClick}>
      {text}
    </Button>
  )

  return (
    <Drawer.Root open={open} onOpenChange={(e) => { if (!e.open) onClose() }} placement="end" size="md">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header flexDirection="column" alignItems="start" gap={1}>
              <Drawer.Title>{label}</Drawer.Title>
              <Text fontSize="sm" color="gray.500">
                FY {fiscalYear}
                {summary ? ` · ${summary.count} project${summary.count === 1 ? "" : "s"} · ${projectTotalLabel(summary)}` : ""}
              </Text>
            </Drawer.Header>

            <Drawer.Body>
              {!rows && !error && <HStack justify="center" py={10}><Spinner /></HStack>}

              {error && (
                <VStack py={10} gap={3}>
                  <Text color="red.600" fontSize="sm">Couldn&apos;t load projects: {error}</Text>
                  <Button size="sm" onClick={() => setAttempt((n) => n + 1)}>Retry</Button>
                </VStack>
              )}

              {rows && rows.length === 0 && (
                <Text color="gray.500" fontSize="sm" py={10} textAlign="center">No documented projects for FY {fiscalYear}.</Text>
              )}

              {rows && rows.length > 0 && (
                <>
                  <HStack gap={1} flexWrap="wrap" mb={2}>
                    {chip(!status, "All statuses", () => setStatus(null))}
                    {statuses.map((s) => chip(status === s, STATUS[s]?.label ?? s, () => setStatus(s)))}
                  </HStack>
                  <HStack gap={1} flexWrap="wrap" mb={4}>
                    {chip(!source, "All sources", () => setSource(null))}
                    {sources.map((s) => chip(source === s, sourceLabel(s), () => setSource(s)))}
                  </HStack>

                  <VStack align="stretch" gap={3}>
                    {visible.map((r) => {
                      const st = STATUS[r.status] ?? STATUS.unknown
                      const isOpen = expanded.has(r.id)
                      return (
                        <Box key={r.id} border="1px solid" borderColor="gray.200" borderRadius="lg" p={3}>
                          <HStack justify="space-between" align="start" gap={3}>
                            <Text fontWeight="semibold" fontSize="sm" color="gray.900">{r.title}</Text>
                            <Text fontWeight="bold" fontSize="sm" whiteSpace="nowrap" color={r.budgetAllocated == null ? "gray.400" : "gray.900"}>
                              {r.budgetAllocated == null ? "Amount not stated" : fmtKesShort(r.budgetAllocated)}
                            </Text>
                          </HStack>
                          <HStack gap={2} mt={2} flexWrap="wrap">
                            <Badge bg={st.bg} color={st.color} borderRadius="full" px={2} fontSize="2xs">{st.label}</Badge>
                            <Text fontSize="xs" color="gray.500">{r.sector}</Text>
                            {r.sources.map((s) => (
                              <Link key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" fontSize="2xs" color="teal.700"
                                border="1px solid" borderColor="teal.200" borderRadius="full" px={2} py={0.5}>
                                {sourceLabel(s.source)} ↗
                              </Link>
                            ))}
                          </HStack>
                          {r.matchedOn && (
                            <Text fontSize="2xs" color="gray.400" mt={1}>Matched on: {r.locationText ?? r.matchedOn}</Text>
                          )}
                          <Text
                            fontSize="xs" color="gray.600" mt={2} lineClamp={isOpen ? undefined : 2} cursor="pointer"
                            onClick={() => setExpanded((prev) => {
                              const next = new Set(prev)
                              if (next.has(r.id)) next.delete(r.id)
                              else next.add(r.id)
                              return next
                            })}
                          >
                            {r.summary}
                          </Text>
                        </Box>
                      )
                    })}
                  </VStack>
                </>
              )}
            </Drawer.Body>

            <Drawer.Footer>
              <Text fontSize="2xs" color="gray.500">
                Projects are compiled from public documents. Card totals above are separate estimates.
              </Text>
            </Drawer.Footer>

            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
```

- [ ] **Step 6: Wire it up in `WardComparison.tsx`**

Replace the whole file:

```tsx
"use client"

import { useState } from "react"
import { Box, Text, SimpleGrid } from "@chakra-ui/react"
import { CountyFull } from "@/services/Hesabu"
import { WardCard } from "./WardCard"
import { EquityAlert } from "./EquityAlert"
import { CountyWideCard } from "./CountyWideCard"
import { ProjectDrawer } from "./ProjectDrawer"
import { ProjectCardSummary } from "./project-format"

type Props = {
  county: CountyFull
  countyCode: string
  fiscalYear: string
  projectSummary: ProjectCardSummary[]
}

export const WardComparison = ({ county, countyCode, fiscalYear, projectSummary }: Props) => {
  const [drawer, setDrawer] = useState<{ cardName: string | null; label: string } | null>(null)
  const byCard = new Map(projectSummary.map((s) => [s.cardName, s]))

  return (
    <Box>
      <Text fontWeight="bold" color="gray.700" fontSize="md" mb={4}>
        Ward-by-Ward Project Delivery
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} mb={6}>
        {county.wards.map((ward) => (
          <WardCard
            key={ward.id}
            ward={ward}
            projects={byCard.get(ward.name)}
            onOpenProjects={() => setDrawer({ cardName: ward.name, label: ward.name })}
          />
        ))}
        <CountyWideCard
          summary={byCard.get(null)}
          onOpen={() => setDrawer({ cardName: null, label: "County-wide / location not stated" })}
        />
      </SimpleGrid>

      <EquityAlert wards={county.wards} />

      <ProjectDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        countyCode={countyCode}
        fiscalYear={fiscalYear}
        cardName={drawer?.cardName ?? null}
        label={drawer?.label ?? ""}
      />
    </Box>
  )
}
```

`EquityAlert` keeps its current props here. Task 8 changes it.

- [ ] **Step 7: Type-check the touched files**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "components/hesabu|app/\(frontend\)/hesabu|services/Hesabu" || echo "clean"`

Expected: `clean`. If Chakra reports that `lineClamp` or `colorPalette` doesn't exist on a component, check the v3 docs for the prop name, `lineClamp` on `Text` and `colorPalette` on `Button`, and fix it in place.

- [ ] **Step 8: Check it in the running app**

Run `npm run dev`. Open `/hesabu?county=008`, go to the **Ward Comparison** tab, and check each item:
- Each card shows its seeded stats unchanged, plus the project line.
- The county-wide card appears last.
- Clicking a card line opens the drawer with projects, sorted by amount, with unstated amounts last.
- The source chips open the right URLs in a new tab.
- The status and source filters work.
- The disclaimer is visible.
- Closing and reopening the drawer works.
- Switching to a year with no projects shows `No documented projects yet`, and that line is not clickable.

Repeat for `?county=030` (Baringo).

- [ ] **Step 9: Commit**

```bash
git add src/components/hesabu src/app/\(frontend\)/hesabu/page.tsx
git commit -m "feat(hesabu): drill down from ward cards into documented projects"
```

---

### Task 8: Equity alert and footer fixes

**Files:**
- Modify: `src/components/hesabu/EquityAlert.tsx`
- Modify: `src/components/hesabu/WardComparison.tsx`, to pass `countyName`
- Modify: `src/components/hesabu/Dashboard.tsx`, the footer near line 219

**Interfaces:**
- Consumes: `pickEquityFlags` and `joinNames` from Task 5
- Produces: `EquityAlert({ wards, countyName })`

- [ ] **Step 1: Rewrite `EquityAlert.tsx`**

```tsx
import { Box, Text, HStack } from "@chakra-ui/react"
import { WardData } from "@/services/Hesabu"
import { joinNames, pickEquityFlags } from "./project-format"

type Props = { wards: WardData[]; countyName: string }

const completion = (w: WardData) =>
  w.totalProjects > 0 ? Math.round((w.completedProjects / w.totalProjects) * 100) : 0

export const EquityAlert = ({ wards, countyName }: Props) => {
  const flagged = pickEquityFlags(wards)
  if (flagged.length === 0) return null

  const combinedPopulation = flagged.reduce((sum, w) => sum + w.population, 0)
  const comps = flagged.map(completion)
  const sats = flagged.map((w) => w.citizenSatisfactionScore)
  const range = (xs: number[]) =>
    Math.min(...xs) === Math.max(...xs) ? `${xs[0]}%` : `${Math.min(...xs)}–${Math.max(...xs)}%`
  const verb = flagged.length === 1 ? "shows" : "show"

  return (
    <Box bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg" p={4}>
      <HStack gap={2} mb={2} align="flex-start">
        <Text fontSize="xl" flexShrink={0}>⚖️</Text>
        <Text fontWeight="bold" color="red.600" fontSize="sm">
          Equity Alert &mdash; Article 201 of the Constitution
        </Text>
      </HStack>
      <Text fontSize="sm" color="red.700" pl={8}>
        {joinNames(flagged.map((w) => w.name))} {verb} the lowest project completion ({range(comps)}) and
        citizen satisfaction ({range(sats)}) in {countyName}. With a combined population of
        ~{combinedPopulation.toLocaleString()}, equitable resource distribution requires targeted attention.
      </Text>
    </Box>
  )
}
```

This also drops the old sentence's claim of "among the highest poverty rates". No data in the app backs that claim.

- [ ] **Step 2: Pass the county name in `WardComparison.tsx`**

Change `<EquityAlert wards={county.wards} />` to `<EquityAlert wards={county.wards} countyName={county.name} />`.

- [ ] **Step 3: Fix the footer in `Dashboard.tsx`**

Replace:

```tsx
          {county.dataSource ?? "official county budget documents"} &bull; Last
          updated FY {county.fiscalYear} &bull; Built with Hesabu platform
```

with:

```tsx
          {county.dataSource ?? "official county budget documents"} &bull; Showing
          FY {currentYear} &bull; Built with Hesabu platform
```

- [ ] **Step 4: Type-check, run the tests, and check in the browser**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "components/hesabu" || echo "clean"` and `npm run hesabu:test`.

Then open `/hesabu?county=008`. On the Ward Comparison tab, the alert should name at most 2 wards (Tarbaj and Eldas, the lowest third of the 6), say "in Wajir", and never mention Baringo. The footer should read "Showing FY …" with the selected year.

- [ ] **Step 5: Commit**

```bash
git add src/components/hesabu/EquityAlert.tsx src/components/hesabu/WardComparison.tsx src/components/hesabu/Dashboard.tsx
git commit -m "fix(hesabu): equity alert names the right county and flags the lowest third; footer shows selected FY"
```

---

### Task 9: End-to-end check and PR

**Files:** none new.

- [ ] **Step 1: Run the full test suite and type-check**

Run: `npm run hesabu:test && npx tsc --noEmit -p . 2>&1 | grep -E "hesabu|Hesabu" || echo "clean"`

Expected: all tests pass, then `clean`.

- [ ] **Step 2: Run a fresh load and record the match report**

Run: `npm run hesabu:load`. Copy the per-county lines into the PR description.

- [ ] **Step 3: Click through the five priority counties in the browser**

Visit Wajir (`008`), Baringo (`030`), Kilifi (`003`), Marsabit (`010`) and Isiolo (`011`). For each, check that:
- the cards render
- the drawer opens for one ward card and for the county-wide card
- switching to a year with no scraped data shows the empty state

- [ ] **Step 4: Push and open the PR against `feat/hesabu-scraper-sources`**

```bash
git push -u origin feat/hesabu-project-drilldown
gh pr create --base feat/hesabu-scraper-sources --title "feat(hesabu): drill down from ward cards into documented projects" --body "<summary + match report + spec/plan links + 🤖 footer>"
```

The base is the scraper branch, so this PR's diff shows only the drill-down. Retarget it to `main` once PR #5 merges.
