import { type ImportRow } from "./AgentAssignmentImport"

/**
 * Parse CSV text into ImportRow array.
 * Skips header row if present.
 */
export function parseCSV(csvText: string): ImportRow[] {
  const lines = csvText
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) return []

  const rows: ImportRow[] = []

  const firstLine = lines[0].toLowerCase()
  const hasHeader =
    firstLine.includes("email") || firstLine.includes("agent") || firstLine.includes("stream")
  const dataLines = hasHeader ? lines.slice(1) : lines

  for (const line of dataLines) {
    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""))
    if (parts.length < 2) continue

    rows.push({
      agentEmail: parts[0],
      streamCode: parts[1],
      pollingStationCode: parts[2] || undefined,
    })
  }

  return rows
}
