/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { getCurrentUser } from "./UserSessison"
import { AggregationLevel, ResultStatus } from "@prisma/client"

export type LevelVoteInput = {
  candidateId: string
  votes: number
}

export type LevelResultInput = {
  positionId: string
  level: AggregationLevel
  entityId: string
  votes: LevelVoteInput[]
  totalVotes?: number
  rejectedVotes?: number
  notes?: string
  imageUrl?: string
  voiceUrl?: string
}

export const upsertLevelResult = async (input: LevelResultInput, status: ResultStatus = "DRAFT") => {
  try {
    const user = await getCurrentUser()

    const existing = await prisma.levelResult.findUnique({
      where: {
        positionId_level_entityId: {
          positionId: input.positionId,
          level: input.level,
          entityId: input.entityId,
        },
      },
    })

    let resultId: string

    if (existing) {
      await prisma.levelResult.update({
        where: { id: existing.id },
        data: {
          validatorId: user.id,
          status,
          totalVotes: input.totalVotes,
          rejectedVotes: input.rejectedVotes,
          notes: input.notes,
          imageUrl: input.imageUrl,
          voiceUrl: input.voiceUrl,
        },
      })
      resultId = existing.id
    } else {
      const created = await prisma.levelResult.create({
        data: {
          positionId: input.positionId,
          level: input.level,
          entityId: input.entityId,
          validatorId: user.id,
          status,
          totalVotes: input.totalVotes,
          rejectedVotes: input.rejectedVotes,
          notes: input.notes,
          imageUrl: input.imageUrl,
          voiceUrl: input.voiceUrl,
        },
      })
      resultId = created.id
    }

    for (const cv of input.votes) {
      await prisma.levelCandidateVote.upsert({
        where: { levelResultId_candidateId: { levelResultId: resultId, candidateId: cv.candidateId } },
        create: { levelResultId: resultId, candidateId: cv.candidateId, votes: cv.votes },
        update: { votes: cv.votes },
      })
    }

    return await prisma.levelResult.findUnique({
      where: { id: resultId },
      include: { votes: { include: { candidate: true } } },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const submitLevelResult = async (levelResultId: string) => {
  try {
    return await prisma.levelResult.update({
      where: { id: levelResultId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const updateLevelResultStatus = async (id: string, status: ResultStatus) => {
  try {
    return await prisma.levelResult.update({ where: { id }, data: { status } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getLevelResult = async (
  positionId: string,
  level: AggregationLevel,
  entityId: string
) => {
  try {
    return await prisma.levelResult.findUnique({
      where: { positionId_level_entityId: { positionId, level, entityId } },
      include: { votes: { include: { candidate: true } }, validator: { select: { firstname: true, othernames: true } } },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getLevelResultsByPosition = async (positionId: string, level?: AggregationLevel) => {
  try {
    return await prisma.levelResult.findMany({
      where: { positionId, ...(level ? { level } : {}) },
      include: { votes: { include: { candidate: true } }, validator: { select: { firstname: true, othernames: true } } },
      orderBy: { submittedAt: "desc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─── Aggregation helpers ────────────────────────────────────────────────────

/**
 * Compute the system-calculated aggregate from stream results.
 * Used to cross-check against the manually entered LevelResult.
 */
export const computeAggregateFromStreams = async (
  positionId: string,
  level: AggregationLevel,
  entityId: string
) => {
  try {
    // Determine which stream results roll up to this entity
    let streamResults: any[] = []

    if (level === "WARD") {
      // Get all streams in all polling stations in this ward
      const stations = await prisma.pollingStation.findMany({
        where: { wardId: entityId, deletedAt: null },
        select: { id: true },
      })
      streamResults = await prisma.streamResult.findMany({
        where: {
          positionId,
          stream: { pollingStationId: { in: stations.map((s) => s.id) } },
          status: { in: ["SUBMITTED", "VERIFIED"] },
        },
        include: { votes: true },
      })
    } else if (level === "CONSTITUENCY") {
      const wards = await prisma.ward.findMany({
        where: { constituencyId: entityId },
        select: { id: true },
      })
      const stations = await prisma.pollingStation.findMany({
        where: { wardId: { in: wards.map((w) => w.id) }, deletedAt: null },
        select: { id: true },
      })
      streamResults = await prisma.streamResult.findMany({
        where: {
          positionId,
          stream: { pollingStationId: { in: stations.map((s) => s.id) } },
          status: { in: ["SUBMITTED", "VERIFIED"] },
        },
        include: { votes: true },
      })
    } else if (level === "COUNTY") {
      const constituencies = await prisma.constituency.findMany({
        where: { countyId: entityId },
        select: { id: true },
      })
      const wards = await prisma.ward.findMany({
        where: { constituencyId: { in: constituencies.map((c) => c.id) } },
        select: { id: true },
      })
      const stations = await prisma.pollingStation.findMany({
        where: { wardId: { in: wards.map((w) => w.id) }, deletedAt: null },
        select: { id: true },
      })
      streamResults = await prisma.streamResult.findMany({
        where: {
          positionId,
          stream: { pollingStationId: { in: stations.map((s) => s.id) } },
          status: { in: ["SUBMITTED", "VERIFIED"] },
        },
        include: { votes: true },
      })
    } else if (level === "NATIONAL") {
      streamResults = await prisma.streamResult.findMany({
        where: { positionId, status: { in: ["SUBMITTED", "VERIFIED"] } },
        include: { votes: true },
      })
    }

    const candidateTotals = new Map<string, number>()
    let totalVotes = 0
    let rejectedVotes = 0

    for (const result of streamResults) {
      totalVotes += result.totalVotes ?? 0
      rejectedVotes += result.rejectedVotes ?? 0
      for (const vote of result.votes) {
        candidateTotals.set(
          vote.candidateId,
          (candidateTotals.get(vote.candidateId) ?? 0) + vote.votes
        )
      }
    }

    return {
      streamCount: streamResults.length,
      totalVotes,
      rejectedVotes,
      candidateTotals: Array.from(candidateTotals.entries()).map(([candidateId, votes]) => ({
        candidateId,
        votes,
      })),
    }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Full election results view — candidate totals at each position's natural level.
 * MCA per ward, MP per constituency, etc.
 * This is the main public results endpoint.
 */
export const getElectionResults = async (electionId: string) => {
  try {
    // Fetch all geographic lookup tables in parallel
    const [counties, constituencies, wards, positions] = await Promise.all([
      prisma.county.findMany({ select: { id: true, name: true } }),
      prisma.constituency.findMany({ select: { id: true, name: true } }),
      prisma.ward.findMany({ where: { electionId }, select: { id: true, name: true } }),
      prisma.electionPosition.findMany({
        where: { electionId },
        include: {
          candidates: { orderBy: { sortOrder: "asc" } },
          levelResults: {
            where: { status: { in: ["SUBMITTED", "VERIFIED"] } },
            include: { votes: { include: { candidate: true } } },
          },
          streamResults: {
            where: { status: { in: ["SUBMITTED", "VERIFIED"] } },
            include: {
              votes: true,
              stream: {
                include: {
                  pollingStation: {
                    select: { county: true, constituency: true, ward: true, wardId: true },
                  },
                },
              },
            },
          },
        },
      }),
    ])

    const countyNameById = new Map(counties.map((c) => [c.id, c.name]))
    const constituencyNameById = new Map(constituencies.map((c) => [c.id, c.name]))
    const wardNameById = new Map(wards.map((w) => [w.id, w.name]))

    return positions.map((position) => {
      const level = position.aggregationLevel

      // ── Stream aggregation ─────────────────────────────────────────────────
      // streamAgg: candidateId → total stream votes
      const streamAgg = new Map<string, number>()
      let streamTotal = 0
      let streamRejected = 0

      for (const sr of position.streamResults) {
        streamTotal += sr.totalVotes ?? 0
        streamRejected += sr.rejectedVotes ?? 0
        for (const v of sr.votes) {
          streamAgg.set(v.candidateId, (streamAgg.get(v.candidateId) ?? 0) + v.votes)
        }
      }

      // ── Level votes lookup: candidateId → total level votes ───────────────
      const levelAgg = new Map<string, number>()
      for (const lr of position.levelResults) {
        for (const v of lr.votes) {
          levelAgg.set(v.candidateId, (levelAgg.get(v.candidateId) ?? 0) + v.votes)
        }
      }

      // ── Level result totals lookup: entityId → { totalVotes, rejectedVotes }
      const levelTotals = new Map<string, { totalVotes: number; rejectedVotes: number }>()
      for (const lr of position.levelResults) {
        const key = lr.entityId
        const existing = levelTotals.get(key) ?? { totalVotes: 0, rejectedVotes: 0 }
        levelTotals.set(key, {
          totalVotes: existing.totalVotes + (lr.totalVotes ?? 0),
          rejectedVotes: existing.rejectedVotes + (lr.rejectedVotes ?? 0),
        })
      }

      // ── Helper: resolve entity name from its id ───────────────────────────
      const resolveEntityName = (entityId: string | null): string => {
        if (level === "NATIONAL" || entityId === null) return "National"
        if (level === "COUNTY") return countyNameById.get(entityId) ?? entityId
        if (level === "CONSTITUENCY") return constituencyNameById.get(entityId) ?? entityId
        if (level === "WARD") return wardNameById.get(entityId) ?? entityId
        return entityId
      }

      // ── Group candidates by entityId ──────────────────────────────────────
      // For NATIONAL positions all candidates share a single synthetic entity.
      const entityMap = new Map<
        string,
        {
          entityId: string
          entityName: string
          candidates: {
            id: string
            name: string
            party: string | null
            streamVotes: number
            levelVotes: number
          }[]
        }
      >()

      for (const c of position.candidates) {
        const rawEntityId = level === "NATIONAL" ? "national" : (c.entityId ?? "national")
        const entityName = resolveEntityName(rawEntityId === "national" ? null : rawEntityId)

        if (!entityMap.has(rawEntityId)) {
          entityMap.set(rawEntityId, {
            entityId: rawEntityId,
            entityName,
            candidates: [],
          })
        }

        entityMap.get(rawEntityId)!.candidates.push({
          id: c.id,
          name: c.name,
          party: c.party,
          streamVotes: streamAgg.get(c.id) ?? 0,
          levelVotes: levelAgg.get(c.id) ?? 0,
        })
      }

      // ── Sort candidates within each entity by streamVotes desc ────────────
      for (const entity of entityMap.values()) {
        entity.candidates.sort((a, b) => b.streamVotes - a.streamVotes)
      }

      // ── Build final entities array sorted alphabetically by name ──────────
      const entities = Array.from(entityMap.values())
        .map((entity) => {
          const totals = levelTotals.get(entity.entityId) ?? { totalVotes: 0, rejectedVotes: 0 }
          return {
            entityId: entity.entityId,
            entityName: entity.entityName,
            candidates: entity.candidates,
            totalVotes: totals.totalVotes,
            rejectedVotes: totals.rejectedVotes,
          }
        })
        .sort((a, b) => a.entityName.localeCompare(b.entityName))

      return {
        positionId: position.id,
        positionType: position.type,
        positionTitle: position.title,
        aggregationLevel: level,
        entities,
        streamStats: {
          totalReported: position.streamResults.length,
          totalVotes: streamTotal,
          rejectedVotes: streamRejected,
        },
        levelValidations: position.levelResults.length,
      }
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
