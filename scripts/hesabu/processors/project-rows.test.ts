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

const tender = (id: number, contract: string, title: string, amount: number): ExtractedReport =>
  rep({
    title, budgetAllocated: amount, source: "tenders",
    sourceUrl: `https://tenders.go.ke/tenders/${id}`,
    sources: [{ source: "tenders", url: `https://tenders.go.ke/tenders/${id}` }],
    summary: `Contract ${contract} awarded on 2025-11-14 to GAAMEY INVESTMENT LIMITED for KES ${amount} via Request for Quotations.`,
  })

test("same contract number + amount under two tender records → one row with both links", () => {
  const { rows, stats } = build([
    tender(279578, "011750", "Proposed Rehabilitation Of Shaletey Water Pan At Bute Ward In Wajir North", 3660659),
    tender(292484, "011750", "Proposed Rehabilitation Of Shaletey Water Pan At Bute In Wajir North Constituency", 3660659),
  ])
  assert.equal(rows.length, 1)
  assert.equal(stats.mergedContracts, 1)
  assert.deepEqual(rows[0].sources.map((s) => s.url), ["https://tenders.go.ke/tenders/279578", "https://tenders.go.ke/tenders/292484"])
})

test("same amount but different contract numbers are NOT merged (Tarbaj vs Eldas dumpsites)", () => {
  const { rows, stats } = build([
    tender(1, "012953", "Proposed Establishment Of Dumpsite At Tarbaj", 3990500),
    tender(2, "012961", "Proposed Establishment Ofdumpsite At Eldas", 3990500),
  ])
  assert.equal(rows.length, 2)
  assert.equal(stats.mergedContracts, 0)
})
test("items found only by Hawkeye are audit findings, not projects — skipped and counted", () => {
  const hawk = { source: "hawkeye" as const, url: "https://hawkeyekenya.com/x.json" }
  const { rows, stats } = build([
    rep({ title: "Unsupported Expenditure", source: "hawkeye", sources: [hawk] }),
    rep({ title: "Wargadud dispensary", sources: [{ source: "tenders", url: "https://tenders.go.ke/tenders/1" }, hawk] }),
  ])
  assert.deepEqual(rows.map((r) => r.title), ["Wargadud dispensary"])
  assert.equal(stats.skippedAuditOnly, 1)
})
