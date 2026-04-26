/**
 * Hesabu Data Scraper — Main Orchestrator
 *
 * Usage:
 *   npx tsx scripts/hesabu/index.ts                              # All priority counties
 *   npx tsx scripts/hesabu/index.ts --counties=Baringo,Wajir     # Named counties
 *   npx tsx scripts/hesabu/index.ts --counties=all               # All 47
 *   npx tsx scripts/hesabu/index.ts --skip-cob                   # Skip CoB (faster)
 *
 * Output: scripts/hesabu/output/{county-name}.json
 */

import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { COUNTIES, PRIORITY_COUNTIES, CountyMeta } from "./constants"
import { scrapeCountyNews } from "./scrapers/news"
import { scrapeCoBForCounty } from "./scrapers/cob"
import { scrapeCountyBudgetSources } from "./scrapers/county-budget"
import { deduplicateReports } from "./processors/deduplicator"
import { ExtractedReport } from "./lib/claude"

const OUTPUT_DIR = path.resolve(__dirname, "output")

export interface CountyOutput {
  county: CountyMeta
  scrapedAt: string
  totalReportsFound: number
  reports: ExtractedReport[]
  sources: string[]
  errors: string[]
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

function writeOutput(output: CountyOutput) {
  ensureOutputDir()
  const filename = output.county.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + ".json"
  const filepath = path.join(OUTPUT_DIR, filename)
  fs.writeFileSync(filepath, JSON.stringify(output, null, 2), "utf-8")
  console.log(`\n💾 Saved: ${filepath}`)
}

function parseArgs(): { counties: string[]; skipCoB: boolean; skipCountySites: boolean } {
  const args = process.argv.slice(2)
  let counties = PRIORITY_COUNTIES
  let skipCoB = false
  let skipCountySites = false

  for (const arg of args) {
    if (arg.startsWith("--counties=")) {
      const val = arg.replace("--counties=", "")
      if (val === "all") {
        counties = COUNTIES.map((c) => c.name)
      } else {
        counties = val.split(",").map((c) => c.trim())
      }
    }
    if (arg === "--skip-cob") skipCoB = true
    if (arg === "--skip-county-sites") skipCountySites = true
  }

  return { counties, skipCoB, skipCountySites }
}

async function scrapeCounty(
  county: CountyMeta,
  opts: { skipCoB: boolean; skipCountySites: boolean }
): Promise<CountyOutput> {
  const errors: string[] = []
  const allReports: ExtractedReport[] = []
  const sources: string[] = []

  console.log(`\n${"=".repeat(60)}`)
  console.log(`🏛  COUNTY: ${county.name.toUpperCase()} (${county.code})`)
  console.log(`   Equitable share FY2025/26: KES ${(county.equitableShare2026 / 1e9).toFixed(1)}B`)
  console.log(`${"=".repeat(60)}`)

  // 1. News scraping
  try {
    const { reports, articles } = await scrapeCountyNews(county.name)
    allReports.push(...reports)
    sources.push(...articles.map((a) => a.url))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`News scraping failed: ${msg}`)
    console.error(`  ✗ News scraping error: ${msg}`)
  }

  // 2. Controller of Budget
  if (!opts.skipCoB) {
    try {
      const cobReports = await scrapeCoBForCounty(county.name)
      allReports.push(...cobReports)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`CoB scraping failed: ${msg}`)
      console.error(`  ✗ CoB error: ${msg}`)
    }
  }

  // 3. County websites + KIPPRA
  if (!opts.skipCountySites) {
    try {
      const siteReports = await scrapeCountyBudgetSources(county)
      allReports.push(...siteReports)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`County site scraping failed: ${msg}`)
      console.error(`  ✗ County site error: ${msg}`)
    }
  }

  // Deduplicate
  const deduplicated = deduplicateReports(allReports)

  console.log(`\n📊 ${county.name} summary:`)
  console.log(`   Raw reports:        ${allReports.length}`)
  console.log(`   After dedup:        ${deduplicated.length}`)
  console.log(`   Sources:            ${sources.length}`)
  console.log(`   Errors:             ${errors.length}`)

  return {
    county,
    scrapedAt: new Date().toISOString(),
    totalReportsFound: deduplicated.length,
    reports: deduplicated,
    sources: Array.from(new Set(sources)),
    errors,
  }
}

async function main() {
  console.log("🌍 Hesabu County Budget Transparency Scraper")
  console.log("━".repeat(60))

  const { counties: countyNames, skipCoB, skipCountySites } = parseArgs()

  const targetCounties = COUNTIES.filter((c) =>
    countyNames.some((n) => n.toLowerCase() === c.name.toLowerCase())
  )

  if (targetCounties.length === 0) {
    console.error(`❌ No matching counties found for: ${countyNames.join(", ")}`)
    console.log(`Available: ${COUNTIES.map((c) => c.name).join(", ")}`)
    process.exit(1)
  }

  console.log(`\nTargeting ${targetCounties.length} counties: ${targetCounties.map((c) => c.name).join(", ")}`)
  console.log(`Options: skipCoB=${skipCoB}, skipCountySites=${skipCountySites}`)

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("\n⚠  ANTHROPIC_API_KEY not set — running in regex-only mode")
    console.log("   Add to .env: ANTHROPIC_API_KEY=sk-ant-...")
  }

  ensureOutputDir()

  const allOutputs: CountyOutput[] = []

  for (const county of targetCounties) {
    const output = await scrapeCounty(county, { skipCoB, skipCountySites })
    writeOutput(output)
    allOutputs.push(output)
  }

  // Summary report
  const summaryPath = path.join(OUTPUT_DIR, "_summary.json")
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        counties: allOutputs.map((o) => ({
          name: o.county.name,
          code: o.county.code,
          reports: o.totalReportsFound,
          sources: o.sources.length,
          errors: o.errors.length,
        })),
        totals: {
          reports: allOutputs.reduce((s, o) => s + o.totalReportsFound, 0),
          sources: allOutputs.reduce((s, o) => s + o.sources.length, 0),
        },
      },
      null,
      2
    ),
    "utf-8"
  )

  console.log("\n" + "=".repeat(60))
  console.log("✅ SCRAPING COMPLETE")
  console.log(`   Counties processed: ${allOutputs.length}`)
  console.log(`   Total reports:      ${allOutputs.reduce((s, o) => s + o.totalReportsFound, 0)}`)
  console.log(`   Output directory:   ${OUTPUT_DIR}`)
  console.log(`   Summary:            ${summaryPath}`)
  console.log("=".repeat(60))
}

main().catch((err) => {
  console.error("💥 Fatal error:", err)
  process.exit(1)
})
