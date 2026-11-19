/**
 * Builds kenya-wards.json from the IEBC-derived CSV in
 * https://github.com/pkiage/data-Kenya-Counties-Constituencies-Wards (no licence file; data is
 * IEBC public record). 47 counties · 290 constituencies · 1,450 wards.
 *
 * Usage: npx tsx scripts/hesabu/data/build-wards.ts <path-to-csv>
 */
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvPath = process.argv[2]
if (!csvPath) throw new Error("Usage: build-wards.ts <csv>")

const clean = (s: string) =>
  s.replace(/^﻿/, "").replace(/\s+/g, " ").trim().toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())

const lines = fs.readFileSync(csvPath, "utf-8").split(/\r?\n/).filter(Boolean)
const [, ...rows] = lines

type County = { countyCode: string; county: string; constituencies: { name: string; wards: string[] }[] }
const counties = new Map<string, County>()

for (const line of rows) {
  const [countyId, countyName, , constituency, , ward] = line.split(",")
  const code = countyId.replace(/^﻿/, "").trim().padStart(3, "0")
  const county = counties.get(code) ?? { countyCode: code, county: clean(countyName), constituencies: [] }
  counties.set(code, county)
  const consName = clean(constituency)
  let cons = county.constituencies.find((c) => c.name === consName)
  if (!cons) county.constituencies.push((cons = { name: consName, wards: [] }))
  cons.wards.push(clean(ward))
}

const out = {
  source: "https://github.com/pkiage/data-Kenya-Counties-Constituencies-Wards (IEBC)",
  generatedAt: new Date().toISOString().slice(0, 10),
  counties: [...counties.values()].sort((a, b) => a.countyCode.localeCompare(b.countyCode)),
}
const dest = path.join(__dirname, "kenya-wards.json")
fs.writeFileSync(dest, JSON.stringify(out, null, 1) + "\n")
const cons = out.counties.reduce((n, c) => n + c.constituencies.length, 0)
const wards = out.counties.reduce((n, c) => n + c.constituencies.reduce((m, k) => m + k.wards.length, 0), 0)
console.log(`Wrote ${dest}: ${out.counties.length} counties, ${cons} constituencies, ${wards} wards`)
