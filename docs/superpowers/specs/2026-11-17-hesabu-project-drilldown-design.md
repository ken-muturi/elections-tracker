# Hesabu — Project drill-down from ward cards

**Date:** 2026-11-17
**Status:** Draft, awaiting review
**Branch:** `feat/hesabu-scraper-sources` (PR #5) or a follow-up branch off it

## Goal

On the Hesabu dashboard's **Ward Comparison** tab, a citizen can open any ward card and see the documented projects behind it: what each one is, what it costs, its status, and where the information came from.

The project data comes from the scraper (`scripts/hesabu/output/*.json`). Today that data is never loaded into the database, so the page cannot show it.

## Decisions

These were agreed in conversation on 2026-11-17.

1. **The cards stay.** Their existing seeded numbers stay as they are: Total, Done, Pending, Stalled, completion and satisfaction.
2. **Show both.** Each card gets one extra line counted from real scraped projects, for example `📄 3 documented projects · KES 45.2M`. That line opens the drill-down.
3. **Scraped projects are loaded into the database.** They go in a new table and are never mixed with citizen-filed reports (`HReport`).
4. **Location matching uses a static IEBC ward list.** Matching is by name, with no Claude call.

## Background and constraints

**Cards are not uniformly constituencies.**

`HWard` rows are per county and per fiscal year. In each row, `name` is the card label and `subCounty` is mostly the constituency. Exceptions exist:

| Kind of exception | Examples |
|---|---|
| The card is a ward or town | Diani (Msambweni), Kipini (Garsen), Wabera (Isiolo), Garba Tulla (Merti), Mandera Town (Mandera East), Wajir Town (Wajir East) |
| Several cards share one sub-county | Baringo has 2 × Tiaty; Isiolo has Isiolo Town and Wabera under Isiolo; Merti has Garba Tulla and Merti |

**Most scraped projects have no usable location.**

| County | Scraped items | `ward` field set |
|---|---|---|
| Wajir | 171 | 16 |
| Kilifi | 118 | 76 |
| Baringo | 103 | 27 |
| Marsabit | 103 | 13 |
| Isiolo | 18 | 0 |

Where the `ward` field is set it is often noisy, for example "Mau Mau At Wagalla", "Holoke In Tarbaj" and "Nyayo Road In Marsabit Central". Location must also be looked for in the title and summary.

**The Elections geography tables can't be used.** `Ward` and `Constituency` hold placeholder ward names ("Eldas Ward 1"). They are not a source of real ward names.

**Some projects have fiscal year `"unknown"`.** These are not shown in per-year views, and the loader reports how many there are.

**Amounts are partial.** Many projects have no `budgetAllocated`. A total must never present a partial sum as complete.

**There is no test runner in the repo.** Tests use `node:test` run through `tsx` (`npx tsx --test`). No new dependency is needed.

## Design

### 1. Reference data: the IEBC ward list

- **File:** `scripts/hesabu/data/kenya-wards.json`.
- **Shape:** `{ countyCode, county, constituencies: [{ name, wards: [name] }] }[]`. It covers 47 counties, 290 constituencies and 1,450 wards.
- **Source:** an open dataset derived from IEBC, such as a public GitHub dataset. The implementation plan names the exact source and records it in the file's header comment and in this spec.
- **Validation:** check that each county has the expected constituency count. The five priority counties are spot-checked by hand.

### 2. Location matcher

**File:** `scripts/hesabu/processors/location-matcher.ts`. It is a pure function with no I/O, so it can be unit-tested.

```ts
matchCard(project: { ward?: string; title: string; summary: string },
          cards: { id: string; name: string; subCounty: string }[],
          countyWards: { constituency: string; wards: string[] }[]):
  { cardId: string | null; matchedOn: string | null; method: "card-name" | "ward" | "constituency" | null }
```

**Text searched.** The matcher searches `ward`, then `title`, then `summary`, in that order, and stops at the first field with a match. All text is normalised: lower case, punctuation turned into spaces, and the trailing word "ward", "sub-county" or "constituency" stripped. Matching is whole-word only. IEBC ward names that contain a slash or hyphen, such as "Wagalla/Ganyure" and "Hadado/Athibohol", are split, and each part is matched on its own.

**Matching steps**, in order of priority:

1. **Card name.** If the text contains a card's own `name` (for example "Garba Tulla", "Wajir Town" or "Diani"), the project goes to that card.
2. **Ward.** If the text contains an IEBC ward name, find that ward's constituency. If exactly one card has `subCounty` (or `name`) equal to that constituency, the project goes to that card.
3. **Constituency.** If the text contains a constituency name, the same rule as step 2 applies.
4. **No match.** In every other case, including when two cards share the constituency, `cardId` is `null`.

**Two rules prevent wrong matches:**
- Names shorter than 4 characters are ignored. This stops "Adu" from matching inside "education".
- A name equal to the county's own name is ignored, so "Wajir" does not match the card "Wajir North". Composite names such as "Wajir North" still match.

**Output.** Every project keeps its raw `locationText` and the matcher's `matchedOn` value, so a wrong placement can be traced back.

### 3. Database: `HProject`

```prisma
/// Project or audit item scraped from public sources (not citizen-filed).
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
  status          String   @db.VarChar(20)    // stalled | ongoing | completed | unknown
  budgetAllocated BigInt?  @map("budget_allocated")
  budgetSpent     BigInt?  @map("budget_spent")
  summary         String   @db.Text
  confidence      String   @db.VarChar(20)    // verified | reported | estimated
  primarySource   String   @map("primary_source") @db.VarChar(30)
  /// [{ source, url }] — every source the item was found in
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

**Why the table links by name instead of a foreign key.** `HWard` and `HCounty` rows are repeated for every fiscal year. A foreign key would tie each project to one year's row, and rows can be re-seeded. Linking by `(countyCode, fiscalYear, cardName)` keeps the projects valid when that happens. The UI joins on these fields.

**Dedup key.** `dedupKey` is the sha1 of `fiscalYear | normalised title | budgetAllocated`. Loading the same data twice updates rows instead of duplicating them.

**Migration.** The table is added through a Prisma migration in `prisma/migrations/`.

### 4. Loader: `npm run hesabu:load`

**File:** `scripts/hesabu/load.ts`.

Steps for each county file:
1. Read `output/<county>.json`.
2. Look up the `HWard` cards for that county code, for each fiscal year present in the projects.
3. Run the matcher on each project.
4. In one transaction, delete that county's existing `HProject` rows and insert the new set. The scraper output is the source of truth for each county.
5. Never touch `HReport`, `HVote`, `HWard` or `HCounty`.

The loader prints a match report for each county, for example:

```
Wajir      171 projects · 38 placed (card-name 9, ward 21, constituency 8) · 128 county-wide · 5 unknown FY
```

**Flags:**
- `--counties=Wajir,Baringo` loads only the named counties.
- `--dry-run` prints the match report and writes nothing.

**Scheduling.** `cron.sh` runs `hesabu:load` after a scrape completes successfully.

### 5. Server functions (`src/services/Hesabu.ts`)

- **`getProjectSummaryByCard(countyCode, fiscalYear)`** returns `{ cardName | null → { count, withAmount, totalAllocated } }`.
  - Implemented as one `groupBy` query.
  - Feeds the line on each card and the county-wide card.
- **`getProjectsForCard(countyCode, fiscalYear, cardName | null)`** returns the project rows for the drawer.
  - It is called when the drawer opens, so it doesn't make the page payload larger.
  - BigInt values are serialised as numbers.

### 6. UI

**`WardCard`**
- Adds one line under the existing stats: `📄 {count} documented projects · KES {total}`.
- If some projects have no amount, the line says so, for example `KES 45.2M (stated for 7 of 9)`.
- If the count is 0, the line reads `No documented projects yet` and is not clickable.
- The seeded stats are unchanged.

**County-wide card** (new)
- Labelled `County-wide / location not stated`.
- Rendered last in the grid and opens the same drawer.
- Has no seeded stats; only the project count and total.

**`ProjectDrawer`** (new, Chakra `Drawer`)

*Header*
- Card name, fiscal year, count, and the total, with the same partial-sum note as the card.

*Each project row shows*
- the title
- the KES amount, or "Amount not stated"
- a status badge (reuses `StatusBadge`)
- the sector
- source chips, one per entry in `sources`, labelled from `SOURCE_INFO`, each linking to its URL in a new tab
- a "Matched on: Holoke In Tarbaj" note when the project was placed by matching
- the summary, collapsed to 2 lines and expandable

*Sorting and filtering*
- Default order: amount, highest first, with projects that have no amount last.
- Filter chips by status and by source.

*Disclaimer at the bottom of the drawer:* "Projects are compiled from public documents. Card totals above are separate estimates."

**`SOURCE_INFO` sharing.** `SOURCE_INFO` currently lives in `scripts/hesabu/lib/sources.ts`. It moves to `src/constants/hesabu-sources.ts`, and the scraper imports it from there. The UI then has no dependency on `scripts/`.

### 7. Small fixes in the same files

- **`EquityAlert`**
  - Replace the hardcoded "Baringo" with the county's name, passed in as a prop.
  - Flag only wards below the threshold that are also in the bottom third by satisfaction, at most 3.
  - Join names as "A, B and C".
- **Dashboard footer:** "Last updated FY {county.fiscalYear}" mislabels the year being viewed. Change it to "Showing FY {fiscalYear}".

## Error handling

- **Loader**
  - If a county file is missing, or its county code isn't found among `HWard` cards, the loader warns and skips that county. Other counties still load.
  - Each county is loaded in its own transaction, so a failure leaves that county's previous rows in place.
  - A project with an empty title is skipped and counted in the report.
- **UI**
  - If the drawer's fetch fails, the drawer shows an inline error with a retry button.
  - If there are no projects for the selected year, the card shows the empty state.

## Testing

- **`location-matcher.test.ts`** (`npx tsx --test`), using real strings from the scrape:
  - "Holoke In Tarbaj" goes to Tarbaj.
  - "Wargadud" goes to the Tarbaj card, via the ward list.
  - A slash-named IEBC ward matches on either part: "Ganyure" matches "Wagalla/Ganyure".
  - "Mau Mau At Wagalla" goes to Wajir West, via Wagalla ward, if Wagalla is in the list.
  - "Wajir County" gives null, because of the county-name rule.
  - "education" does not match "Adu", because of whole-word matching.
  - A Tiaty project gives null, because two cards share Tiaty.
  - "Garba Tulla" goes to the Garba Tulla card, because card-name matching takes priority.
- **Loader:**
  - `--dry-run` against the 5 existing county files. Review the match report and spot-check about 10 placements per county by hand.
  - Then run a real load, and run it again to confirm the row counts don't change.
- **UI:** run the app.
  - Wajir and Baringo: card lines appear and the drawer opens with sources linking out.
  - The county-wide card works.
  - Switching the year changes the projects shown.
  - The equity alert shows the correct county name.

## Out of scope

- Changing the seeded card numbers.
- Claude-based location assignment. It could be added later if matching is too weak.
- Per-ward maps.
- Editing or flagging projects from the UI.
- Merging scraped projects with citizen reports.
