import { test } from "node:test"
import assert from "node:assert/strict"
import { padCountyCode, normalizeFiscalYear, parseAuditFile } from "./audit-rows"

test("padCountyCode", () => {
  assert.equal(padCountyCode(1), "001")
  assert.equal(padCountyCode("8"), "008")
  assert.equal(padCountyCode(47), "047")
  assert.equal(padCountyCode(0), null)
  assert.equal(padCountyCode(48), null)
  assert.equal(padCountyCode("x"), null)
  assert.equal(padCountyCode(undefined), null)
})

test("normalizeFiscalYear", () => {
  assert.equal(normalizeFiscalYear("2023/24"), "2023/2024")
  assert.equal(normalizeFiscalYear("2023/2024"), "2023/2024")
  assert.equal(normalizeFiscalYear("2023-24"), null)
  assert.equal(normalizeFiscalYear(undefined), null)
})

const mombasa = {
  county_name: "Mombasa", county_code: 1, fiscal_year: "2023/24", entity: "County Executive",
  audit_opinion: "Qualified", total_findings: 3,
  findings: [
    { number: 1, title: "Inaccuracies in the Financial Statements", amount_kshs: 11643945.4, summary: "s1", category: "opinion_basis" },
    { number: 2, title: "Unexplained Voided Transactions", amount_kshs: 0, summary: "s2", category: "opinion_basis" },
    { number: 3, title: "  ", amount_kshs: 5, summary: "blank title", category: "lawfulness" },
    { title: "No number", amount_kshs: null, category: "" },
    { number: 1, title: "Duplicate number", amount_kshs: 1, summary: "dup", category: "governance" },
  ],
}

test("parseAuditFile maps a county and its findings", () => {
  const { audits, skipped } = parseAuditFile([mombasa])
  assert.deepEqual(skipped, [])
  const a = audits[0]
  assert.equal(a.countyCode, "001")
  assert.equal(a.fiscalYear, "2023/2024")
  assert.equal(a.entity, "County Executive")
  assert.equal(a.opinion, "Qualified")
  assert.equal(a.totalFindings, 3)
  assert.deepEqual(a.findings.map((f) => [f.number, f.title, f.category, f.amountCited]), [
    [1, "Inaccuracies in the Financial Statements", "opinion_basis", 11643945n],
    [2, "Unexplained Voided Transactions", "opinion_basis", null],
    [4, "No number", "other", null],
  ])
  assert.equal(a.findings[2].summary, "")
})

test("parseAuditFile skips malformed counties with a reason", () => {
  const { audits, skipped } = parseAuditFile([
    { ...mombasa, county_code: undefined },
    { ...mombasa, county_name: "Kwale", fiscal_year: "bad" },
    { ...mombasa, county_name: "Kilifi", findings: undefined },
    null,
  ])
  assert.equal(audits.length, 0)
  assert.equal(skipped.length, 4)
  assert.match(skipped[0], /Mombasa/)
})

test("parseAuditFile: non-array input, missing opinion and entity defaults", () => {
  assert.deepEqual(parseAuditFile({ nope: true }), { audits: [], skipped: ["file is not a list of counties"] })
  const { audits } = parseAuditFile([{ ...mombasa, audit_opinion: " ", entity: undefined, total_findings: undefined }])
  assert.equal(audits[0].opinion, "Not stated")
  assert.equal(audits[0].entity, "County Executive")
  assert.equal(audits[0].totalFindings, 3)
})

test("a county with no usable findings is skipped, so the loader can't delete all its findings", () => {
  const { audits, skipped } = parseAuditFile([
    { ...mombasa, findings: [] },
    { ...mombasa, county_name: "Kwale", county_code: 2, findings: [{ number: 1, title: "  " }, { title: "" }] },
  ])
  assert.equal(audits.length, 0)
  assert.equal(skipped.length, 2)
  assert.match(skipped[0], /Mombasa: no usable findings/)
})
