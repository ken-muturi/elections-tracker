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
        candidates: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    })
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
