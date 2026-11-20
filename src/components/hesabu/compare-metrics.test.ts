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
    audit: { fiscalYear: "2023/2024", findings: 20 },
    ...over,
  }
}
const metric = (key: string, cs: ComparisonCounty[] = [county("001")]) => pickMetric(buildMetrics(cs), key)

test("buildMetrics: budget, performance, one figure per sector (sorted), then projects", () => {
  const keys = buildMetrics([county("001"), county("002", { sectors: [{ name: "Agriculture & Livestock", allocated: 1 }] })]).map((m) => m.key)
  assert.deepEqual(keys, [
    "totalBudget", "equitableShare", "devShare", "absorption", "revenuePerformance",
    "sector:Agriculture & Livestock", "sector:Health Services", "sector:Water & Environment",
    "projects", "auditFindings", "stalledProjects",
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

test("summarizeRanking: a highlighted county with no data for the year is named and listed under No data", async () => {
  const { summarizeRanking } = await import("./compare-metrics")
  const cs = [county("008", { name: "Wajir" }), county("030", { name: "Baringo", devAbsorptionRate: 64 })]
  const s = summarizeRanking(metric("absorption", cs), cs, ["004", "008"], [{ code: "004", name: "Tana River" }], "2025/2026")
  assert.deepEqual(s.rankLines.map((l) => `${l.name}: ${l.text}`), ["Tana River: no data for FY 2025/2026", "Wajir: 2nd of 2"])
  assert.deepEqual(s.noData, ["Tana River"])
})

test("summarizeRanking: N counts only counties with a value", async () => {
  const { summarizeRanking } = await import("./compare-metrics")
  const none = { state: "not-scraped" as const, total: 0, stalled: 0 }
  const cs = [
    county("008", { name: "Wajir", projects: { state: "scraped", total: 137, stalled: 1 } }),
    county("030", { name: "Baringo", projects: { state: "scraped", total: 51, stalled: 23 } }),
    county("047", { name: "Nairobi City", projects: none }),
    county("001", { name: "Mombasa", projects: none }),
  ]
  const s = summarizeRanking(metric("projects", cs), cs, ["008", "047"], [], "2025/2026")
  assert.equal(s.withData, 2)
  assert.deepEqual(s.rankLines.map((l) => `${l.name}: ${l.text}`), ["Wajir: 1st of 2", "Nairobi City: not yet scraped"])
  assert.deepEqual(s.notScraped, ["Nairobi City", "Mombasa"])
  assert.deepEqual(s.noData, [])
  assert.equal(s.projectsUnavailable, false)
})

test("summarizeRanking: failed project queries are reported as unavailable, not as No data", async () => {
  const { summarizeRanking } = await import("./compare-metrics")
  const un = { state: "unavailable" as const, total: 0, stalled: 0 }
  const cs = [county("008", { projects: un }), county("030", { projects: un })]
  const s = summarizeRanking(metric("projects", cs), cs, ["008"], [], "2025/2026")
  assert.equal(s.projectsUnavailable, true)
  assert.deepEqual(s.noData, [])
  assert.deepEqual(s.notScraped, [])
  assert.equal(s.rankLines[0].text, "project data unavailable")
})

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
