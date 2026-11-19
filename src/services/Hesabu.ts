"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import type { ProjectCardSummary } from "@/components/hesabu/project-format"
import { orFallback } from "@/components/hesabu/project-format"
import { toComparisonCounties, type ProjectCounts } from "@/components/hesabu/compare-data"
import type { ComparisonCounty } from "@/components/hesabu/compare-metrics"
// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type HReportStatus = "UNRESOLVED" | "INVESTIGATING" | "RESOLVED"

export type CountySummary = {
  id: string
  name: string
  code: string
  fiscalYear: string
  isDataAvailable: boolean
}

export type CountyFull = {
  id: string
  name: string
  code: string
  fiscalYear: string
  totalBudget: bigint
  recurrentExpenditure: bigint
  developmentExpenditure: bigint
  equitableShare: bigint
  revenueTarget: bigint
  revenueCollected: bigint
  devAbsorptionRate: number | null
  isDataAvailable: boolean
  dataSource: string | null
  sectors: SectorData[]
  wards: WardData[]
}

export type SectorData = {
  id: string
  name: string
  icon: string | null
  description: string | null
  allocatedAmount: bigint
  spentAmount: bigint
  fiscalYear: string
}

export type WardData = {
  id: string
  name: string
  subCounty: string
  population: number
  totalProjects: number
  completedProjects: number
  pendingProjects: number
  stalledProjects: number
  citizenSatisfactionScore: number
}

export type ReportData = {
  id: string
  title: string
  description: string | null
  status: HReportStatus
  votes: number
  createdAt: Date
  ward: { id: string; name: string; subCounty: string }
  sector: { id: string; name: string; icon: string | null }
}

export type CreateReportInput = {
  countyId: string
  wardId: string
  sectorId: string
  title: string
  description?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// County queries
// ─────────────────────────────────────────────────────────────────────────────

/** All counties — id/name/code/fiscal-year only, for the county selector. */
export const getAllCounties = async (): Promise<CountySummary[]> => {
  try {
    return await prisma.hCounty.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        fiscalYear: true,
        isDataAvailable: true,
      },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Full county detail including sectors and wards. */
export const getCountyById = async (id: string): Promise<CountyFull | null> => {
  try {
    const county = await prisma.hCounty.findUnique({
      where: { id },
      include: {
        sectors: { orderBy: { allocatedAmount: "desc" } },
        wards: { orderBy: { name: "asc" } },
      },
    })
    return county as CountyFull | null
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** County by code + fiscal year (useful for URL params). */
export const getCountyByCode = async (
  code: string,
  fiscalYear = "2025/2026",
): Promise<CountyFull | null> => {
  try {
    const county = await prisma.hCounty.findFirst({
      where: { code, fiscalYear },
      include: {
        sectors: { orderBy: { allocatedAmount: "desc" } },
        wards: { orderBy: { name: "asc" } },
      },
    })
    return county as CountyFull | null
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** All fiscal years available for a given county code, descending. */
export const getAvailableFiscalYears = async (code: string): Promise<string[]> => {
  try {
    const records = await prisma.hCounty.findMany({
      where: { code, isDataAvailable: true },
      orderBy: { fiscalYear: "desc" },
      select: { fiscalYear: true },
    })
    return records.map((r) => r.fiscalYear)
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export type TrendPoint = {
  fiscalYear: string
  /** Short label for chart x-axis, e.g. "13/14" */
  label: string
  totalBudget: number
  developmentExpenditure: number
  recurrentExpenditure: number
  equitableShare: number
  devAbsorptionRate: number | null
  revenueCollected: number
}

/**
 * Multi-year trend data for chart display.
 * All monetary values are in KES millions (to keep chart numbers readable).
 */
export const getHistoricalTrend = async (code: string): Promise<TrendPoint[]> => {
  try {
    const records = await prisma.hCounty.findMany({
      where: { code, isDataAvailable: true },
      orderBy: { fiscalYear: "asc" },
      select: {
        fiscalYear: true,
        totalBudget: true,
        developmentExpenditure: true,
        recurrentExpenditure: true,
        equitableShare: true,
        devAbsorptionRate: true,
        revenueCollected: true,
      },
    })
    return records.map((r) => ({
      fiscalYear: r.fiscalYear,
      label: r.fiscalYear.replace(/20(\d{2})\/20(\d{2})/, "$1/$2"),
      totalBudget:            Math.round(Number(r.totalBudget) / 1_000_000),
      developmentExpenditure: Math.round(Number(r.developmentExpenditure) / 1_000_000),
      recurrentExpenditure:   Math.round(Number(r.recurrentExpenditure) / 1_000_000),
      equitableShare:         Math.round(Number(r.equitableShare) / 1_000_000),
      revenueCollected:       Math.round(Number(r.revenueCollected) / 1_000_000),
      devAbsorptionRate:      r.devAbsorptionRate,
    }))
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export type CountyOption = { code: string; name: string };

/** Unique counties that have at least one year of data, sorted by name. */
export const getUniqueCounties = async (): Promise<CountyOption[]> => {
  try {
    const records = await prisma.hCounty.findMany({
      where: { isDataAvailable: true },
      distinct: ["code"],
      orderBy: { name: "asc" },
      select: { code: true, name: true },
    });
    return records;
  } catch (error) {
    throw new Error(handleReturnError(error));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Ward queries
// ─────────────────────────────────────────────────────────────────────────────

export const getWardsByCounty = async (countyId: string): Promise<WardData[]> => {
  try {
    return await prisma.hWard.findMany({
      where: { countyId },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Citizen reports
// ─────────────────────────────────────────────────────────────────────────────

export const getReportsByCounty = async (
  countyId: string,
  status?: HReportStatus,
): Promise<ReportData[]> => {
  try {
    return await prisma.hReport.findMany({
      where: { countyId, ...(status ? { status } : {}) },
      include: {
        ward: { select: { id: true, name: true, subCounty: true } },
        sector: { select: { id: true, name: true, icon: true } },
      },
      orderBy: { votes: "desc" },
    }) as ReportData[]
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const createReport = async (input: CreateReportInput): Promise<ReportData> => {
  try {
    if (!input.title.trim()) throw new Error("Report title is required.")
    if (!input.countyId || !input.wardId || !input.sectorId)
      throw new Error("County, ward, and sector are required.")

    const report = await prisma.hReport.create({
      data: {
        countyId: input.countyId,
        wardId: input.wardId,
        sectorId: input.sectorId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        status: "UNRESOLVED",
        votes: 0,
      },
      include: {
        ward: { select: { id: true, name: true, subCounty: true } },
        sector: { select: { id: true, name: true, icon: true } },
      },
    })
    return report as ReportData
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Voting
// ─────────────────────────────────────────────────────────────────────────────

export const voteOnReport = async (
  reportId: string,
  fingerprint: string,
): Promise<{ newVoteCount: number; alreadyVoted: boolean }> => {
  try {
    if (!reportId || !fingerprint) throw new Error("Invalid parameters.")

    // Check for existing vote
    const existing = await prisma.hVote.findUnique({
      where: { reportId_fingerprint: { reportId, fingerprint } },
    })
    if (existing) return { newVoteCount: -1, alreadyVoted: true }

    // Upsert vote + increment count atomically
    await prisma.$transaction([
      prisma.hVote.create({ data: { reportId, fingerprint } }),
      prisma.hReport.update({
        where: { id: reportId },
        data: { votes: { increment: 1 } },
      }),
    ])

    const updated = await prisma.hReport.findUnique({
      where: { id: reportId },
      select: { votes: true },
    })
    return { newVoteCount: updated?.votes ?? 0, alreadyVoted: false }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scraped projects (h_projects) — drill-down behind ward cards
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectRowData = {
  id: string
  title: string
  sector: string
  status: string
  budgetAllocated: number | null
  budgetSpent: number | null
  summary: string
  confidence: string
  primarySource: string
  sources: { source: string; url: string }[]
  sourceDate: string | null
  matchedOn: string | null
  locationText: string | null
  /** Ward card the project sits on (null = county-wide) — shown in sector view */
  cardName: string | null
  /** Title of the project this one is probably a duplicate of, if flagged */
  possibleDuplicateOf: string | null
}

type ProjectGroupBy = "cardName" | "sector"

/** Count + stated-amount total per group; possible duplicates counted but their amounts excluded */
async function summarizeProjects(by: ProjectGroupBy, countyCode: string, fiscalYear: string): Promise<ProjectCardSummary[]> {
  if (typeof countyCode !== "string" || typeof fiscalYear !== "string") throw new Error("Invalid parameters.")
  const where = { countyCode, fiscalYear }
  const [all, distinct, dups] = await Promise.all([
    prisma.hProject.groupBy({ by: [by], where, _count: { _all: true } }),
    prisma.hProject.groupBy({
      by: [by], where: { ...where, possibleDuplicateOf: null },
      _count: { budgetAllocated: true }, _sum: { budgetAllocated: true },
    }),
    prisma.hProject.groupBy({ by: [by], where: { ...where, possibleDuplicateOf: { not: null } }, _count: { _all: true } }),
  ])
  const keyOf = (g: { cardName?: string | null; sector?: string }) => (by === "cardName" ? g.cardName ?? null : g.sector ?? null)
  return all.map((g) => {
    const key = keyOf(g)
    const d = distinct.find((x) => keyOf(x) === key)
    return {
      key,
      count: g._count._all,
      possibleDuplicates: dups.find((x) => keyOf(x) === key)?._count._all ?? 0,
      withAmount: d?._count.budgetAllocated ?? 0,
      totalAllocated: Number(d?._sum.budgetAllocated ?? 0n),
    }
  })
}

/** Per ward card (key = card name; null = county-wide / location not stated) */
export const getProjectSummaryByCard = async (countyCode: string, fiscalYear: string): Promise<ProjectCardSummary[]> => {
  try {
    return await summarizeProjects("cardName", countyCode, fiscalYear)
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Per sector (key = sector name, same names as h_sectors) */
export const getProjectSummaryBySector = async (countyCode: string, fiscalYear: string): Promise<ProjectCardSummary[]> => {
  try {
    return await summarizeProjects("sector", countyCode, fiscalYear)
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export type ProjectFilter = { cardName: string | null } | { sector: string }

const MAX_PROJECTS = 500

/** Projects for one ward card or one sector, highest amount first, unstated amounts last. */
export const getProjects = async (
  countyCode: string,
  fiscalYear: string,
  filter: ProjectFilter,
): Promise<ProjectRowData[]> => {
  try {
    // Server-action args arrive from the client untyped — accept only plain strings / null
    const isStr = (v: unknown): v is string => typeof v === "string"
    if (!isStr(countyCode) || !isStr(fiscalYear) || !filter || typeof filter !== "object") throw new Error("Invalid parameters.")
    let where: { countyCode: string; fiscalYear: string; cardName?: string | null; sector?: string }
    if ("sector" in filter) {
      if (!isStr(filter.sector)) throw new Error("Invalid parameters.")
      where = { countyCode, fiscalYear, sector: filter.sector }
    } else {
      if (filter.cardName !== null && !isStr(filter.cardName)) throw new Error("Invalid parameters.")
      where = { countyCode, fiscalYear, cardName: filter.cardName }
    }

    const rows = await prisma.hProject.findMany({
      where,
      orderBy: [{ budgetAllocated: { sort: "desc", nulls: "last" } }, { title: "asc" }],
      take: MAX_PROJECTS,
    })
    // Titles of the projects that flagged rows probably duplicate (may sit on another card/sector)
    const dupKeys = [...new Set(rows.map((r) => r.possibleDuplicateOf).filter((k): k is string => !!k))]
    const partners = dupKeys.length
      ? await prisma.hProject.findMany({ where: { countyCode, dedupKey: { in: dupKeys } }, select: { dedupKey: true, title: true } })
      : []
    const partnerTitle = new Map(partners.map((p) => [p.dedupKey, p.title]))

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      sector: r.sector,
      status: r.status,
      budgetAllocated: r.budgetAllocated == null ? null : Number(r.budgetAllocated),
      budgetSpent: r.budgetSpent == null ? null : Number(r.budgetSpent),
      summary: r.summary,
      confidence: r.confidence,
      primarySource: r.primarySource,
      sources: r.sources as ProjectRowData["sources"],
      sourceDate: r.sourceDate,
      matchedOn: r.matchedOn,
      locationText: r.locationText,
      cardName: r.cardName,
      possibleDuplicateOf: r.possibleDuplicateOf ? partnerTitle.get(r.possibleDuplicateOf) ?? "another listed project" : null,
    }))
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// The full 47-county list lives in src/constants/hesabu.ts (not a server action)

// ─────────────────────────────────────────────────────────────────────────────
// County comparison
// ─────────────────────────────────────────────────────────────────────────────

/** Fiscal years with any county data, newest first */
export const getComparisonYears = async (): Promise<string[]> => {
  try {
    const rows = await prisma.hCounty.findMany({
      where: { isDataAvailable: true },
      distinct: ["fiscalYear"],
      orderBy: { fiscalYear: "desc" },
      select: { fiscalYear: true },
    })
    return rows.map((r) => r.fiscalYear)
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

async function loadProjectCounts(fiscalYear: string): Promise<ProjectCounts> {
  const [groups, scraped] = await Promise.all([
    prisma.hProject.groupBy({
      by: ["countyCode", "status"],
      where: { fiscalYear, possibleDuplicateOf: null },
      _count: { _all: true },
    }),
    prisma.hProject.groupBy({ by: ["countyCode"], _count: { _all: true } }),
  ])
  return {
    groups: groups.map((g) => ({ countyCode: g.countyCode, status: g.status, count: g._count._all })),
    scrapedCodes: scraped.map((s) => s.countyCode),
  }
}

/** Every county with data for the year, with project coverage; project failures degrade to "unavailable" */
export const getCountyComparison = async (fiscalYear: string): Promise<ComparisonCounty[]> => {
  if (typeof fiscalYear !== "string") throw new Error("Invalid parameters.")
  try {
    const [rows, projects] = await Promise.all([
      prisma.hCounty.findMany({
        where: { fiscalYear, isDataAvailable: true },
        orderBy: { name: "asc" },
        select: {
          code: true, name: true, totalBudget: true, equitableShare: true, developmentExpenditure: true,
          revenueTarget: true, revenueCollected: true, devAbsorptionRate: true,
          sectors: { select: { name: true, allocatedAmount: true } },
        },
      }),
      orFallback<ProjectCounts | null>(loadProjectCounts(fiscalYear), null, "comparison project counts"),
    ])
    return toComparisonCounties(rows, projects)
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
