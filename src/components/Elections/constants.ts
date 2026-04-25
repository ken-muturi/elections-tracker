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

/**
 * Returns the IEBC declaration form reference for the "Entered at Level" data.
 * Presidential results use Forms 34A/34B/34C; all other positions use 35A/35B.
 */
export function getIEBCFormRef(
  positionType: string,
  level: string,
): { form: string; label: string } | null {
  if (positionType === "PRESIDENT") {
    if (level === "NATIONAL")      return { form: "Form 34C", label: "National Tally Declaration" }
    if (level === "CONSTITUENCY")  return { form: "Form 34B", label: "Constituency Declaration" }
    if (level === "STATION")       return { form: "Form 34A", label: "Polling Station Declaration" }
  }
  const stationLevels = ["STATION", "STREAM"]
  if (stationLevels.includes(level))    return { form: "Form 35A", label: "Polling Station Declaration" }
  if (positionType === "GOVERNOR"   && level === "COUNTY")        return { form: "Form 35B", label: "County Tally Declaration" }
  if (positionType === "SENATOR"    && level === "COUNTY")        return { form: "Form 35B", label: "County Tally Declaration" }
  if (positionType === "WOMEN_REP"  && level === "COUNTY")        return { form: "Form 35B", label: "County Tally Declaration" }
  if (positionType === "MP"         && level === "CONSTITUENCY")  return { form: "Form 35B", label: "Constituency Declaration" }
  if (positionType === "MCA"        && level === "WARD")          return { form: "Form 35B", label: "Ward Declaration" }
  return null
}
