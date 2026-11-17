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
