"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { getCurrentUser } from "./UserSessison"
import { AggregationLevel } from "@prisma/client"
import { KNOWN_POSITIONS } from "@/constants/elections"

// ─── Elections CRUD ────────────────────────────────────────────────────────

// ─── Public (no-auth) queries ──────────────────────────────────────────────

/** Returns only *active* elections — safe for public-facing pages. */
export const getPublicElections = async () => {
  try {
    return await prisma.election.findMany({
      where: { isActive: true },
      orderBy: [{ year: "desc" }, { electionDate: "desc" }],
      include: {
        positions: {
          include: { candidates: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Returns a single election by id — safe for public-facing pages. */
export const getPublicElectionById = async (id: string) => {
  try {
    return await prisma.election.findUnique({
      where: { id },
      include: {
        positions: {
          include: { candidates: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─── Admin queries ─────────────────────────────────────────────────────────

export type PositionInput = {
  type: string              // free-form, e.g. "MCA", "Governor", "Village Elder"
  title: string             // display label
  aggregationLevel: AggregationLevel
  description?: string
  sortOrder?: number
}

export type CreateElectionInput = {
  title: string
  year: number
  electionDate: Date
  description?: string
  positions?: PositionInput[]
}

function validatePositionType(type: string): string {
  const normalised = type.trim().toUpperCase()
  if (!normalised) throw new Error("Position type cannot be empty.")
  return normalised
}


export const createElection = async (input: CreateElectionInput) => {
  try {
    const user = await getCurrentUser()
    const fallback: PositionInput[] = Object.entries(KNOWN_POSITIONS).map(([type, meta], i) => ({
      type, title: meta.label, aggregationLevel: meta.aggregationLevel,
      description: meta.description, sortOrder: i,
    }))
    const positions = (input.positions ?? fallback).map((p, i) => ({
      ...p,
      type: validatePositionType(p.type),
      sortOrder: p.sortOrder ?? i,
    }))

    // Guard: no duplicate types within the same election
    const types = positions.map((p) => p.type)
    const dupes = types.filter((t, i) => types.indexOf(t) !== i)
    if (dupes.length) throw new Error(`Duplicate position types: ${dupes.join(", ")}`)

    return await prisma.election.create({
      data: {
        title: input.title,
        year: input.year,
        electionDate: input.electionDate,
        description: input.description,
        createdBy: user.id,
        positions: {
          create: positions.map((p) => ({
            type: p.type,
            title: p.title,
            aggregationLevel: p.aggregationLevel,
            description: p.description,
            sortOrder: p.sortOrder ?? 0,
          })),
        },
      },
      include: { positions: true },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getElections = async () => {
  try {
    return await prisma.election.findMany({
      orderBy: [{ year: "desc" }, { electionDate: "desc" }],
      include: {
        positions: { include: { candidates: true }, orderBy: { sortOrder: "asc" } },
        _count: { select: { agentAssignments: true, wards: true } },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getElectionById = async (id: string) => {
  try {
    return await prisma.election.findUnique({
      where: { id },
      include: {
        positions: {
          include: { candidates: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { wards: true, agentAssignments: true } },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const updateElection = async (
  id: string,
  data: Partial<Pick<CreateElectionInput, "title" | "year" | "electionDate" | "description">> & { isActive?: boolean }
) => {
  try {
    return await prisma.election.update({ where: { id }, data })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const deleteElection = async (id: string) => {
  try {
    return await prisma.election.delete({ where: { id } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─── Positions CRUD ────────────────────────────────────────────────────────

export const addPosition = async (electionId: string, input: PositionInput) => {
  try {
    const type = validatePositionType(input.type)
    return await prisma.electionPosition.create({
      data: {
        electionId,
        type,
        title: input.title,
        aggregationLevel: input.aggregationLevel,
        description: input.description,
        sortOrder: input.sortOrder ?? 0,
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const updatePosition = async (id: string, data: Partial<PositionInput>) => {
  try {
    if (data.type) data = { ...data, type: validatePositionType(data.type) }
    return await prisma.electionPosition.update({ where: { id }, data })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const deletePosition = async (id: string) => {
  try {
    return await prisma.electionPosition.delete({ where: { id } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─── Candidates CRUD ────────────────────────────────────────────────────────

export type CandidateInput = {
  positionId: string
  name: string
  party?: string
  photoUrl?: string
  entityId?: string
  sortOrder?: number
}

export const createCandidate = async (input: CandidateInput) => {
  try {
    return await prisma.candidate.create({ data: input })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const updateCandidate = async (id: string, data: Partial<CandidateInput>) => {
  try {
    return await prisma.candidate.update({ where: { id }, data })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const deleteCandidate = async (id: string) => {
  try {
    return await prisma.candidate.delete({ where: { id } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getCandidatesByPosition = async (positionId: string, entityId?: string) => {
  try {
    return await prisma.candidate.findMany({
      where: { positionId, ...(entityId ? { entityId } : {}) },
      orderBy: { sortOrder: "asc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─── Agent assignments ────────────────────────────────────────────────────

export const assignAgentToStream = async (electionId: string, streamId: string, agentId: string) => {
  try {
    return await prisma.agentStream.upsert({
      where: { electionId_streamId_agentId: { electionId, streamId, agentId } },
      create: { electionId, streamId, agentId },
      update: { isActive: true },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getAgentAssignments = async (electionId: string) => {
  try {
    return await prisma.agentStream.findMany({
      where: { electionId, isActive: true },
      include: {
        stream: {
          include: {
            pollingStation: {
              select: { name: true, code: true, county: true, constituency: true, ward: true },
            },
          },
        },
        agent: { select: { id: true, firstname: true, othernames: true, email: true } },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getAgentStreams = async (electionId: string, agentId: string) => {
  try {
    return await prisma.agentStream.findMany({
      where: { electionId, agentId, isActive: true },
      include: {
        stream: {
          include: {
            pollingStation: {
              select: { name: true, code: true, county: true, constituency: true, ward: true },
            },
          },
        },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
