import { test } from "node:test"
import assert from "node:assert/strict"
import { absorbedLabel, absorptionAlertText } from "./budget-text"

test("absorbedLabel uses the year being viewed", () => {
  assert.equal(absorbedLabel(58, "2023/2024"), "58% absorbed (FY 2023/2024)")
  assert.equal(absorbedLabel(null, "2023/2024"), "N/A% absorbed (FY 2023/2024)")
})

test("absorptionAlertText states the share of the budget spent, for the year viewed, with no unsourced claims", () => {
  const t = absorptionAlertText("2025/2026", 50, "KSh 3.23B")
  assert.equal(t, "In FY 2025/2026, 50% of the KSh 3.23B development budget was spent.")
  assert.doesNotMatch(t, /CADP|procurement/)
})
