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
