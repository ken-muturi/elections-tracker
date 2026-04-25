"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
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

// The full 47-county list lives in src/constants/hesabu.ts (not a server action)
