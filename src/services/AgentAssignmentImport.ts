"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { getCurrentUser } from "./UserSessison"

export type ImportRow = {
  agentEmail: string
  streamCode: string
  pollingStationCode?: string
}

export type ImportResult = {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{ row: number; email: string; streamCode: string; error: string }>
}

/**
 * Bulk import agent stream assignments from CSV data.
 * CSV format: agentEmail, streamCode, pollingStationCode (optional)
 * 
 * Example:
 * agent1@example.com,STREAM_001,PS_001
 * agent2@example.com,STREAM_002,PS_002
 */
export const importAgentAssignments = async (
  electionId: string,
  rows: ImportRow[]
): Promise<ImportResult> => {
  try {
    const user = await getCurrentUser()
    
    // Authorization check
    const role = (user.role ?? "").toLowerCase()
    const isAdmin = role === "admin" || role === "super admin"
    if (!isAdmin) {
      throw new Error("Only administrators can import agent assignments.")
    }

    // Verify election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    })
    if (!election) {
      throw new Error("Election not found.")
    }

    let imported = 0
    let skipped = 0
    const errors: ImportResult["errors"] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1

      try {
        // Find agent by email
        const agent = await prisma.user.findUnique({
          where: { email: row.agentEmail.trim().toLowerCase() },
        })
        if (!agent) {
          errors.push({
            row: rowNum,
            email: row.agentEmail,
            streamCode: row.streamCode,
            error: `Agent not found with email: ${row.agentEmail}`,
          })
          skipped++
          continue
        }

        // Find stream by code (and optionally polling station code)
        const streamWhere: {
          code: string
          pollingStation?: { code: string }
        } = {
          code: row.streamCode.trim().toUpperCase(),
        }
        if (row.pollingStationCode) {
          streamWhere.pollingStation = {
            code: row.pollingStationCode.trim().toUpperCase(),
          }
        }

        const stream = await prisma.stream.findFirst({
          where: streamWhere,
          include: {
            pollingStation: {
              include: {
                wardRef: {
                  select: { electionId: true },
                },
              },
            },
          },
        })

        if (!stream) {
          errors.push({
            row: rowNum,
            email: row.agentEmail,
            streamCode: row.streamCode,
            error: `Stream not found: ${row.streamCode}${row.pollingStationCode ? ` at ${row.pollingStationCode}` : ""}`,
          })
          skipped++
          continue
        }

        // Verify stream belongs to election's hierarchy
        if (stream.pollingStation.wardRef?.electionId !== electionId) {
          errors.push({
            row: rowNum,
            email: row.agentEmail,
            streamCode: row.streamCode,
            error: `Stream ${row.streamCode} does not belong to this election`,
          })
          skipped++
          continue
        }

        // Create or reactivate assignment
        await prisma.agentStream.upsert({
          where: {
            electionId_streamId_agentId: {
              electionId,
              streamId: stream.id,
              agentId: agent.id,
            },
          },
          create: {
            electionId,
            streamId: stream.id,
            agentId: agent.id,
            isActive: true,
          },
          update: {
            isActive: true,
          },
        })

        imported++
      } catch (error: unknown) {
        errors.push({
          row: rowNum,
          email: row.agentEmail,
          streamCode: row.streamCode,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        skipped++
      }
    }

    return {
      success: true,
      imported,
      skipped,
      errors,
    }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
