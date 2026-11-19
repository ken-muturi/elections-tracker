import { test } from "node:test"
import assert from "node:assert/strict"
import { carryOverReports } from "./carry-over"
import type { ExtractedReport } from "../lib/claude"

function report(title: string, refs: [string, string][], extra: Partial<ExtractedReport> = {}): ExtractedReport {
  return {
    title,
    fiscalYear: "2024/2025",
    sector: "Health Services",
    status: "unknown",
    summary: title,
    confidence: "reported",
    sourceUrl: refs[0][1],
    source: refs[0][0] as ExtractedReport["source"],
    sources: refs.map(([source, url]) => ({ source: source as never, url })),
    ...extra,
  }
}

const previous = {
  scrapedAt: "2026-11-01T00:00:00.000Z",
  reports: [
    report("CoB audit query", [["cob", "https://cob/1"]]),
    report("OAG finding", [["oag", "https://oag/1"]]),
    report("Tender only", [["tenders", "https://t/1"]]),
    report("Tender also in CoB", [["tenders", "https://t/2"], ["cob", "https://cob/2"]]),
  ],
}

test("carries over only reports from sources that did not run", () => {
  const { reports, counts } = carryOverReports(previous, ["cob"])
  assert.deepEqual(reports.map((r) => r.title), ["CoB audit query", "Tender also in CoB"])
  assert.deepEqual(counts, { cob: 2 })
})

test("a carried report keeps only the refs of the sources that did not run", () => {
  const { reports } = carryOverReports(previous, ["cob"])
  const merged = reports.find((r) => r.title === "Tender also in CoB")!
  assert.deepEqual(merged.sources, [{ source: "cob", url: "https://cob/2" }])
  assert.equal(merged.source, "cob")
  assert.equal(merged.sourceUrl, "https://cob/2")
})

test("marks carried reports with the date of the run that fetched them", () => {
  const { reports } = carryOverReports(previous, ["oag"])
  assert.equal(reports[0].carriedOverFrom, "2026-11-01T00:00:00.000Z")
})

test("a report carried twice keeps its original fetch date", () => {
  const prev = { scrapedAt: "2026-12-01T00:00:00.000Z", reports: [report("Old", [["oag", "u"]], { carriedOverFrom: "2026-10-01T00:00:00.000Z" })] }
  const { reports } = carryOverReports(prev, ["oag"])
  assert.equal(reports[0].carriedOverFrom, "2026-10-01T00:00:00.000Z")
})

test("does not mutate the previous reports", () => {
  carryOverReports(previous, ["cob"])
  assert.equal(previous.reports[3].sources!.length, 2)
  assert.equal(previous.reports[3].carriedOverFrom, undefined)
})

test("falls back to the single source tag for reports without sources[]", () => {
  const prev = { scrapedAt: "x", reports: [report("Legacy", [["news", "n"]], { sources: undefined })] }
  assert.equal(carryOverReports(prev, ["news"]).reports.length, 1)
})

test("no previous file or nothing failed carries nothing", () => {
  assert.deepEqual(carryOverReports(null, ["cob"]), { reports: [], counts: {} })
  assert.deepEqual(carryOverReports(previous, []), { reports: [], counts: {} })
})
