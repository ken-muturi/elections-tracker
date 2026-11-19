/**
 * Hesabu Data Scraper — Main Orchestrator
 *
 * Usage:
 *   npx tsx scripts/hesabu/index.ts                              # All priority counties
 *   npx tsx scripts/hesabu/index.ts --counties=Baringo,Wajir     # Named counties
 *   npx tsx scripts/hesabu/index.ts --counties=all               # All 47
 *   npx tsx scripts/hesabu/index.ts --skip-cob                   # Skip CoB (faster)
 *   npx tsx scripts/hesabu/index.ts --skip=tenders,news          # Skip named sources
 *   npx tsx scripts/hesabu/index.ts --only=cob,oag               # Run only named sources
 *
 * Sources: news (Brave search), cob (Controller of Budget), oag (Auditor-General via
 * Parliament library), tenders (tenders.go.ke contracts), bajeti (Treasury Bajeti Yetu),
 * gpris (GPRIS), hawkeye (Hawkeye Kenya audit findings, secondary), county-sites.
 * Not scraped: delivery.go.ke (robots.txt + noai, API key needed), siviq.top (no open data),
 * oagkenya.go.ke (503 — OAG reports are read from the Parliament library instead).
 *
 * Output: scripts/hesabu/output/{county-name}.json
 */

import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { COUNTIES, PRIORITY_COUNTIES, CountyMeta } from "./constants"
import { scrapeCountyNews } from "./scrapers/news"
import { scrapeCoBForCounty } from "./scrapers/cob"
import { scrapeCountyBudgetSources } from "./scrapers/county-budget"
import { scrapeTendersForCounty } from "./scrapers/tenders"
import { scrapeGprisForCounty } from "./scrapers/gpris"
import { scrapeBajetiForCounty } from "./scrapers/bajeti"
import { scrapeOagForCounty } from "./scrapers/oag"
import { scrapeHawkeyeForCounty } from "./scrapers/hawkeye"
import { deduplicateReports } from "./processors/deduplicator"
import { carryOverReports, PreviousOutput } from "./processors/carry-over"
import { ExtractedReport } from "./lib/claude"
import { SOURCE_KEYS, SourceKey, SourceCoverage, SOURCE_INFO } from "./lib/sources"

const OUTPUT_DIR = path.resolve(__dirname, "output")

export interface CountyOutput {
  county: CountyMeta
  scrapedAt: string
  totalReportsFound: number
  /** What each source returned for this county — not every source covers every county */
  coverage: Record<SourceKey, SourceCoverage>
  /** Report count per source after dedup (a merged report counts for each source it came from) */
  reportsBySource: Partial<Record<SourceKey, number>>
  reports: ExtractedReport[]
  sources: string[]
  errors: string[]
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

function outputPath(county: CountyMeta): string {
  return path.join(OUTPUT_DIR, county.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + ".json")
}

/** The county's last written output, or null if there is none or it can't be read */
function readPreviousOutput(county: CountyMeta): PreviousOutput | null {
  try {
    const prev = JSON.parse(fs.readFileSync(outputPath(county), "utf-8"))
    return Array.isArray(prev?.reports) && typeof prev?.scrapedAt === "string" ? prev : null
  } catch {
    return null
  }
}

function writeOutput(output: CountyOutput) {
  ensureOutputDir()
  const filepath = outputPath(output.county)
  fs.writeFileSync(filepath, JSON.stringify(output, null, 2), "utf-8")
  console.log(`\n💾 Saved: ${filepath}`)
}


function parseArgs(): { counties: string[]; skip: Set<SourceKey> } {
  const args = process.argv.slice(2)
  let counties = PRIORITY_COUNTIES
  const skip = new Set<SourceKey>()
  const parseKeys = (v: string) =>
    v.split(",").map((k) => k.trim()).filter((k): k is SourceKey => {
      if ((SOURCE_KEYS as readonly string[]).includes(k)) return true
      console.warn(`⚠  Unknown source "${k}" (valid: ${SOURCE_KEYS.join(", ")})`)
      return false
    })

  for (const arg of args) {
    if (arg.startsWith("--counties=")) {
      const val = arg.replace("--counties=", "")
      if (val === "all") {
        counties = COUNTIES.map((c) => c.name)
      } else {
        counties = val.split(",").map((c) => c.trim())
      }
    }
    // Back-compat flags
    if (arg === "--skip-cob") skip.add("cob")
    if (arg === "--skip-county-sites") skip.add("county-sites")
    if (arg.startsWith("--skip=")) parseKeys(arg.slice(7)).forEach((k) => skip.add(k))
    if (arg.startsWith("--only=")) {
      const only = new Set(parseKeys(arg.slice(7)))
      SOURCE_KEYS.filter((k) => !only.has(k)).forEach((k) => skip.add(k))
    }
  }

  return { counties, skip }
}

async function scrapeCounty(county: CountyMeta, skip: Set<SourceKey>): Promise<CountyOutput> {
  const errors: string[] = []
  const allReports: ExtractedReport[] = []
  const sources: string[] = []
  const coverage = {} as Record<SourceKey, SourceCoverage>

  console.log(`\n${"=".repeat(60)}`)
  console.log(`🏛  COUNTY: ${county.name.toUpperCase()} (${county.code})`)
  console.log(`   Equitable share FY2025/26: KES ${(county.equitableShare2026 / 1e9).toFixed(1)}B`)
  console.log(`${"=".repeat(60)}`)

  const steps: { key: SourceKey; label: string; run: () => Promise<ExtractedReport[]> }[] = [
    {
      key: "news",
      label: "News scraping",
      run: async () => {
        const { reports, articles } = await scrapeCountyNews(county.name)
        sources.push(...articles.map((a) => a.url))
        return reports
      },
    },
    { key: "cob", label: "Controller of Budget", run: () => scrapeCoBForCounty(county.name) },
    { key: "oag", label: "Auditor-General", run: () => scrapeOagForCounty(county) },
    { key: "tenders", label: "tenders.go.ke contracts", run: () => scrapeTendersForCounty(county) },
    { key: "bajeti", label: "Bajeti Yetu", run: () => scrapeBajetiForCounty(county) },
    { key: "gpris", label: "GPRIS", run: () => scrapeGprisForCounty(county) },
    { key: "hawkeye", label: "Hawkeye", run: () => scrapeHawkeyeForCounty(county) },
    { key: "county-sites", label: "County site scraping", run: () => scrapeCountyBudgetSources(county) },
  ]

  for (const step of steps) {
    if (skip.has(step.key)) {
      coverage[step.key] = { status: "skipped", reports: 0 }
      continue
    }
    try {
      const reports = await step.run()
      for (const r of reports) {
        r.source = step.key
        r.sources = [{ source: step.key, url: r.sourceUrl }]
      }
      allReports.push(...reports)
      sources.push(...reports.map((r) => r.sourceUrl))
      coverage[step.key] = { status: reports.length > 0 ? "found" : "no-data", reports: reports.length }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${step.label} failed: ${msg}`)
      coverage[step.key] = { status: "error", reports: 0, error: msg }
      console.error(`  ✗ ${step.label} error: ${msg}`)
    }
  }

  // Safeguard: sources that failed or were skipped keep their items from the previous run.
  // Carried items go last so a fresh copy of the same item (from a source that did run) wins the merge.
  const notRun = SOURCE_KEYS.filter((k) => coverage[k].status === "error" || coverage[k].status === "skipped")
  const carried = carryOverReports(readPreviousOutput(county), notRun)
  for (const [key, n] of Object.entries(carried.counts) as [SourceKey, number][]) coverage[key].carriedOver = n
  allReports.push(...carried.reports)

  // Deduplicate
  const deduplicated = deduplicateReports(allReports)

  const reportsBySource: Partial<Record<SourceKey, number>> = {}
  for (const r of deduplicated) {
    for (const key of new Set((r.sources ?? []).map((s) => s.source))) {
      reportsBySource[key] = (reportsBySource[key] ?? 0) + 1
    }
  }

  console.log(`\n📊 ${county.name} summary:`)
  console.log(`   Raw reports:        ${allReports.length} (${carried.reports.length} carried over)`)
  console.log(`   After dedup:        ${deduplicated.length}`)
  console.log(`   Sources:            ${sources.length}`)
  console.log(`   Errors:             ${errors.length}`)
  console.log(`   Coverage:`)
  for (const key of SOURCE_KEYS) {
    const c = coverage[key]
    const icon = { found: "✓", "no-data": "–", error: "✗", skipped: "·" }[c.status]
    const kept = c.carriedOver ? ` — kept ${c.carriedOver} from previous run` : ""
    console.log(`     ${icon} ${key.padEnd(13)} ${c.status === "found" ? `${c.reports} reports` : c.status}${kept}`)
  }

  return {
    county,
    scrapedAt: new Date().toISOString(),
    totalReportsFound: deduplicated.length,
    coverage,
    reportsBySource,
    reports: deduplicated,
    sources: Array.from(new Set(sources)),
    errors,
  }
}

async function main() {
  console.log("🌍 Hesabu County Budget Transparency Scraper")
  console.log("━".repeat(60))

  const { counties: countyNames, skip } = parseArgs()

  const targetCounties = COUNTIES.filter((c) =>
    countyNames.some((n) => n.toLowerCase() === c.name.toLowerCase())
  )

  if (targetCounties.length === 0) {
    console.error(`❌ No matching counties found for: ${countyNames.join(", ")}`)
    console.log(`Available: ${COUNTIES.map((c) => c.name).join(", ")}`)
    process.exit(1)
  }

  console.log(`\nTargeting ${targetCounties.length} counties: ${targetCounties.map((c) => c.name).join(", ")}`)
  console.log(`Sources: ${SOURCE_KEYS.filter((k) => !skip.has(k)).join(", ")}`)

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("\n⚠  ANTHROPIC_API_KEY not set — running in regex-only mode")
    console.log("   Add to .env: ANTHROPIC_API_KEY=sk-ant-...")
  }

  ensureOutputDir()

  const allOutputs: CountyOutput[] = []

  for (const county of targetCounties) {
    const output = await scrapeCounty(county, skip)
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
          coverage: Object.fromEntries(SOURCE_KEYS.map((k) => [k, o.coverage[k].status])),
          reportsBySource: o.reportsBySource,
        })),
        sourceInfo: SOURCE_INFO,
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
