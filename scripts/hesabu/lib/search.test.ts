import { test } from "node:test"
import assert from "node:assert/strict"
import { searchWithFallback, tavilyDateParams, ProviderUnusableError, SearchProvider } from "./search"

const hit = { title: "t", url: "https://x", snippet: "" }

function provider(name: string, behaviour: () => Promise<typeof hit[]>): SearchProvider & { calls: number } {
  const p = { name, calls: 0, search: async () => { p.calls++; return behaviour() } }
  return p
}

test("uses the first provider that answers", async () => {
  const a = provider("A", async () => [hit])
  const b = provider("B", async () => [hit, hit])
  const r = await searchWithFallback([a, b], new Set(), "q", 5, {})
  assert.equal(r.provider, "A")
  assert.equal(b.calls, 0)
})

test("an account error (e.g. Brave 402) disables that provider for later queries", async () => {
  const a = provider("A", async () => { throw new ProviderUnusableError("402") })
  const b = provider("B", async () => [hit])
  const disabled = new Set<string>()
  assert.equal((await searchWithFallback([a, b], disabled, "q1", 5, {})).provider, "B")
  await searchWithFallback([a, b], disabled, "q2", 5, {})
  assert.equal(a.calls, 1)
  assert.ok(disabled.has("A"))
})

test("a transient error falls through for that query only", async () => {
  const a = provider("A", async () => { throw new Error("timeout") })
  const b = provider("B", async () => [hit])
  const disabled = new Set<string>()
  await searchWithFallback([a, b], disabled, "q1", 5, {})
  await searchWithFallback([a, b], disabled, "q2", 5, {})
  assert.equal(a.calls, 2)
  assert.equal(disabled.size, 0)
})

test("an empty answer is accepted, not treated as failure", async () => {
  const a = provider("A", async () => [])
  const b = provider("B", async () => [hit])
  const r = await searchWithFallback([a, b], new Set(), "q", 5, {})
  assert.deepEqual(r, { results: [], provider: "A" })
})

test("all providers failing returns no results", async () => {
  const a = provider("A", async () => { throw new Error("x") })
  assert.deepEqual(await searchWithFallback([a], new Set(), "q", 5, {}), { results: [], provider: null })
})

test("maps freshness to Tavily date parameters", () => {
  assert.deepEqual(tavilyDateParams("2025-07-01to2026-11-19"), { start_date: "2025-07-01", end_date: "2026-11-19" })
  assert.deepEqual(tavilyDateParams("pm"), { time_range: "month" })
  assert.deepEqual(tavilyDateParams(undefined), {})
  assert.deepEqual(tavilyDateParams("bogus"), {})
})
