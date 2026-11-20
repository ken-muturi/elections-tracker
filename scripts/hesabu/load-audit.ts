/**
 * Load Auditor-General findings (Hawkeye export) into h_audits / h_audit_findings.
 *
 *   npm run hesabu:load-audit                 # fetch HAWKEYE_FINDINGS_URL and load
 *   npm run hesabu:load-audit -- --dry-run    # parse and report, write nothing
 *   npm run hesabu:load-audit -- --file=path  # load a local copy of the JSON
 *
 * Upserts by (county, year, entity) and (audit, finding number) so finding ids — and the
 * citizen reports linked to them — survive re-runs. A fetch failure writes nothing.
 */
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import axios from "axios"
import { fileURLToPath } from "url"
import { PrismaClient } from "@prisma/client"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { HAWKEYE_FINDINGS_URL } from "./lib/hawkeye-source"
import { parseAuditFile } from "./processors/audit-rows"

const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes("--dry-run"),
    file: args.find((a) => a.startsWith("--file="))?.slice("--file=".length),
  }
}

async function main() {
  const { dryRun, file } = parseArgs()
  const raw: unknown = file
    ? JSON.parse(fs.readFileSync(file, "utf-8"))
    : (await axios.get(HAWKEYE_FINDINGS_URL, { timeout: 60_000 })).data

  const { audits, skipped } = parseAuditFile(raw)
  for (const s of skipped) console.warn(`⚠  skipped: ${s}`)

  let findings = 0
  let failed = 0
  for (const a of audits) {
    findings += a.findings.length
    if (dryRun) continue
    try {
      await prisma.$transaction(async (tx) => {
        const audit = await tx.hAudit.upsert({
          where: { countyCode_fiscalYear_entity: { countyCode: a.countyCode, fiscalYear: a.fiscalYear, entity: a.entity } },
          create: { countyCode: a.countyCode, fiscalYear: a.fiscalYear, entity: a.entity, opinion: a.opinion,
            totalFindings: a.totalFindings, sourceUrl: HAWKEYE_FINDINGS_URL },
          update: { opinion: a.opinion, totalFindings: a.totalFindings, sourceUrl: HAWKEYE_FINDINGS_URL, loadedAt: new Date() },
        })
        for (const f of a.findings) {
          await tx.hAuditFinding.upsert({
            where: { auditId_number: { auditId: audit.id, number: f.number } },
            create: { auditId: audit.id, ...f },
            update: { title: f.title, category: f.category, amountCited: f.amountCited, summary: f.summary },
          })
        }
        await tx.hAuditFinding.deleteMany({ where: { auditId: audit.id, number: { notIn: a.findings.map((f) => f.number) } } })
      }, { timeout: 60_000 })
    } catch (err) {
      failed++
      console.error(`✗ ${a.countyName}: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`${audits.length} audits · ${findings} findings · ${skipped.length} skipped${failed ? ` · ${failed} failed` : ""}`)
  console.log(dryRun ? "(dry run — nothing written)" : "✅ Audit load complete")
  if (failed) process.exitCode = 1
}

main()
  .catch((err) => {
    console.error("💥 Audit load failed (nothing written):", err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
