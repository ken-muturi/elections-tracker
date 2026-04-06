/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { getCurrentUser } from "./UserSessison"
import { ResultStatus } from "@prisma/client"

export type CandidateVoteInput = {
  candidateId: string
  votes: number
}

export type StreamResultInput = {
  streamId: string
  positionId: string
  votes: CandidateVoteInput[]
  totalVotes?: number
  rejectedVotes?: number
  notes?: string
  imageUrl?: string
  voiceUrl?: string
}

/**
 * Upsert a stream result (create or update).
 * Votes for each candidate are upserted individually so partial saves work.
 */
export const upsertStreamResult = async (input: StreamResultInput, status: ResultStatus = "DRAFT") => {
  try {
    const user = await getCurrentUser()

    const existing = await prisma.streamResult.findUnique({
      where: { streamId_positionId: { streamId: input.streamId, positionId: input.positionId } },
    })

    let resultId: string

    if (existing) {
      await prisma.streamResult.update({
        where: { id: existing.id },
        data: {
          agentId: user.id,
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
      const created = await prisma.streamResult.create({
        data: {
          streamId: input.streamId,
          positionId: input.positionId,
          agentId: user.id,
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

    // Upsert individual candidate votes
    for (const cv of input.votes) {
      await prisma.streamCandidateVote.upsert({
        where: { streamResultId_candidateId: { streamResultId: resultId, candidateId: cv.candidateId } },
        create: { streamResultId: resultId, candidateId: cv.candidateId, votes: cv.votes },
        update: { votes: cv.votes },
      })
    }

    return await prisma.streamResult.findUnique({
      where: { id: resultId },
      include: { votes: { include: { candidate: true } } },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const submitStreamResult = async (streamResultId: string) => {
  try {
    return await prisma.streamResult.update({
      where: { id: streamResultId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const updateStreamResultStatus = async (id: string, status: ResultStatus) => {
  try {
    return await prisma.streamResult.update({ where: { id }, data: { status } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Get all stream results for an election position, grouped by stream.
 * Used for ward-level aggregation views.
 */
export const getStreamResultsByPosition = async (positionId: string) => {
  try {
    return await prisma.streamResult.findMany({
      where: { positionId },
      include: {
        stream: {
          include: {
            pollingStation: {
              select: {
                name: true, code: true,
                county: true, constituency: true, ward: true,
                wardRef: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
        votes: { include: { candidate: true } },
        agent: { select: { firstname: true, othernames: true } },
      },
      orderBy: { submittedAt: "desc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Get stream results entered by a specific agent for a given election.
 * Used in the agent dashboard to show what they've submitted.
 */
export const getAgentResults = async (electionId: string, agentId: string) => {
  try {
    return await prisma.streamResult.findMany({
      where: {
        agentId,
        position: { electionId },
      },
      include: {
        stream: {
          include: {
            pollingStation: {
              select: { name: true, code: true, county: true, constituency: true, ward: true },
            },
          },
        },
        position: { select: { type: true, title: true } },
        votes: { include: { candidate: true } },
      },
      orderBy: { submittedAt: "desc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Get a single stream result (for pre-filling the entry form) */
export const getStreamResult = async (streamId: string, positionId: string) => {
  try {
    return await prisma.streamResult.findUnique({
      where: { streamId_positionId: { streamId, positionId } },
      include: { votes: { include: { candidate: true } } },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Aggregate stream results up to polling-station level for a position.
 * Returns a map of candidateId → total votes across all streams in the station.
 */
export const aggregateToStation = async (pollingStationId: string, positionId: string) => {
  try {
    const streams = await prisma.stream.findMany({
      where: { pollingStationId, isActive: true },
      include: {
        streamResults: {
          where: { positionId, status: { in: ["SUBMITTED", "VERIFIED"] } },
          include: { votes: true },
        },
      },
    })

    const totals = new Map<string, number>()
    let totalVotes = 0
    let rejectedVotes = 0
    let reportedStreams = 0

    for (const stream of streams) {
      for (const result of stream.streamResults) {
        reportedStreams++
        totalVotes += result.totalVotes ?? 0
        rejectedVotes += result.rejectedVotes ?? 0
        for (const vote of result.votes) {
          totals.set(vote.candidateId, (totals.get(vote.candidateId) ?? 0) + vote.votes)
        }
      }
    }

    return {
      totalStreams: streams.length,
      reportedStreams,
      totalVotes,
      rejectedVotes,
      candidateTotals: Array.from(totals.entries()).map(([candidateId, votes]) => ({
        candidateId,
        votes,
      })),
    }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
