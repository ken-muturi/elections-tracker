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

export const AGGREGATION_LEVELS: AggregationLevel[] = ["WARD", "CONSTITUENCY", "COUNTY", "NATIONAL"]

export const AGGREGATION_LEVEL_LABEL: Record<AggregationLevel, string> = {
  WARD:         "Ward",
  CONSTITUENCY: "Constituency",
  COUNTY:       "County",
  NATIONAL:     "National",
}
