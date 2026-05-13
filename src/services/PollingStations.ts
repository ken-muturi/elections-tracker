/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { getCurrentUser } from "./UserSessison"

export type PollingStationForm = {
  id?: string;
  wardId: string;
  name: string;
  code: string;
  county: string;
  constituency: string;
  ward: string;
  registeredVoters?: number | null;
  electionId?: string;
};

export const getPollingStations = async (
  whereClause?: Record<string, any>
) => {
  const where = whereClause ? whereClause : {}
  try {
    return await prisma.pollingStation.findMany({
      where: { deletedAt: null, ...where },
      orderBy: { name: "asc" },
      include: {
        streams: { orderBy: { name: "asc" } },
        electionActivations: {
          where: { isActive: true },
          include: { election: { select: { id: true, title: true, year: true } } },
        },
      },
    });
  } catch (error) {
    const message = handleReturnError(error)
    console.error("Error getting polling stations:", message)
    throw new Error(message)
  }
}

export const getPollingStationById = async (id: string) => {
  try {
    return await prisma.pollingStation.findUnique({
      where: { id, deletedAt: null },
      include: { streams: true },
    })
  } catch (error) {
    const message = handleReturnError(error)
    console.error("Error getting polling station:", message)
    throw new Error(message)
  }
}

export const createPollingStation = async (data: PollingStationForm) => {
  try {
    const user = await getCurrentUser();
    // Upsert master record — station may already exist from a previous election
    const station = await prisma.pollingStation.upsert({
      where: { wardId_code: { wardId: data.wardId, code: data.code } },
      create: {
        wardId: data.wardId,
        name: data.name,
        code: data.code,
        county: data.county,
        constituency: data.constituency,
        ward: data.ward,
        registeredVoters: data.registeredVoters ?? null,
        createdBy: user.id,
      },
      update: {
        name: data.name,
        registeredVoters: data.registeredVoters ?? null,
        county: data.county,
        constituency: data.constituency,
        ward: data.ward,
      },
    });
    if (data.electionId) {
      await prisma.electionPollingStation.upsert({
        where: {
          electionId_pollingStationId: {
            electionId: data.electionId,
            pollingStationId: station.id,
          },
        },
        create: {
          electionId: data.electionId,
          pollingStationId: station.id,
          isActive: true,
        },
        update: { isActive: true },
      });
    }
    return station;
  } catch (error) {
    const message = handleReturnError(error)
    console.error("Error creating polling station:", message)
    throw new Error(message)
  }
}

export const updatePollingStation = async (
  id: string,
  data: PollingStationForm
) => {
  try {
    const user = await getCurrentUser()
    return await prisma.pollingStation.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        county: data.county,
        constituency: data.constituency,
        ward: data.ward,
        registeredVoters: data.registeredVoters ?? null,
        updatedBy: user.id,
      },
    })
  } catch (error) {
    const message = handleReturnError(error)
    console.error("Error updating polling station:", message)
    throw new Error(message)
  }
}

export const deletePollingStation = async (id: string) => {
  try {
    const user = await getCurrentUser()
    return await prisma.pollingStation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    })
  } catch (error) {
    const message = handleReturnError(error)
    console.error("Error deleting polling station:", message)
    throw new Error(message)
  }
}

export const getCounties = async () => {
  try {
    const result = await prisma.pollingStation.findMany({
      where: { deletedAt: null },
      select: { county: true },
      distinct: ["county"],
      orderBy: { county: "asc" },
    })
    return result.map((r: { county: string }) => r.county)
  } catch (error) {
    const message = handleReturnError(error)
    console.error("Error getting counties:", message)
    throw new Error(message)
  }
}

export const getConstituencies = async (county?: string) => {
  try {
    const where: any = { deletedAt: null }
    if (county) where.county = county
    const result = await prisma.pollingStation.findMany({
      where,
      select: { constituency: true },
      distinct: ["constituency"],
      orderBy: { constituency: "asc" },
    })
    return result.map((r: { constituency: string }) => r.constituency)
  } catch (error) {
    const message = handleReturnError(error)
    console.error("Error getting constituencies:", message)
    throw new Error(message)
  }
}

export const togglePollingStationActive = async (
  id: string,
  isActive: boolean,
) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    return await prisma.pollingStation.update({
      where: { id },
      data: {
        isActive,
        updatedBy: user.id,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error toggling polling station active status:", message);
    throw new Error(message);
  }
};

/** Toggle a polling station's active status for a specific election (junction-level). */
export const toggleElectionPollingStationActive = async (
  electionId: string,
  pollingStationId: string,
  isActive: boolean,
) => {
  try {
    return await prisma.electionPollingStation.update({
      where: { electionId_pollingStationId: { electionId, pollingStationId } },
      data: { isActive },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error toggling election polling station active status:", message);
    throw new Error(message);
  }
};

export type StreamForm = {
  name: string;
  code: string;
  registeredVoters?: number | null;
};

export const createStream = async (pollingStationId: string, data: StreamForm) => {
  try {
    return await prisma.stream.create({
      data: {
        pollingStationId,
        name: data.name,
        code: data.code,
        registeredVoters: data.registeredVoters ?? null,
      },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error creating stream:", message);
    throw new Error(message);
  }
};

export const deleteStream = async (id: string) => {
  try {
    return await prisma.stream.delete({ where: { id } });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error deleting stream:", message);
    throw new Error(message);
  }
};

export const updateStream = async (id: string, data: StreamForm) => {
  try {
    return await prisma.stream.update({
      where: { id },
      data,
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error updating stream:", message);
    throw new Error(message);
  }
};

export const toggleStreamActive = async (id: string, isActive: boolean) => {
  try {
    return await prisma.stream.update({
      where: { id },
      data: { isActive },
    });
  } catch (error) {
    const message = handleReturnError(error);
    console.error("Error toggling stream active status:", message);
    throw new Error(message);
  }
};
