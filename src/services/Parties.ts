"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { requireAdmin } from "./Authorization"

export type Party = {
  id: string
  name: string
  abbreviation: string | null
}

// ── Read ────────────────────────────────────────────────────────────────────

export const getParties = async (): Promise<Party[]> => {
  try {
    return await prisma.party.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, abbreviation: true },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getPartyById = async (id: string): Promise<Party | null> => {
  try {
    return await prisma.party.findUnique({
      where: { id },
      select: { id: true, name: true, abbreviation: true },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ── Write (admin only) ───────────────────────────────────────────────────────

export const createParty = async (name: string, abbreviation?: string): Promise<Party> => {
  try {
    await requireAdmin()
    return await prisma.party.create({
      data: { name: name.trim(), abbreviation: abbreviation?.trim() ?? null },
      select: { id: true, name: true, abbreviation: true },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const updateParty = async (id: string, name: string, abbreviation?: string): Promise<Party> => {
  try {
    await requireAdmin()
    return await prisma.party.update({
      where: { id },
      data: { name: name.trim(), abbreviation: abbreviation?.trim() ?? null },
      select: { id: true, name: true, abbreviation: true },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const deleteParty = async (id: string): Promise<void> => {
  try {
    await requireAdmin()
    await prisma.party.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
