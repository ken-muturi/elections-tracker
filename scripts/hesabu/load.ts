/**
 * Load scraper output into h_projects.
 *   npm run hesabu:load                         # every county file in output/
 *   npm run hesabu:load -- --counties=Wajir     # named counties
 *   npm run hesabu:load -- --dry-run            # match report only, no writes
 * Replaces each county's rows in one transaction. Never touches citizen reports or ward cards.
 */
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import { fileURLToPath } from "url"
import { PrismaClient } from "@prisma/client"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { COUNTIES } from "./constants"
import { getCountyConstituencies } from "./lib/wards"
import { buildProjectRows } from "./processors/project-rows"
import type { ExtractedReport } from "./lib/claude"

const OUTPUT_DIR = path.resolve(__dirname, "output")
const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  const only = args.find((a) => a.startsWith("--counties="))?.slice(11).split(",").map((s) => s.trim().toLowerCase())
  return { only, dryRun: args.includes("--dry-run") }
}

async function main() {
  const { only, dryRun } = parseArgs()
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  let failed = 0

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, file), "utf-8")) as {
      county: { name: string; code: string }; scrapedAt: string; reports: ExtractedReport[]
    }
    const name = data.county?.name
    if (only && !only.includes(name?.toLowerCase())) continue
    const meta = COUNTIES.find((c) => c.name.toLowerCase() === name?.toLowerCase())
    if (!meta) { console.warn(`⚠  ${file}: unknown county "${name}" — skipped`); continue }

    try {
      const cards = await prisma.hWard.findMany({
        where: { county: { code: meta.code } },
        select: { name: true, subCounty: true },
        distinct: ["name"],
      })
      if (cards.length === 0) { console.warn(`⚠  ${meta.name}: no ward cards for code ${meta.code} — skipped`); continue }
      const constituencies = getCountyConstituencies(meta.code)
      if (constituencies.length === 0) console.warn(`⚠  ${meta.name}: no IEBC wards for ${meta.code} — card-name matching only`)

      const { rows, stats } = buildProjectRows(
        { countyCode: meta.code, countyName: meta.name, scrapedAt: data.scrapedAt, reports: data.reports }, cards, constituencies
      )
      const m = stats.byMethod
      console.log(
        `${meta.name.padEnd(10)} ${String(rows.length).padStart(4)} projects · ${stats.placed} placed ` +
        `(card-name ${m["card-name"]}, ward ${m.ward}, constituency ${m.constituency}) · ${stats.countyWide} county-wide · ` +
        `${stats.unknownFy} unknown FY · ${stats.duplicates} dup · ${stats.mergedContracts} merged (same contract) · ` +
        `${stats.possibleDuplicates} possible dup · ${stats.skippedEmpty} empty · ${stats.skippedAuditOnly} audit-only (Hawkeye)`
      )
      if (process.env.HESABU_LOAD_DEBUG) {
        console.table(rows.filter((r) => r.cardName).map((r) => ({ card: r.cardName, on: r.matchedOn, title: r.title.slice(0, 70) })))
        const byKey = new Map(rows.map((r) => [r.dedupKey, r]))
        for (const r of rows.filter((x) => x.possibleDuplicateOf))
          console.log(`  ≈ "${r.title.slice(0, 60)}" (${r.primarySource}) ~ "${byKey.get(r.possibleDuplicateOf!)?.title.slice(0, 60)}"`)
      }

      if (!dryRun) {
        await prisma.$transaction([
          prisma.hProject.deleteMany({ where: { countyCode: meta.code } }),
          prisma.hProject.createMany({ data: rows, skipDuplicates: true }),
        ])
      }
    } catch (err) {
      failed++
      console.error(`✗ ${meta.name}: ${err instanceof Error ? err.message : String(err)} — previous rows kept`)
    }
  }

  console.log(dryRun ? "\n(dry run — nothing written)" : "\n✅ Load complete")
  await prisma.$disconnect()
  if (failed) process.exit(1)
}

main().catch(async (err) => { console.error("💥", err); await prisma.$disconnect(); process.exit(1) })
