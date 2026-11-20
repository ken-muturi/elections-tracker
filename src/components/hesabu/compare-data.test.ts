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

test("audit count uses the latest audit up to the year; none gives null", () => {
  const audits = [{ countyCode: "030", fiscalYear: "2023/2024", findings: 25 }, { countyCode: "030", fiscalYear: "2026/2027", findings: 9 }]
  const [baringo, nairobi] = toComparisonCounties([row("030"), row("047")], null, audits, "2025/2026")
  assert.deepEqual(baringo.audit, { fiscalYear: "2023/2024", findings: 25 })
  assert.equal(nairobi.audit, null)
  assert.equal(toComparisonCounties([row("030")], null, audits, "2015/2016")[0].audit, null)
  assert.equal(toComparisonCounties([row("030")], null)[0].audit, null)
})
