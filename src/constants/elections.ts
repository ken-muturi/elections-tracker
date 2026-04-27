import { AggregationLevel } from "@prisma/client"

export type PositionMeta = {
  label: string
  aggregationLevel: AggregationLevel
  description: string
}

/**
 * Well-known positions for a Kenyan general election.
 * These are SUGGESTIONS only — the admin can use any string as a position type.
 * Server-side validation only checks that type is non-empty and unique per election.
 */
export const KNOWN_POSITIONS: Record<string, PositionMeta> = {
  MCA:       { label: "Member of County Assembly", aggregationLevel: "WARD",         description: "Tallied at ward level" },
  MP:        { label: "Member of Parliament",       aggregationLevel: "CONSTITUENCY", description: "Tallied at constituency level" },
  WOMEN_REP: { label: "Women Representative",       aggregationLevel: "COUNTY",       description: "Tallied at county level" },
  SENATOR:   { label: "Senator",                    aggregationLevel: "COUNTY",       description: "Tallied at county level" },
  GOVERNOR:  { label: "Governor",                   aggregationLevel: "COUNTY",       description: "Tallied at county level" },
  PRESIDENT: { label: "President",                  aggregationLevel: "NATIONAL",     description: "Tallied at national level" },
}

export const AGGREGATION_LEVELS: AggregationLevel[] = ["POLLING_STATION", "WARD", "CONSTITUENCY", "COUNTY", "NATIONAL"]

export const AGGREGATION_LEVEL_LABEL: Record<AggregationLevel, string> = {
  POLLING_STATION: "Polling Station",
  WARD:         "Ward",
  CONSTITUENCY: "Constituency",
  COUNTY:       "County",
  NATIONAL:     "National",
}

// ─────────────────────────────────────────────────────────────────────────────
// Kenyan election form-type mapping
//
// A = Polling station (raw votes)
// B = Constituency/Ward aggregation
// C = Final declaration (County or National)
//
// The position type key maps to the form series, and the level suffix
// (A/B/C) is determined by the aggregation level.
// ─────────────────────────────────────────────────────────────────────────────

/** Form series number per position type (e.g. PRESIDENT → "34") */
export const FORM_SERIES: Record<string, string> = {
  PRESIDENT: "34",
  MP:        "35",
  WOMEN_REP: "36",
  GOVERNOR:  "37",
  SENATOR:   "38",
  MCA:       "33",
}

/**
 * Level suffix mapping.
 * POLLING_STATION → "A" (the physical form is per polling station)
 * WARD / CONSTITUENCY → "B" (tally / aggregation)
 * COUNTY / NATIONAL → "C" (final declaration)
 */
export const LEVEL_SUFFIX: Record<string, string> = {
  POLLING_STATION: "A",
  WARD:           "B",
  CONSTITUENCY:   "B",
  COUNTY:         "C",
  NATIONAL:       "C",
}

/**
 * Resolve the form type code for a position at a given hierarchy level.
 * e.g. getFormTypeForLevel("PRESIDENT", "POLLING_STATION") → "34A"
 *      getFormTypeForLevel("PRESIDENT", "COUNTY") → "34C"
 * Falls back to "Form X" for unknown position types.
 */
export function getFormTypeForLevel(positionType: string, level: string): string {
  const key = positionType.toUpperCase().replace(/\s+/g, "_")
  const series = FORM_SERIES[key]
  const suffix = LEVEL_SUFFIX[level] ?? "A"
  return series ? `${series}${suffix}` : `Form ${suffix}`
}

/**
 * Resolve the form type label for a given position type at polling-station level.
 * Kept for backwards compatibility — calls getFormTypeForLevel with POLLING_STATION.
 */
export function getFormType(positionType: string): string {
  return getFormTypeForLevel(positionType, "POLLING_STATION")
}

/**
 * Human-readable label for the form at a given level.
 * e.g. "Form 34A (President)" or "Form 34C (President)"
 */
export function getFormLabel(positionType: string, level = "POLLING_STATION"): string {
  const formType = getFormTypeForLevel(positionType, level)
  const meta = KNOWN_POSITIONS[positionType.toUpperCase().replace(/\s+/g, "_")]
  const label = meta?.label ?? positionType
  return `Form ${formType} (${label})`
}

/**
 * Tally levels per position type — which Form B/C levels exist per IEBC structure.
 * POLLING_STATION (Form A) is handled by the stream entry flow.
 *
 *  MCA (33):       33A → 33B Ward
 *  MP (35):        35A → 35B Constituency
 *  Women Rep (36): 36A → 36B Constituency → 36C County
 *  Governor (37):  37A → 37B Constituency → 37C County
 *  Senator (38):   38A → 38B Constituency → 38C County
 *  President (34): 34A → 34B Constituency → 34C National
 */
export const POSITION_TALLY_LEVELS: Record<string, AggregationLevel[]> = {
  MCA:       ["WARD"],
  MP:        ["CONSTITUENCY"],
  WOMEN_REP: ["CONSTITUENCY", "COUNTY"],
  GOVERNOR:  ["CONSTITUENCY", "COUNTY"],
  SENATOR:   ["CONSTITUENCY", "COUNTY"],
  PRESIDENT: ["CONSTITUENCY", "NATIONAL"],
}

/** Returns the valid Form B/C tally levels for a position type. */
export function getTallyLevelsForPosition(positionType: string): AggregationLevel[] {
  const key = positionType.toUpperCase().replace(/\s+/g, "_")
  return POSITION_TALLY_LEVELS[key] ?? ["CONSTITUENCY"]
}

/** Returns true if a position type has a tally form at the given level. */
export function positionHasTallyAtLevel(positionType: string, level: AggregationLevel): boolean {
  return getTallyLevelsForPosition(positionType).includes(level)
}
