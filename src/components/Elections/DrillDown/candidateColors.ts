// Consistent per-candidate colors indexed by overall rank (0 = leader)
export const CANDIDATE_PALETTE = [
  "#C9D927", // lime    — rank 1  (matches brand leader highlight)
  "#2196f3", // blue    — rank 2
  "#f97316", // orange  — rank 3
  "#ef4444", // red     — rank 4
  "#8b5cf6", // violet  — rank 5
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f43f5e", // rose
  "#84cc16", // lime-400
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#14b8a6", // teal
]

// Colors that have insufficient contrast against white text — use dark text instead
const LIGHT_BG_COLORS = new Set(["#C9D927", "#84cc16", "#f59e0b"])

export function circleFgColor(bgColor: string): string {
  return LIGHT_BG_COLORS.has(bgColor) ? "#0f172a" : "white"
}

export function buildColorMap(
  candidates: { candidateId: string }[]
): Map<string, string> {
  const m = new Map<string, string>()
  candidates.forEach((c, i) => {
    m.set(c.candidateId, CANDIDATE_PALETTE[i % CANDIDATE_PALETTE.length])
  })
  return m
}
