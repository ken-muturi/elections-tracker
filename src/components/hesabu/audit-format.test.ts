import { test } from "node:test"
import assert from "node:assert/strict"
import {
  AUDIT_NOTE, categoryLabel, countByCategory, auditForYear, topFindings,
  fmtAmountCited, shortFiscalYear, opinionPalette,
} from "./audit-format"

test("categoryLabel maps known keys and falls back to Other findings", () => {
  assert.equal(categoryLabel("opinion_basis"), "Reasons for the audit opinion")
  assert.equal(categoryLabel("lawfulness"), "Lawful and effective use of public money")
  assert.equal(categoryLabel("governance"), "Internal controls and governance")
  assert.equal(categoryLabel("emphasis_matter"), "Matters the auditor emphasised")
  assert.equal(categoryLabel("other_matter"), "Other matters")
  assert.equal(categoryLabel("something_new"), "Other findings")
})

test("countByCategory: display order, zero counts omitted, unknown keys merged last", () => {
  const f = (category: string) => ({ category })
  assert.deepEqual(
    countByCategory([f("lawfulness"), f("weird"), f("opinion_basis"), f("lawfulness"), f("also_weird")]),
    [
      { key: "opinion_basis", label: "Reasons for the audit opinion", count: 1 },
      { key: "lawfulness", label: "Lawful and effective use of public money", count: 2 },
      { key: "other", label: "Other findings", count: 2 },
    ],
  )
  assert.deepEqual(countByCategory([]), [])
})

test("auditForYear: exact year, latest earlier year, none before the first audit", () => {
  const audits = [{ fiscalYear: "2022/2023", id: "a" }, { fiscalYear: "2023/2024", id: "b" }]
  assert.equal(auditForYear(audits, "2023/2024")?.id, "b")
  assert.equal(auditForYear(audits, "2025/2026")?.id, "b")
  assert.equal(auditForYear(audits, "2022/2023")?.id, "a")
  assert.equal(auditForYear(audits, "2015/2016"), null)
  assert.equal(auditForYear([], "2025/2026"), null)
})

test("auditForYear keeps the first of two audits for the same year", () => {
  const audits = [{ fiscalYear: "2023/2024", id: "exec" }, { fiscalYear: "2023/2024", id: "assembly" }]
  assert.equal(auditForYear(audits, "2025/2026")?.id, "exec")
})

test("topFindings: reasons for the opinion first, then by number; never by amount; capped", () => {
  const rows = [
    { number: 1, category: "lawfulness", amountCited: 9e10 },
    { number: 2, category: "opinion_basis", amountCited: 1 },
    { number: 3, category: "governance", amountCited: null },
    { number: 4, category: "opinion_basis", amountCited: 5e9 },
    { number: 5, category: "lawfulness", amountCited: 2 },
    { number: 6, category: "lawfulness", amountCited: 3 },
  ]
  assert.deepEqual(topFindings(rows).map((r) => r.number), [2, 4, 1, 3, 5])
  assert.deepEqual(topFindings(rows, 2).map((r) => r.number), [2, 4])
})

test("fmtAmountCited", () => {
  assert.equal(fmtAmountCited(1_210_000_000), "Amount cited: KES 1.21B")
  assert.equal(fmtAmountCited(10_888_337_067), "Amount cited: KES 10.89B")
  assert.equal(fmtAmountCited(null), null)
  assert.equal(fmtAmountCited(0), null)
})

test("shortFiscalYear and opinionPalette", () => {
  assert.equal(shortFiscalYear("2023/2024"), "2023/24")
  assert.equal(shortFiscalYear("2023/24"), "2023/24")
  assert.equal(opinionPalette("Qualified"), "orange")
  assert.equal(opinionPalette("Adverse"), "red")
  assert.equal(opinionPalette("Disclaimer"), "red")
  assert.equal(opinionPalette("Unmodified"), "green")
  assert.equal(opinionPalette("Not stated"), "gray")
})

test("AUDIT_NOTE wording", () => {
  assert.match(AUDIT_NOTE, /not findings of wrongdoing until they are resolved/)
  assert.match(AUDIT_NOTE, /not added together/)
})
