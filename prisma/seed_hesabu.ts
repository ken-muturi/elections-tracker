/**
 * Hesabu platform seed — Baringo County FY 2025/2026
 * Run: npx tsx prisma/seed_hesabu.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Hesabu data for Baringo County…")

  // ── County ────────────────────────────────────────────────────────────────
  const county = await prisma.hCounty.upsert({
    where: { code_fiscalYear: { code: "030", fiscalYear: "2025/2026" } },
    update: {},
    create: {
      name: "Baringo",
      code: "030",
      fiscalYear: "2025/2026",
      totalBudget: 9_459_567_317n,
      recurrentExpenditure: 5_788_600_834n,
      developmentExpenditure: 3_670_966_482n,
      equitableShare: 7_000_000_000n,
      revenueTarget: 9_193_000_000n,
      revenueCollected: 8_271_000_000n,
      devAbsorptionRate: 64.0,
      isDataAvailable: true,
      dataSource: "Baringo County Integrated Development Plan 2023-2027 & County Budget FY 2025/2026",
    },
  })
  console.log(`✅ County created: ${county.name} (${county.id})`)

  // ── Sectors ───────────────────────────────────────────────────────────────
  const sectors = [
    {
      name: "Agriculture & Livestock",
      icon: "🌾",
      description: "Crop production, livestock development, irrigation",
      allocatedAmount: 1_230_000_000n,
      spentAmount:    787_200_000n,
    },
    {
      name: "Health Services",
      icon: "🏥",
      description: "Hospitals, dispensaries, community health, NHIF",
      allocatedAmount: 1_890_000_000n,
      spentAmount:    1_436_400_000n,
    },
    {
      name: "Infrastructure & Public Works",
      icon: "🛣️",
      description: "Roads, bridges, public buildings",
      allocatedAmount: 1_560_000_000n,
      spentAmount:    905_000_000n,
    },
    {
      name: "Education & ICT",
      icon: "📚",
      description: "ECDE, polytechnics, bursaries, digital infrastructure",
      allocatedAmount: 680_000_000n,
      spentAmount:    476_000_000n,
    },
    {
      name: "Water & Environment",
      icon: "💧",
      description: "Water supply, sanitation, environmental conservation",
      allocatedAmount: 890_000_000n,
      spentAmount:    534_000_000n,
    },
    {
      name: "Lands & Physical Planning",
      icon: "🗺️",
      description: "Land surveying, spatial planning, housing",
      allocatedAmount: 420_000_000n,
      spentAmount:    218_000_000n,
    },
    {
      name: "County Administration",
      icon: "🏛️",
      description: "General administration, finance, HR",
      allocatedAmount: 1_840_000_000n,
      spentAmount:    1_472_000_000n,
    },
    {
      name: "Trade & Tourism",
      icon: "🏪",
      description: "Trade facilitation, tourism promotion, market development",
      allocatedAmount: 350_000_000n,
      spentAmount:    175_000_000n,
    },
    {
      name: "Other Programmes",
      icon: "📋",
      description: "Gender, youth, social protection, sports",
      allocatedAmount: 599_567_317n,
      spentAmount:    299_783_000n,
    },
  ]

  const sectorRecords: Record<string, string> = {}
  for (const s of sectors) {
    const existing = await prisma.hSector.findFirst({
      where: { countyId: county.id, name: s.name, fiscalYear: "2025/2026" },
    })
    const record = existing
      ? await prisma.hSector.update({ where: { id: existing.id }, data: s })
      : await prisma.hSector.create({ data: { ...s, countyId: county.id, fiscalYear: "2025/2026" } })
    sectorRecords[s.name] = record.id
    console.log(`  ✅ Sector: ${s.name}`)
  }

  // ── Wards ─────────────────────────────────────────────────────────────────
  const wards = [
    {
      name: "Baringo Central",
      subCounty: "Baringo Central",
      population: 42_350,
      totalProjects: 18,
      completedProjects: 12,
      pendingProjects: 4,
      stalledProjects: 2,
      citizenSatisfactionScore: 72,
    },
    {
      name: "Baringo North",
      subCounty: "Baringo North",
      population: 38_900,
      totalProjects: 15,
      completedProjects: 9,
      pendingProjects: 4,
      stalledProjects: 2,
      citizenSatisfactionScore: 68,
    },
    {
      name: "Eldama Ravine",
      subCounty: "Eldama Ravine",
      population: 56_400,
      totalProjects: 22,
      completedProjects: 16,
      pendingProjects: 4,
      stalledProjects: 2,
      citizenSatisfactionScore: 78,
    },
    {
      name: "Mogotio",
      subCounty: "Mogotio",
      population: 34_700,
      totalProjects: 14,
      completedProjects: 8,
      pendingProjects: 4,
      stalledProjects: 2,
      citizenSatisfactionScore: 65,
    },
    {
      name: "Tiaty East",
      subCounty: "Tiaty",
      population: 28_600,
      totalProjects: 10,
      completedProjects: 3,
      pendingProjects: 3,
      stalledProjects: 4,
      citizenSatisfactionScore: 38, // ⚠️ flagged
    },
    {
      name: "Tiaty West",
      subCounty: "Tiaty",
      population: 24_300,
      totalProjects: 9,
      completedProjects: 2,
      pendingProjects: 3,
      stalledProjects: 4,
      citizenSatisfactionScore: 32, // ⚠️ flagged
    },
  ]

  const wardRecords: Record<string, string> = {}
  for (const w of wards) {
    const existing = await prisma.hWard.findFirst({
      where: { countyId: county.id, name: w.name },
    })
    const record = existing
      ? await prisma.hWard.update({ where: { id: existing.id }, data: w })
      : await prisma.hWard.create({ data: { ...w, countyId: county.id } })
    wardRecords[w.name] = record.id
    console.log(`  ✅ Ward: ${w.name}`)
  }

  // ── Citizen Reports ───────────────────────────────────────────────────────
  const reports = [
    {
      ward: "Tiaty East",
      sector: "Water & Environment",
      title: "Borehole in Chemolingot non-functional for 8 months",
      description:
        "The borehole installed in FY 2024/2025 has been non-functional since October 2024. Community members are walking 15 km for water.",
      status: "UNRESOLVED" as const,
      votes: 47,
    },
    {
      ward: "Tiaty West",
      sector: "Health Services",
      title: "Tangulbei Dispensary lacks medicine for 3 months",
      description:
        "The dispensary has been without essential drugs including malaria medication since January 2025. Patients are being turned away.",
      status: "INVESTIGATING" as const,
      votes: 63,
    },
    {
      ward: "Tiaty East",
      sector: "Infrastructure & Public Works",
      title: "Access road to Chemolingot impassable during rains",
      description:
        "The 14 km road marked as completed in budget documents remains unpaved. Ambulances cannot reach the area during rainy season.",
      status: "UNRESOLVED" as const,
      votes: 38,
    },
    {
      ward: "Baringo North",
      sector: "Education & ICT",
      title: "ECDE classrooms at Nginyang Primary not completed",
      description:
        "Funds were allocated in FY 2024/2025 but only the foundation was laid. Children continue learning under trees.",
      status: "INVESTIGATING" as const,
      votes: 29,
    },
    {
      ward: "Eldama Ravine",
      sector: "Agriculture & Livestock",
      title: "Irrigation canal silted — farmers lost entire season",
      description:
        "The 3 km Eldama Ravine irrigation canal promised desilting has not been done. Over 200 farmers lost crops in the dry season.",
      status: "RESOLVED" as const,
      votes: 55,
    },
    {
      ward: "Mogotio",
      sector: "Water & Environment",
      title: "Mogotio water kiosk tariff doubled without notice",
      description:
        "Water kiosk tariff increased from KES 3 to KES 7 per jerrycan with no public participation. Article 201 violation.",
      status: "UNRESOLVED" as const,
      votes: 41,
    },
    {
      ward: "Baringo Central",
      sector: "Trade & Tourism",
      title: "Kabarnet market stalls allocated without public process",
      description:
        "Newly constructed market stalls were allocated to politically connected individuals without a public application process.",
      status: "INVESTIGATING" as const,
      votes: 22,
    },
    {
      ward: "Tiaty West",
      sector: "Infrastructure & Public Works",
      title: "Loruk-Tangulbei road funds absorbed but road untouched",
      description:
        "KES 45 million allocated for road works shows 100% absorption in budget documents but the road has no visible works.",
      status: "UNRESOLVED" as const,
      votes: 78,
    },
  ]

  for (const r of reports) {
    const wardId = wardRecords[r.ward]
    const sectorId = sectorRecords[r.sector]
    if (!wardId || !sectorId) {
      console.warn(`  ⚠️ Skipping report "${r.title}" — ward or sector not found`)
      continue
    }
    const existing = await prisma.hReport.findFirst({
      where: { countyId: county.id, title: r.title },
    })
    if (!existing) {
      await prisma.hReport.create({
        data: {
          countyId: county.id,
          wardId,
          sectorId,
          title: r.title,
          description: r.description,
          status: r.status,
          votes: r.votes,
        },
      })
    }
    console.log(`  ✅ Report: ${r.title.slice(0, 50)}…`)
  }

  console.log("\n🎉 Hesabu seed complete!")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
