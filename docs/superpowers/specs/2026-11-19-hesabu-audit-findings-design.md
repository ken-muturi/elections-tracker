# Hesabu: Auditor-General findings (audit and accountability)

- **Date:** 2026-11-19
- **Status:** Draft, awaiting review
- **Branch:** `feat/hesabu-audit-findings`

## Goal

Show citizens what the Auditor-General has raised about each county's spending. Show it accurately: the findings are **queries, not proven wrongdoing**, and every figure is traceable to its source. Citizens can then confirm findings from what they see on the ground.

## Decisions

These were agreed in conversation on 2026-11-19.

1. **Built from audit findings and stalled projects.** These are shown as separate, sourced indicators. There is no combined "risk score".
2. **Placement.**
   - A new **Audit & accountability** section on the Budget Overview tab.
   - Two new figures on the compare page.
   - A separate **From the Auditor-General** block on the Citizen Reports tab.
3. **Headlines are counts, never money totals.** Amounts appear only on individual findings, labelled "amount cited".
4. **Audit findings are not citizen reports.** They are listed separately, never counted as citizen reports, and each one offers **"Have you seen this?"** That button starts a citizen report linked to the finding.
5. **Wording.** The page always says "queried" or "raised" by the Auditor-General, never "mismanaged", "stolen" or "lost".

## What the data supports

These facts were checked on 2026-11-19 against `https://hawkeyekenya.com/data/auditor-general-findings-2023-24.json`, which is the file the Hawkeye scraper already reads.

**The file**
- It has one object per county for all 47 counties. Each has `county_code` (a number), `fiscal_year` (`"2023/24"`), `entity` (`"County Executive"`), `audit_opinion` and `total_findings`.
- Each county also has a `findings[]` list. A finding has `number`, `title`, `amount_kshs`, `summary` (truncated at about 200 characters) and `category`.

**What can be used, and how**

| Fact | Consequence |
|---|---|
| All 47 opinions are **Qualified**, for FY 2023/24 only. | The section always names the audited year. It never implies the audit covers the year being viewed. |
| Finding categories: `lawfulness` 548, `opinion_basis` 221, `governance` 147, `emphasis_matter` 81, `other_matter` 46. These follow the sections of an Auditor-General report. | Headline counts are grouped by these categories, with plain-language labels. |
| A finding's `amount_kshs` is often a **context figure**, not the sum in question. Mombasa's "Unexplained Voided Transactions" carries KES 10.9B, which is its total payments for the year. Mombasa's 16 amounts add up to KES 40B on a KES 9B budget. | Amounts are **never summed**. Each is shown on its own finding as "amount cited", next to the text that explains it. |
| The county totals (`irregular_expenditure_kshs` and similar) overstate badly. Kilifi's "irregular" figure is KES 35.1B, about 3× its budget. Nairobi's pending bills are KES 118.8B. | The totals are **not used**. |
| The dashboard has seeded budget data for 13 counties. | The audit data is loaded for all 47 counties anyway, so it is ready when more counties are seeded. The compare page ranks among the counties it shows. |

## Design

### 1. Data model (one Prisma migration)

```prisma
/// Auditor-General audit of one county entity for one fiscal year
model HAudit {
  id            String   @id @default(cuid()) @db.VarChar(50)
  countyCode    String   @map("county_code") @db.VarChar(5)      // "001"
  fiscalYear    String   @map("fiscal_year") @db.VarChar(15)     // "2023/2024"
  entity        String   @db.VarChar(150)                        // "County Executive"
  opinion       String   @db.VarChar(30)                         // Qualified | Adverse | Disclaimer | Unmodified
  totalFindings Int      @map("total_findings")
  sourceUrl     String   @map("source_url") @db.VarChar(500)
  loadedAt      DateTime @default(now()) @map("loaded_at")
  findings      HAuditFinding[]

  @@unique([countyCode, fiscalYear, entity])
  @@map("h_audits")
}

model HAuditFinding {
  id          String   @id @default(cuid()) @db.VarChar(50)
  auditId     String   @map("audit_id") @db.VarChar(50)
  number      Int
  title       String   @db.VarChar(500)
  category    String   @db.VarChar(30)                           // Hawkeye category key
  amountCited BigInt?  @map("amount_cited")
  summary     String   @db.Text
  audit       HAudit   @relation(fields: [auditId], references: [id], onDelete: Cascade)
  reports     HReport[]

  @@unique([auditId, number])
  @@map("h_audit_findings")
}
```

`HReport` gets one optional link: `auditFindingId String? @map("audit_finding_id")`, with relation `auditFinding HAuditFinding? @relation(..., onDelete: SetNull)` and an index on it.

**Rules**
- **Codes and years:** `countyCode` is zero-padded to 3 digits. `fiscalYear` is normalised from `"2023/24"` to `"2023/2024"`, the format `HCounty` uses.
- **Re-running the loader:** it **upserts** each audit and each finding (by `(auditId, number)`) instead of deleting and re-inserting, so finding ids stay stable and citizen reports stay linked. A finding that disappears from the source is deleted, and any reports linked to it keep the report but lose the link (`SetNull`).

### 2. Loader: `npm run hesabu:load-audit`

**File:** `scripts/hesabu/load-audit.ts`. It is deterministic and makes no Claude calls.

**Steps**
1. Fetch the Hawkeye JSON from the constant `FINDINGS_URL`, already defined in `scrapers/hawkeye.ts`; move it to a shared place. `--file=<path>` reads a local copy instead.
2. Validate each county object. Skip objects with no code or no findings array, and warn when skipping.
3. Upsert `HAudit`, then upsert each finding by `(auditId, number)`. Delete findings whose number no longer appears.
4. Print a summary, e.g. `47 audits · 1,043 findings · 0 skipped`.

**Flags:** `--dry-run`. `cron.sh` runs the loader after the scrape, alongside `hesabu:load`.

**The existing Hawkeye scraper source:** the project loader (`hesabu:load`) skips report items whose **only** source is `hawkeye`. They are audit findings, not projects, and they would inflate the "documented projects" counts on ward and sector cards. The scraper itself is unchanged, and the items stay in the output files.

### 3. Pure helpers: `src/components/hesabu/audit-format.ts`

Pure functions with no I/O, covered by unit tests.

**`AUDIT_CATEGORIES`:** the display order and plain-language labels.

| Key | Label |
|---|---|
| `opinion_basis` | Reasons for the audit opinion |
| `lawfulness` | Lawful and effective use of public money |
| `governance` | Internal controls and governance |
| `emphasis_matter` | Matters the auditor emphasised |
| `other_matter` | Other matters |

An unknown key is labelled "Other findings" and sorted last.

**Functions**
- **`countByCategory(findings)`** returns `{ key, label, count }[]` in display order, and leaves out zero counts.
- **`auditForYear(audits, selectedYear)`** returns the latest audit whose year is ≤ the selected year, or `null`.
  - For selected years before 2023/24 it returns `null`, and the section says "No audit loaded for FY {year}".
  - Years are compared by their first 4 digits.
- **`topFindings(findings, n = 5)`** puts `opinion_basis` first (these are what made the opinion qualified), then sorts by `number`. It **never sorts by amount**, because amounts are context figures.
- **`fmtAmountCited(n)`** returns `"Amount cited: KES 1.21B"`, or `null` when the amount is null or 0.

### 4. Server functions (`src/services/Hesabu.ts`)

**`getAuditSummary(countyCode, fiscalYear)`**
- Returns:
  ```
  { audit: { fiscalYear, entity, opinion, totalFindings, sourceUrl } | null,
    counts: { key, label, count }[],
    top: AuditFindingRow[],
    stalledProjects: number | null }
  ```
- `stalledProjects` is the count of distinct `h_projects` rows with status `stalled` for the selected year. It is `null` when the county has never been scraped, matching the compare page's rule.
- The audit query and the project query each fall back with `orFallback`, so the dashboard still renders if either fails.

**`getAuditFindings(countyCode, fiscalYear)`**
- Returns every finding of the audit chosen by `auditForYear`, each with the number of linked citizen reports.
- It is called by the Citizen Reports block.

**`createReport`**
- Accepts an optional `auditFindingId`.
- It checks that the finding belongs to an audit of the same county, and rejects the report otherwise.

**`AuditFindingRow`:** `{ id, number, title, category, categoryLabel, amountCited: number | null, summary, linkedReports: number }`.

### 5. UI

**A. Budget Overview: "Audit & accountability" section**

It sits under the existing expenditure cards and above the absorption alert, which stays.

- **Headline line:** "Latest audit: FY 2023/24 · County Executive · **Qualified opinion**", followed by a link to the source.
- **One row of counts:**
  - **{total} findings**
  - **{n} reasons for the opinion**
  - **{n} on lawful use of public money**
  - **{n} documented stalled projects**. This shows "not yet scraped" when the value is `null`.
- **Most serious findings:** up to 5 from `topFindings`. Each shows the title, the category label, the amount cited (when there is one) and the summary, clamped to 2 lines.
- **"See all {total} findings →"** switches to the Citizen Reports tab and scrolls to the Auditor-General block.
- **Fixed note:** "Audit queries are issues raised by the Auditor-General. They are not findings of wrongdoing until they are resolved. Amounts are the figures each finding cites and are not added together."
- **Empty state:** "No audit loaded for FY {year}".

**B. Citizen Reports tab: "From the Auditor-General (FY 2023/24)" block**

It goes below the citizen reports list. It is a separate block with its own heading, and it is never mixed into the list or its counts.

- **Category filter chips:** All plus one per category, using the same chip style as the existing status filter.
- **Each finding shows:**
  - its number and title;
  - its category badge;
  - the amount cited;
  - the summary;
  - "{n} citizen reports" when any are linked;
  - a **"Have you seen this?"** button.
- **The button** opens the existing `ReportForm` with:
  - the title prefilled as "Re: {finding title}";
  - a read-only "Linked audit finding #{number}" line;
  - `auditFindingId` set.

  Ward and sector are still required, as for every citizen report.
- **Citizen report cards** linked to a finding show a small "Linked to audit finding #{n}" tag.
- **When the county has no citizen reports:** the empty-state text changes to "No citizen reports yet. Start with an Auditor-General finding below".

**C. Compare page**

- **New group, "Accountability",** with one new figure: **Audit findings (latest audit)**.
  - It is a count and neutral, so it is never marked "Highest".
  - Its note reads "FY 2023/24 audit". The year is taken from the data.
- **The existing "Documented stalled projects"** figure moves into this group.
- **`ComparisonCounty`** gains `audit: { fiscalYear: string; findings: number } | null`. It is filled from `HAudit` using `auditForYear`, from one extra query in `getCountyComparison`.

### 6. Fixes to existing labels

These were found in the screenshots on 2026-11-19.

- **`KPICards`:** "58% absorbed (FY 24/25)" is hard-coded. It becomes "58% absorbed (FY {county.fiscalYear})".
- **`BudgetOverview` absorption alert**
  - The text "In FY 2024/25, only {development expenditure} of the development budget was spent by Q4 … The county CADP notes … procurement delays" is hard-coded and states the budget as the amount spent.
  - It becomes: "In FY {fiscalYear}, {absorption}% of the KSh {development budget} development budget was spent."
  - The claim about the CADP is removed, because it has no source.

The footer's data-source text comes from the seed and is out of scope here; see "Out of scope".

## Error handling

- **Loader**
  - If the fetch fails, it exits non-zero and leaves the existing rows untouched.
  - A malformed county object is skipped with a warning.
  - Each county is loaded in its own transaction.
- **Dashboard**
  - If an audit query fails, the section shows "Audit data unavailable" and the rest of the page renders.
  - If the findings list fails to load in the Citizen Reports block, it shows an inline retry.
- **Reports**
  - A report submitted with an `auditFindingId` from a different county is rejected with "Invalid audit finding".

## Testing

- **`audit-format.test.ts`**
  - Counts in display order, with zero counts left out.
  - An unknown category is labelled "Other findings" and sorted last.
  - `auditForYear`: an exact match, the latest earlier audit, and `null` before the first audit.
  - `topFindings` puts `opinion_basis` first, never sorts by amount, and caps at n.
  - `fmtAmountCited` returns `null` for null and 0.
- **`load-audit` helpers** (pure functions, tested)
  - Code padding: `1` → `"001"`.
  - Year normalisation: `"2023/24"` → `"2023/2024"`.
  - Malformed objects are skipped.
- **Compare tests:** extend them for the `auditFindings` figure, including `null` audit giving "—".
- **Loader:** a dry run, then a real load: 47 audits. Run it again and check that the counts and finding ids are unchanged.
- **Browser**
  - Mombasa and Wajir: the section shows "Qualified opinion" and the counts. No money total appears anywhere.
  - Selecting FY 2015/16 shows "No audit loaded for FY 2015/2016".
  - Citizen Reports: the Auditor-General block, the filter chips, and "Have you seen this?" opening the form prefilled. Submitting creates a report with the link and the "Linked to audit finding" tag.
  - The compare page "Audit findings" figure ranks the 13 counties.
  - At 375px wide there is no sideways scroll.

## Out of scope

- **Summing or ranking money.** It needs a reliable "amount in question" field, which neither source has. A later Claude pass could extract it from the full finding text.
- **Auditor-General findings scraped through Claude from the Parliament library** (`oag` source). They stay in `h_projects` as they are. Deduplicating them against Hawkeye is a follow-up.
- **Audit years other than 2023/24.** The loader takes any Hawkeye file URL, so adding years is configuration.
- **The footer's seeded data-source text,** which names FY 2025/26 documents for older years.
- **Moderation of citizen reports.**
