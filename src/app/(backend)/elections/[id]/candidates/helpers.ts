import type { CsvRow, ColumnDef } from "./types"

/* ── Parse a single CSV line respecting quoted commas ────── */

export function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
      continue
    }
    current += ch
  }
  result.push(current.trim())
  return result
}

/* ── Parse an entire CSV file into CsvRows ──────────────── */

export function parseCsvFile(
  text: string,
  needsEntityId: boolean,
  aggregationLevel: string,
): { rows: CsvRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())

  if (lines.length < 2) {
    return {
      rows: [],
      errors: ["CSV must have a header row and at least one data row."],
    }
  }

  const header = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z_]/g, ""),
  )
  const nameIdx = header.findIndex((h) =>
    ["name", "fullname", "full_name", "candidate"].includes(h),
  )
  const partyIdx = header.findIndex((h) =>
    ["party", "party_name"].includes(h),
  )
  const entityIdx = header.findIndex((h) =>
    ["entityid", "entity_id", "entity", "ward", "constituency", "county"].includes(h),
  )

  const errors: string[] = []
  if (nameIdx === -1) errors.push("Missing required 'name' column in header row.")
  if (needsEntityId && entityIdx === -1) {
    errors.push(
      `Missing required 'entityId' column (needed for ${aggregationLevel}-level positions).`,
    )
  }
  if (errors.length) return { rows: [], errors }

  const rows: CsvRow[] = []
  const rowErrors: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const name = cols[nameIdx]?.trim()
    if (!name) {
      rowErrors.push(`Row ${i + 1}: Empty name — skipped.`)
      continue
    }
    if (needsEntityId && entityIdx >= 0 && !cols[entityIdx]?.trim()) {
      rowErrors.push(
        `Row ${i + 1}: Missing entityId for "${name}" — skipped.`,
      )
      continue
    }
    rows.push({
      name,
      party: partyIdx >= 0 ? (cols[partyIdx]?.trim() || "") : "",
      entityId: entityIdx >= 0 ? (cols[entityIdx]?.trim() || "") : "",
    })
  }

  if (rows.length === 0) {
    return {
      rows: [],
      errors: ["No valid data rows found in CSV.", ...rowErrors],
    }
  }

  return { rows, errors: rowErrors }
}

/* ── Build required-columns definition ──────────────────── */

export function getRequiredColumns(
  needsEntityId: boolean,
  aggregationLevel: string,
  entityLabel: string,
): ColumnDef[] {
  return needsEntityId
    ? [
        { header: "name", description: "Candidate full name", required: true },
        { header: "party", description: "Political party or Independent", required: false },
        { header: "entityId", description: entityLabel || "Geographic entity ID", required: true },
      ]
    : [
        { header: "name", description: "Candidate full name", required: true },
        { header: "party", description: "Political party or Independent", required: false },
      ]
}

/* ── Generate a template CSV download ────────────────────── */

export function downloadTemplate(columns: ColumnDef[], needsEntityId: boolean) {
  const cols = columns.map((c) => c.header).join(",")
  const sample = needsEntityId
    ? "John Doe,Party A,ward-001\nJane Smith,Independent,ward-002"
    : "John Doe,Party A\nJane Smith,Independent"
  const csv = cols + "\n" + sample
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "candidates-template.csv"
  a.click()
  URL.revokeObjectURL(url)
}
