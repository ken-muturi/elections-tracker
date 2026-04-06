"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { getCurrentUser } from "./UserSessison"

/**
 * Get all stream assignments for the logged-in agent.
 * Groups by election and includes full geographic context.
 */
export const getMyAssignments = async () => {
  try {
    const user = await getCurrentUser()
    return await prisma.agentStream.findMany({
      where: { agentId: user.id, isActive: true },
      include: {
        election: {
          select: { id: true, title: true, year: true, electionDate: true, isActive: true },
        },
        stream: {
          include: {
            pollingStation: {
              select: {
                id: true, name: true, code: true,
                county: true, constituency: true, ward: true,
                registeredVoters: true,
                wardRef: {
                  select: {
                    id: true, name: true, code: true,
                    constituencyId: true,
                    constituency: {
                      select: { id: true, name: true, countyId: true, county: { select: { id: true, name: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { election: { electionDate: "desc" } },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Get all positions + candidates for an election.
 * Used on the enter-results form so agents can see what to fill in.
 */
export const getElectionPositionsWithCandidates = async (electionId: string) => {
  try {
    return await prisma.electionPosition.findMany({
      where: { electionId },
      include: {
        candidates: {
          select: {
            id: true,
            name: true,
            party: true,
            entityId: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Get existing results for a stream (all positions) so the agent
 * can see which positions they've already filled in and their status.
 */
export const getStreamResultsForStream = async (streamId: string) => {
  try {
    return await prisma.streamResult.findMany({
      where: { streamId },
      include: {
        position: { select: { id: true, type: true, title: true } },
        votes: { include: { candidate: true } },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Get all active elections (admin only — no agent assignment filter).
 */
export const getActiveElections = async () => {
  try {
    return await prisma.election.findMany({
      where: { isActive: true },
      select: { id: true, title: true, year: true, electionDate: true, isActive: true },
      orderBy: { electionDate: "desc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Search/browse streams for a given election (admin only).
 * Returns streams matching the optional search query, limited to 50.
 */
export const searchElectionStreams = async (
  electionId: string,
  searchQuery?: string,
) => {
  try {
    const where: Record<string, unknown> = {
      isActive: true,
      pollingStation: {
        deletedAt: null,
        wardRef: { electionId },
      },
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim()
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { pollingStation: { name: { contains: q, mode: "insensitive" } } },
        { pollingStation: { code: { contains: q, mode: "insensitive" } } },
        { pollingStation: { county: { contains: q, mode: "insensitive" } } },
        { pollingStation: { constituency: { contains: q, mode: "insensitive" } } },
        { pollingStation: { ward: { contains: q, mode: "insensitive" } } },
      ]
    }

    const streams = await prisma.stream.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: where as any,
      take: 50,
      orderBy: [{ pollingStation: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        registeredVoters: true,
        pollingStation: {
          select: {
            id: true,
            name: true,
            code: true,
            county: true,
            constituency: true,
            ward: true,
            registeredVoters: true,
            wardRef: {
              select: {
                id: true,
                constituencyId: true,
                constituency: {
                  select: { id: true, countyId: true },
                },
              },
            },
          },
        },
      },
    });

    return streams
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
