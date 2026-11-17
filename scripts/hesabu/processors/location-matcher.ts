/**
 * Places a scraped project under a dashboard ward card using place names in its text.
 * Pure function — no I/O. See spec §2 for the rules.
 */
import type { ConstituencyWards } from "../lib/wards"

export interface Card { name: string; subCounty: string }
export interface MatchResult {
  cardName: string | null
  matchedOn: string | null
  method: "card-name" | "ward" | "constituency" | null
}

/** IEBC ward names that are common words — matching them causes false positives */
const GENERIC = new Set(["township", "central", "town", "majengo", "market", "mjini", "county", "headquarters"])

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()

/** Strip trailing "ward" / "sub county" / "constituency" so "Bute Ward" → "bute" */
const stripSuffix = (s: string) => s.replace(/\s+(ward|sub county|subcounty|constituency)$/, "")

/** Normalised aliases for a place name: split on / and -, plus a no-space form */
function aliases(name: string, countyNorm: string): string[] {
  const out = new Set<string>()
  for (const part of name.split(/[\/-]/)) {
    const n = stripSuffix(norm(part))
    if (!n) continue
    for (const a of [n, n.replace(/ /g, "")]) {
      if (a.replace(/ /g, "").length < 4 || a === countyNorm || GENERIC.has(a)) continue
      out.add(a)
    }
  }
  return [...out]
}

/** Whole-word match; also matches a no-space alias against two adjacent words ("garba tulla") */
function contains(text: string, alias: string): boolean {
  if (` ${text} `.includes(` ${alias} `)) return true
  const words = text.split(" ")
  for (let i = 0; i < words.length - 1; i++) if (words[i] + words[i + 1] === alias) return true
  return false
}

export function matchCard(
  project: { ward?: string; title: string; summary: string },
  cards: Card[],
  constituencies: ConstituencyWards[],
  countyName: string
): MatchResult {
  const countyNorm = norm(countyName)
  const cardAliases = cards.map((c) => ({ card: c, aliases: aliases(c.name, countyNorm) }))

  /** Distinct card names whose subCounty or name equals the constituency */
  const cardsFor = (constituency: string) => {
    const n = norm(constituency)
    return [...new Set(cards.filter((c) => norm(c.subCounty) === n || norm(c.name) === n).map((c) => c.name))]
  }

  const fields = [project.ward, project.title, project.summary].filter((f): f is string => !!f && !!f.trim())

  for (const field of fields) {
    const text = stripSuffix(norm(field))

    // 1. Card's own name — longest alias wins
    let best: { name: string; alias: string } | null = null
    for (const { card, aliases: as } of cardAliases)
      for (const a of as) if (contains(text, a) && (!best || a.length > best.alias.length)) best = { name: card.name, alias: a }
    if (best) return { cardName: best.name, matchedOn: best.alias, method: "card-name" }

    // 2. IEBC ward → constituency → card
    for (const cons of constituencies)
      for (const ward of cons.wards)
        for (const a of aliases(ward, countyNorm))
          if (contains(text, a)) {
            const names = cardsFor(cons.name)
            return names.length === 1
              ? { cardName: names[0], matchedOn: a, method: "ward" }
              : { cardName: null, matchedOn: a, method: null }
          }

    // 3. Constituency name → card
    for (const cons of constituencies)
      for (const a of aliases(cons.name, countyNorm))
        if (contains(text, a)) {
          const names = cardsFor(cons.name)
          return names.length === 1
            ? { cardName: names[0], matchedOn: a, method: "constituency" }
            : { cardName: null, matchedOn: a, method: null }
        }
  }

  return { cardName: null, matchedOn: null, method: null }
}
