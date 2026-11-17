import { test } from "node:test"
import assert from "node:assert/strict"
import { fmtKesShort, projectTotalLabel, projectLine, joinNames, pickEquityFlags, orFallback } from "./project-format"

test("fmtKesShort scales B / M / plain", () => {
  assert.equal(fmtKesShort(2_340_000_000), "KES 2.34B")
  assert.equal(fmtKesShort(45_200_000), "KES 45.2M")
  assert.equal(fmtKesShort(850_000), "KES 850,000")
})

test("totals never present a partial sum as complete", () => {
  assert.equal(projectTotalLabel({ key: "A", possibleDuplicates: 0, count: 9, withAmount: 7, totalAllocated: 45_200_000 }), "KES 45.2M (stated for 7 of 9)")
  assert.equal(projectTotalLabel({ key: "A", possibleDuplicates: 0, count: 3, withAmount: 3, totalAllocated: 45_200_000 }), "KES 45.2M")
  assert.equal(projectTotalLabel({ key: "A", possibleDuplicates: 0, count: 2, withAmount: 0, totalAllocated: 0 }), "amounts not stated")
})

test("projectLine handles empty and singular", () => {
  assert.equal(projectLine(undefined), "No documented projects yet")
  assert.equal(projectLine({ key: "A", possibleDuplicates: 0, count: 1, withAmount: 1, totalAllocated: 2_000_000 }), "📄 1 documented project · KES 2.0M")
  assert.equal(projectLine({ key: "A", possibleDuplicates: 0, count: 3, withAmount: 3, totalAllocated: 2_000_000 }), "📄 3 documented projects · KES 2.0M")
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

test("final review: orFallback keeps the page alive when a query fails", async () => {
  const errors: unknown[] = []
  const orig = console.error
  console.error = (...a: unknown[]) => { errors.push(a) }
  try {
    assert.deepEqual(await orFallback(Promise.reject(new Error("relation h_projects does not exist")), [], "projects"), [])
    assert.equal(errors.length, 1)
    assert.deepEqual(await orFallback(Promise.resolve([1]), [], "projects"), [1])
  } finally {
    console.error = orig
  }
})

test("possible duplicates are noted, and excluded from the 'of N' denominator", () => {
  // 9 rows, 1 is a possible duplicate (its amount already excluded server-side): 7 of the other 8 have amounts
  const s = { key: "A", count: 9, possibleDuplicates: 1, withAmount: 7, totalAllocated: 45_200_000 }
  assert.equal(projectTotalLabel(s), "KES 45.2M (stated for 7 of 8)")
  assert.equal(projectLine(s), "📄 9 documented projects · KES 45.2M (stated for 7 of 8) · 1 possible duplicate")
  assert.equal(projectLine({ ...s, possibleDuplicates: 2, withAmount: 7, count: 9 }), "📄 9 documented projects · KES 45.2M · 2 possible duplicates")
})
