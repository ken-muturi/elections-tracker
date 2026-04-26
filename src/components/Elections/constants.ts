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
 * Returns the IEBC declaration form reference for level-entered result data.
 *
 * Kenya IEBC form series:
 *   Form 34A — Presidential polling-station results
 *   Form 34B — Presidential constituency tally (RO signs at tallying centre)
 *   Form 34C — Presidential national tally declaration (IEBC chair)
 *   Form 35A — All other positions, polling-station results
 *   Form 35B — All other positions, tallying-centre declaration
 *              (constituency for MP; county for Governor/Senator/Women Rep; ward for MCA)
 *
 * The function always returns a value so callers never need a "Entered at Level" fallback.
 */
export function getIEBCFormRef(
  positionType: string,
  level: string,
): { form: string; label: string } {
  const type = positionType.toUpperCase()

  // ── Presidential (Form 34 series) ──────────────────────────────────────
  if (type === "PRESIDENT") {
    if (level === "STATION" || level === "POLLING_STATION")
      return { form: "Form 34A", label: "Polling Station Declaration" }
    if (level === "CONSTITUENCY")
      return { form: "Form 34B", label: "Constituency Tally" }
    if (level === "COUNTY")
      return { form: "Form 34B", label: "County Tally" }
    if (level === "NATIONAL")
      return { form: "Form 34C", label: "National Tally Declaration" }
  }

  // ── All other positions (Form 35 series) ───────────────────────────────
  if (level === "STATION" || level === "POLLING_STATION" || level === "STREAM")
    return { form: "Form 35A", label: "Polling Station Declaration" }

  if (level === "WARD")
    return { form: "Form 35B", label: "Ward Tally" }

  if (level === "CONSTITUENCY") {
    if (type === "MP") return { form: "Form 35B", label: "Constituency Declaration" }
    return { form: "Form 35B", label: "Constituency Tally" }
  }

  if (level === "COUNTY") {
    if (type === "GOVERNOR")   return { form: "Form 35B", label: "County Declaration — Governor" }
    if (type === "SENATOR")    return { form: "Form 35B", label: "County Declaration — Senator" }
    if (type === "WOMEN_REP")  return { form: "Form 35B", label: "County Declaration — Women Rep" }
    return { form: "Form 35B", label: "County Tally" }
  }

  if (level === "NATIONAL")
    return { form: "Form 35B", label: "National Tally" }

  // Catch-all for any custom level or position type
  return { form: "Form 35B", label: "Level Declaration" }
}
