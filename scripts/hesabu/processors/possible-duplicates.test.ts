import { test } from "node:test"
import assert from "node:assert/strict"
import { flagPossibleDuplicates, Flaggable } from "./possible-duplicates"

let n = 0
const row = (o: Partial<Flaggable>): Flaggable => ({
  fiscalYear: "2025/2026", title: "x", summary: "", budgetAllocated: null, primarySource: "cob",
  dedupKey: `k${n++}`, possibleDuplicateOf: null, ...o,
})

test("Kotulo-Laheley: CoB row (no amount) flagged as possible duplicate of the tender row", () => {
  const cob = row({ title: "Construction of 80,000M3 Kotulo-Laheley Water Pan and contingency borehole", primarySource: "cob" })
  const tender = row({
    title: "Proposed Construction Of 80,000m3 Kotulo-Laheley Water Pan  And Contigency Borehole For Resilient Farming At Tarbaj Sub",
    budgetAllocated: 94986757n, primarySource: "tenders", summary: "Contract 011742 awarded on 2025-10-31 to X",
  })
  assert.equal(flagPossibleDuplicates([cob, tender]), 1)
  assert.equal(cob.possibleDuplicateOf, tender.dedupKey) // the row with the amount stays primary
  assert.equal(tender.possibleDuplicateOf, null)
})

test("different places, same template title are not flagged (dumpsites)", () => {
  const a = row({ title: "Proposed Establishment Of Dumpsite At Tarbaj", budgetAllocated: 3990500n })
  const b = row({ title: "Proposed Establishment Ofdumpsite At Eldas", budgetAllocated: 3990500n })
  assert.equal(flagPossibleDuplicates([a, b]), 0)
})

test("two tenders with different contract numbers are never flagged", () => {
  const a = row({ title: "Routine maintenance of Hadado Ahmed Garweyne road phase", primarySource: "tenders", summary: "Contract 013417 awarded" })
  const b = row({ title: "Routine maintenance of Hadado Ahmed Garweyne road phase two", primarySource: "tenders", summary: "Contract 013419 awarded" })
  assert.equal(flagPossibleDuplicates([a, b]), 0)
})

test("amounts more than 2% apart are not flagged", () => {
  const a = row({ title: "Kotulo Laheley water pan borehole", budgetAllocated: 94_000_000n })
  const b = row({ title: "Kotulo Laheley water pan borehole works", budgetAllocated: 60_000_000n })
  assert.equal(flagPossibleDuplicates([a, b]), 0)
})

test("different fiscal years are not flagged", () => {
  const a = row({ title: "Kotulo Laheley water pan borehole" })
  const b = row({ title: "Kotulo Laheley water pan borehole", fiscalYear: "2024/2025" })
  assert.equal(flagPossibleDuplicates([a, b]), 0)
})

test("titles with fewer than 3 distinctive words are never flagged", () => {
  const a = row({ title: "Supply of drugs" })
  const b = row({ title: "Supply and delivery of drugs" })
  assert.equal(flagPossibleDuplicates([a, b]), 0)
})

test("template titles sharing only common words are not flagged (Boma Yangu estates, Digital Hubs)", () => {
  const rows = [
    "Boma Yangu Bofa Estate", "Boma Yangu Watamu Beach Road Estate", "Boma Yangu Tezo Estate", "Boma Yangu Mtwapa City Estate",
    "Huduma Jitume Digital Centre (Digital Hub)", "Huduma centre Malindi (Digital Hub)", "Matsangoni Digital hub (Digital Hub)",
    "Irregular Procurement of Internet Services", "Irregular Procurement of Consultancy Services", "Irregular Procurement of Fuel Services",
    "Sigoro Chief’s Office (Digital Hub)", "Kabimoi Chief’s Office ICT HUB (Digital Hub)",
  ].map((title) => row({ title, primarySource: "gpris" }))
  assert.equal(flagPossibleDuplicates(rows), 0)
})

test("Kotulo pair is still flagged among many other titles", () => {
  const others = ["Boma Yangu Tezo Estate", "Watamu Digital Hub (Digital Hub)", "Desilting of Basakorow water pan in Gurar ward"].map((title) => row({ title }))
  const cob = row({ title: "Construction of 80,000M3 Kotulo-Laheley Water Pan and contingency borehole" })
  const tender = row({ title: "Proposed Construction Of 80,000m3 Kotulo-Laheley Water Pan And Contigency Borehole For Resilient Farming At Tarbaj Sub", budgetAllocated: 94986757n, primarySource: "tenders" })
  assert.equal(flagPossibleDuplicates([...others, cob, tender]), 1)
  assert.equal(cob.possibleDuplicateOf, tender.dedupKey)
})
