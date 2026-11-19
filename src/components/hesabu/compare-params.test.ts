import { test } from "node:test"
import assert from "node:assert/strict"
import { parseCompareParams, buildCompareHref } from "./compare-params"

const ctx = { years: ["2025/2026", "2024/2025"], countyCodes: ["001", "008", "030", "047", "042"] }

test("defaults", () => {
  assert.deepEqual(parseCompareParams({}, ctx), { view: "side", year: "2025/2026", counties: [], metric: "absorption" })
})

test("valid params pass through", () => {
  assert.deepEqual(
    parseCompareParams({ view: "rank", year: "2024/2025", counties: "008,030", metric: "devShare" }, ctx),
    { view: "rank", year: "2024/2025", counties: ["008", "030"], metric: "devShare" },
  )
})

test("unknown view and year fall back", () => {
  const p = parseCompareParams({ view: "grid", year: "1999/2000" }, ctx)
  assert.equal(p.view, "side")
  assert.equal(p.year, "2025/2026")
})

test("counties: unknown and duplicate codes dropped, spaces trimmed, max 4", () => {
  assert.deepEqual(parseCompareParams({ counties: "008, 999,008,030,047,042,001" }, ctx).counties, ["008", "030", "047", "042"])
  assert.deepEqual(parseCompareParams({ counties: "" }, ctx).counties, [])
})

test("array-valued params use the first value", () => {
  assert.equal(parseCompareParams({ view: ["rank", "side"] }, ctx).view, "rank")
})

test("blank metric falls back to absorption; other strings are kept for pickMetric to resolve", () => {
  assert.equal(parseCompareParams({ metric: "  " }, ctx).metric, "absorption")
  assert.equal(parseCompareParams({ metric: "sector:Health Services" }, ctx).metric, "sector:Health Services")
})

test("buildCompareHref round-trips through parseCompareParams", () => {
  const p = { view: "rank" as const, year: "2024/2025", counties: ["008", "030"], metric: "sector:Health Services" }
  const href = buildCompareHref(p)
  assert.ok(href.startsWith("/hesabu/compare?"))
  const raw = Object.fromEntries(new URL(href, "http://x").searchParams)
  assert.deepEqual(parseCompareParams(raw, ctx), p)
})

test("buildCompareHref omits empty counties and the default metric", () => {
  const href = buildCompareHref({ view: "side", year: "2025/2026", counties: [], metric: "absorption" })
  const q = new URL(href, "http://x").searchParams
  assert.equal(q.has("counties"), false)
  assert.equal(q.has("metric"), false)
})
