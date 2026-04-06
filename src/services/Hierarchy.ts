"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { getCurrentUser } from "./UserSessison"

// ─── Permanent hierarchy (County / Constituency) ───────────────────────────

export const getCounties = async () => {
  try {
    return await prisma.county.findMany({ orderBy: { name: "asc" } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getConstituenciesByCounty = async (countyId: string) => {
  try {
    return await prisma.constituency.findMany({
      where: { countyId },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getAllConstituencies = async () => {
  try {
    return await prisma.constituency.findMany({
      orderBy: [{ county: { name: "asc" } }, { name: "asc" }],
      include: { county: { select: { name: true, code: true } } },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─── Election-scoped hierarchy (Ward / PollingStation / Stream) ────────────

export const getWardsByElection = async (electionId: string) => {
  try {
    return await prisma.ward.findMany({
      where: { electionId },
      orderBy: { name: "asc" },
      include: {
        constituency: { select: { name: true, county: { select: { name: true } } } },
        _count: { select: { pollingStations: true } },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Wards for a specific constituency within a specific election */
export const getWardsByConstituencyAndElection = async (constituencyId: string, electionId: string) => {
  try {
    return await prisma.ward.findMany({
      where: { constituencyId, electionId },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getPollingStationsByWard = async (wardId: string) => {
  try {
    return await prisma.pollingStation.findMany({
      where: { wardId, deletedAt: null },
      include: { streams: { where: { isActive: true }, orderBy: { code: "asc" } } },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getStreamsByStation = async (pollingStationId: string) => {
  try {
    return await prisma.stream.findMany({
      where: { pollingStationId, isActive: true },
      orderBy: { code: "asc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getStreamById = async (id: string) => {
  try {
    return await prisma.stream.findUnique({
      where: { id },
      include: {
        pollingStation: {
          include: {
            wardRef: {
              include: {
                constituency: { include: { county: true } },
              },
            },
          },
        },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Full election hierarchy: Ward → PollingStation → Stream for one election */
export const getElectionHierarchy = async (electionId: string) => {
  try {
    return await prisma.ward.findMany({
      where: { electionId },
      orderBy: { name: "asc" },
      include: {
        constituency: { select: { name: true, county: { select: { name: true } } } },
        pollingStations: {
          where: { deletedAt: null },
          orderBy: { name: "asc" },
          include: {
            streams: { where: { isActive: true }, orderBy: { code: "asc" } },
          },
        },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Permanent hierarchy tree: County → Constituency (no wards — those are election-scoped) */
export const getPermanentHierarchy = async () => {
  try {
    return await prisma.county.findMany({
      orderBy: { name: "asc" },
      include: {
        constituencies: { orderBy: { name: "asc" } },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─── Write hierarchy ───────────────────────────────────────────────────────

export const createCounty = async (name: string, code: string) => {
  try {
    return await prisma.county.create({ data: { name, code: code.toUpperCase() } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const createConstituency = async (countyId: string, name: string, code: string) => {
  try {
    return await prisma.constituency.create({ data: { countyId, name, code: code.toUpperCase() } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const createWard = async (
  electionId: string,
  constituencyId: string,
  name: string,
  code: string
) => {
  try {
    return await prisma.ward.create({
      data: { electionId, constituencyId, name, code: code.toUpperCase() },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const createPollingStation = async (
  wardId: string,
  data: {
    name: string
    code: string
    county: string
    constituency: string
    ward: string
    registeredVoters?: number
  }
) => {
  try {
    const user = await getCurrentUser()
    return await prisma.pollingStation.create({
      data: { wardId, ...data, createdBy: user.id },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const createStream = async (
  pollingStationId: string,
  name: string,
  code: string,
  registeredVoters?: number
) => {
  try {
    return await prisma.stream.create({
      data: { pollingStationId, name, code, registeredVoters },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Hierarchy counts for a specific election */
export const getElectionHierarchyCounts = async (electionId: string) => {
  try {
    const wards = await prisma.ward.count({ where: { electionId } })
    const stations = await prisma.pollingStation.count({
      where: { wardRef: { electionId }, deletedAt: null },
    })
    const streams = await prisma.stream.count({
      where: { pollingStation: { wardRef: { electionId } }, isActive: true },
    })
    return { wards, stations, streams }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Permanent structure counts */
export const getPermanentCounts = async () => {
  try {
    const [counties, constituencies] = await Promise.all([
      prisma.county.count(),
      prisma.constituency.count(),
    ])
    return { counties, constituencies }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
