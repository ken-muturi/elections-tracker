/**
 * Shared constants for election visualization — used by both
 * public-facing and admin-facing election pages.
 */

export const LEVEL_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  WARD:         { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
  CONSTITUENCY: { bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd" },
  COUNTY:       { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
  NATIONAL:     { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
  STATION:      { bg: "#fce7f3", color: "#9d174d", border: "#f9a8d4" },
}

export const LEVEL_LABEL: Record<string, string> = {
  WARD: "Ward",
  CONSTITUENCY: "Constituency",
  COUNTY: "County",
  NATIONAL: "National",
  STATION: "Station",
}

export const POSITION_ORDER = [
  "PRESIDENT",
  "GOVERNOR",
  "SENATOR",
  "WOMEN_REP",
  "MP",
  "MCA",
]

/**
 * Map drill-down level → API action to fetch the *next* level down.
 */
export const NEXT_ACTION: Record<string, string> = {
  NATIONAL: "COUNTY",
  COUNTY: "CONSTITUENCY",
  CONSTITUENCY: "WARD",
  WARD: "STATION",
}
