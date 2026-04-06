"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"

/**
 * Public (no auth) drill-down results service.
 *
 * Hierarchy for drill-down:
 *   National → County → Constituency → Ward → Polling Station → Stream
 *
 * At each level we aggregate the stream-level votes upward.
 */

type CandidateVoteSummary = {
  candidateId: string
  name: string
  party: string | null
  votes: number
}

type ChildResult = {
  entityId: string
  entityName: string
  entityCode?: string
  totalVotes: number
  rejectedVotes: number
  reportedStreams: number
  totalStreams: number
  candidates: CandidateVoteSummary[]
}

export type DrillDownResult = {
  positionId: string
  positionTitle: string
  positionType: string
  aggregationLevel: string
  level: string           // current drill-down level being viewed
  levelLabel: string      // e.g. "Counties", "Constituencies"
  parentName: string | null
  breadcrumb: { id: string; name: string; level: string }[]
  totalVotes: number
  rejectedVotes: number
  reportedStreams: number
  totalStreams: number
  candidates: CandidateVoteSummary[]  // aggregated totals at this level
  children: ChildResult[]             // breakdown by child entities
}

/**
 * Get the candidate lookup for a position.
 */
async function getCandidatesForPosition(positionId: string) {
  return prisma.candidate.findMany({
    where: { positionId },
    select: { id: true, name: true, party: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  })
}

/**
 * Helper to aggregate stream results from a list of stream IDs.
 */
function aggregateVotes(
  streamResults: { totalVotes: number | null; rejectedVotes: number | null; votes: { candidateId: string; votes: number }[] }[]
) {
  const candidateMap = new Map<string, number>()
  let totalVotes = 0
  let rejectedVotes = 0

  for (const sr of streamResults) {
    totalVotes += sr.totalVotes ?? 0
    rejectedVotes += sr.rejectedVotes ?? 0
    for (const v of sr.votes) {
      candidateMap.set(v.candidateId, (candidateMap.get(v.candidateId) ?? 0) + v.votes)
    }
  }

  return { totalVotes, rejectedVotes, candidateMap }
}

/**
 * National level — break down by county.
 */
export async function getDrillDownNational(
  electionId: string,
  positionId: string,
): Promise<DrillDownResult> {
  try {
    const position = await prisma.electionPosition.findUniqueOrThrow({
      where: { id: positionId },
      select: { id: true, title: true, type: true, aggregationLevel: true },
    })
    const candidates = await getCandidatesForPosition(positionId)

    // Get all counties that have wards in this election
    const counties = await prisma.county.findMany({
      orderBy: { name: "asc" },
      include: {
        constituencies: {
          include: {
            wards: {
              where: { electionId },
              select: { id: true },
            },
          },
        },
      },
    })

    // Get ALL submitted/verified stream results for this position in this election
    const streamResults = await prisma.streamResult.findMany({
      where: {
        positionId,
        status: { in: ["SUBMITTED", "VERIFIED"] },
        stream: {
          pollingStation: {
            wardRef: { electionId },
          },
        },
      },
      include: {
        votes: { select: { candidateId: true, votes: true } },
        stream: {
          select: {
            pollingStation: {
              select: {
                wardRef: {
                  select: {
                    constituency: {
                      select: { countyId: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Total streams in election for this position
    const totalStreams = await prisma.stream.count({
      where: {
        isActive: true,
        pollingStation: { wardRef: { electionId } },
      },
    })

    // Group stream results by county
    const byCounty = new Map<string, typeof streamResults>()
    for (const sr of streamResults) {
      const countyId = sr.stream.pollingStation.wardRef?.constituency?.countyId
      if (!countyId) continue
      const arr = byCounty.get(countyId) ?? []
      arr.push(sr)
      byCounty.set(countyId, arr)
    }

    // Count streams per county
    const streamsByCounty = new Map<string, number>()
    // We need to map pollingStationId → countyId
    const stationToCounty = new Map<string, string>()
    const allStations = await prisma.pollingStation.findMany({
      where: { wardRef: { electionId } },
      select: {
        id: true,
        wardRef: {
          select: { constituency: { select: { countyId: true } } },
        },
      },
    })
    for (const s of allStations) {
      stationToCounty.set(s.id, s.wardRef.constituency.countyId)
    }
    // Count active streams per county
    const allStreams = await prisma.stream.findMany({
      where: { isActive: true, pollingStation: { wardRef: { electionId } } },
      select: { pollingStationId: true },
    })
    for (const s of allStreams) {
      const countyId = stationToCounty.get(s.pollingStationId)
      if (countyId) {
        streamsByCounty.set(countyId, (streamsByCounty.get(countyId) ?? 0) + 1)
      }
    }

    // Overall aggregation
    const overall = aggregateVotes(streamResults)

    const children: ChildResult[] = counties
      .filter((c) => c.constituencies.some((con) => con.wards.length > 0))
      .map((county) => {
        const countyResults = byCounty.get(county.id) ?? []
        const agg = aggregateVotes(countyResults)

        return {
          entityId: county.id,
          entityName: county.name,
          entityCode: county.code,
          totalVotes: agg.totalVotes,
          rejectedVotes: agg.rejectedVotes,
          reportedStreams: countyResults.length,
          totalStreams: streamsByCounty.get(county.id) ?? 0,
          candidates: candidates.map((c) => ({
            candidateId: c.id,
            name: c.name,
            party: c.party,
            votes: agg.candidateMap.get(c.id) ?? 0,
          })).sort((a, b) => b.votes - a.votes),
        }
      })

    return {
      positionId: position.id,
      positionTitle: position.title,
      positionType: position.type,
      aggregationLevel: position.aggregationLevel,
      level: "NATIONAL",
      levelLabel: "Counties",
      parentName: null,
      breadcrumb: [{ id: "national", name: "National", level: "NATIONAL" }],
      totalVotes: overall.totalVotes,
      rejectedVotes: overall.rejectedVotes,
      reportedStreams: streamResults.length,
      totalStreams,
      candidates: candidates.map((c) => ({
        candidateId: c.id,
        name: c.name,
        party: c.party,
        votes: overall.candidateMap.get(c.id) ?? 0,
      })).sort((a, b) => b.votes - a.votes),
      children,
    }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * County level — break down by constituency.
 */
export async function getDrillDownCounty(
  electionId: string,
  positionId: string,
  countyId: string,
): Promise<DrillDownResult> {
  try {
    const position = await prisma.electionPosition.findUniqueOrThrow({
      where: { id: positionId },
      select: { id: true, title: true, type: true, aggregationLevel: true },
    })
    const candidates = await getCandidatesForPosition(positionId)
    const county = await prisma.county.findUniqueOrThrow({
      where: { id: countyId },
      select: { id: true, name: true },
    })

    const constituencies = await prisma.constituency.findMany({
      where: { countyId },
      orderBy: { name: "asc" },
      include: {
        wards: { where: { electionId }, select: { id: true } },
      },
    })

    const wardIds = constituencies.flatMap((c) => c.wards.map((w) => w.id))

    const streamResults = await prisma.streamResult.findMany({
      where: {
        positionId,
        status: { in: ["SUBMITTED", "VERIFIED"] },
        stream: { pollingStation: { wardId: { in: wardIds } } },
      },
      include: {
        votes: { select: { candidateId: true, votes: true } },
        stream: { select: { pollingStation: { select: { wardRef: { select: { constituencyId: true } } } } } },
      },
    })

    const totalStreams = await prisma.stream.count({
      where: { isActive: true, pollingStation: { wardId: { in: wardIds } } },
    })

    // Group by constituency
    const byConstituency = new Map<string, typeof streamResults>()
    for (const sr of streamResults) {
      const cId = sr.stream.pollingStation.wardRef?.constituencyId
      if (!cId) continue
      const arr = byConstituency.get(cId) ?? []
      arr.push(sr)
      byConstituency.set(cId, arr)
    }

    // Streams per constituency
    const streamsByConstituency = new Map<string, number>()
    for (const con of constituencies) {
      const conWardIds = con.wards.map((w) => w.id)
      if (conWardIds.length > 0) {
        const count = await prisma.stream.count({
          where: { isActive: true, pollingStation: { wardId: { in: conWardIds } } },
        })
        streamsByConstituency.set(con.id, count)
      }
    }

    const overall = aggregateVotes(streamResults)

    const children: ChildResult[] = constituencies
      .filter((c) => c.wards.length > 0)
      .map((con) => {
        const conResults = byConstituency.get(con.id) ?? []
        const agg = aggregateVotes(conResults)
        return {
          entityId: con.id,
          entityName: con.name,
          entityCode: con.code,
          totalVotes: agg.totalVotes,
          rejectedVotes: agg.rejectedVotes,
          reportedStreams: conResults.length,
          totalStreams: streamsByConstituency.get(con.id) ?? 0,
          candidates: candidates.map((c) => ({
            candidateId: c.id, name: c.name, party: c.party,
            votes: agg.candidateMap.get(c.id) ?? 0,
          })).sort((a, b) => b.votes - a.votes),
        }
      })

    return {
      positionId: position.id,
      positionTitle: position.title,
      positionType: position.type,
      aggregationLevel: position.aggregationLevel,
      level: "COUNTY",
      levelLabel: "Constituencies",
      parentName: county.name,
      breadcrumb: [
        { id: "national", name: "National", level: "NATIONAL" },
        { id: countyId, name: county.name, level: "COUNTY" },
      ],
      totalVotes: overall.totalVotes,
      rejectedVotes: overall.rejectedVotes,
      reportedStreams: streamResults.length,
      totalStreams,
      candidates: candidates.map((c) => ({
        candidateId: c.id, name: c.name, party: c.party,
        votes: overall.candidateMap.get(c.id) ?? 0,
      })).sort((a, b) => b.votes - a.votes),
      children,
    }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Constituency level — break down by ward.
 */
export async function getDrillDownConstituency(
  electionId: string,
  positionId: string,
  constituencyId: string,
): Promise<DrillDownResult> {
  try {
    const position = await prisma.electionPosition.findUniqueOrThrow({
      where: { id: positionId },
      select: { id: true, title: true, type: true, aggregationLevel: true },
    })
    const candidates = await getCandidatesForPosition(positionId)
    const constituency = await prisma.constituency.findUniqueOrThrow({
      where: { id: constituencyId },
      include: { county: { select: { id: true, name: true } } },
    })

    const wards = await prisma.ward.findMany({
      where: { constituencyId, electionId },
      orderBy: { name: "asc" },
    })
    const wardIds = wards.map((w) => w.id)

    const streamResults = await prisma.streamResult.findMany({
      where: {
        positionId,
        status: { in: ["SUBMITTED", "VERIFIED"] },
        stream: { pollingStation: { wardId: { in: wardIds } } },
      },
      include: {
        votes: { select: { candidateId: true, votes: true } },
        stream: { select: { pollingStation: { select: { wardId: true } } } },
      },
    })

    const totalStreams = await prisma.stream.count({
      where: { isActive: true, pollingStation: { wardId: { in: wardIds } } },
    })

    const byWard = new Map<string, typeof streamResults>()
    for (const sr of streamResults) {
      const wId = sr.stream.pollingStation.wardId
      const arr = byWard.get(wId) ?? []
      arr.push(sr)
      byWard.set(wId, arr)
    }

    const streamsByWard = new Map<string, number>()
    for (const ward of wards) {
      const count = await prisma.stream.count({
        where: { isActive: true, pollingStation: { wardId: ward.id } },
      })
      streamsByWard.set(ward.id, count)
    }

    const overall = aggregateVotes(streamResults)

    const children: ChildResult[] = wards.map((ward) => {
      const wardResults = byWard.get(ward.id) ?? []
      const agg = aggregateVotes(wardResults)
      return {
        entityId: ward.id,
        entityName: ward.name,
        entityCode: ward.code,
        totalVotes: agg.totalVotes,
        rejectedVotes: agg.rejectedVotes,
        reportedStreams: wardResults.length,
        totalStreams: streamsByWard.get(ward.id) ?? 0,
        candidates: candidates.map((c) => ({
          candidateId: c.id, name: c.name, party: c.party,
          votes: agg.candidateMap.get(c.id) ?? 0,
        })).sort((a, b) => b.votes - a.votes),
      }
    })

    return {
      positionId: position.id,
      positionTitle: position.title,
      positionType: position.type,
      aggregationLevel: position.aggregationLevel,
      level: "CONSTITUENCY",
      levelLabel: "Wards",
      parentName: constituency.name,
      breadcrumb: [
        { id: "national", name: "National", level: "NATIONAL" },
        { id: constituency.county.id, name: constituency.county.name, level: "COUNTY" },
        { id: constituencyId, name: constituency.name, level: "CONSTITUENCY" },
      ],
      totalVotes: overall.totalVotes,
      rejectedVotes: overall.rejectedVotes,
      reportedStreams: streamResults.length,
      totalStreams,
      candidates: candidates.map((c) => ({
        candidateId: c.id, name: c.name, party: c.party,
        votes: overall.candidateMap.get(c.id) ?? 0,
      })).sort((a, b) => b.votes - a.votes),
      children,
    }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Ward level — break down by polling station.
 */
export async function getDrillDownWard(
  electionId: string,
  positionId: string,
  wardId: string,
): Promise<DrillDownResult> {
  try {
    const position = await prisma.electionPosition.findUniqueOrThrow({
      where: { id: positionId },
      select: { id: true, title: true, type: true, aggregationLevel: true },
    })
    const candidates = await getCandidatesForPosition(positionId)
    const ward = await prisma.ward.findUniqueOrThrow({
      where: { id: wardId },
      include: {
        constituency: {
          include: { county: { select: { id: true, name: true } } },
        },
      },
    })

    const stations = await prisma.pollingStation.findMany({
      where: { wardId, deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        streams: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    })

    const stationIds = stations.map((s) => s.id)

    const streamResults = await prisma.streamResult.findMany({
      where: {
        positionId,
        status: { in: ["SUBMITTED", "VERIFIED"] },
        stream: { pollingStationId: { in: stationIds } },
      },
      include: {
        votes: { select: { candidateId: true, votes: true } },
        stream: { select: { pollingStationId: true } },
      },
    })

    const totalStreams = stations.reduce((s, st) => s + st.streams.length, 0)

    const byStation = new Map<string, typeof streamResults>()
    for (const sr of streamResults) {
      const sId = sr.stream.pollingStationId
      const arr = byStation.get(sId) ?? []
      arr.push(sr)
      byStation.set(sId, arr)
    }

    const overall = aggregateVotes(streamResults)

    const children: ChildResult[] = stations.map((station) => {
      const stResults = byStation.get(station.id) ?? []
      const agg = aggregateVotes(stResults)
      return {
        entityId: station.id,
        entityName: station.name,
        entityCode: station.code,
        totalVotes: agg.totalVotes,
        rejectedVotes: agg.rejectedVotes,
        reportedStreams: stResults.length,
        totalStreams: station.streams.length,
        candidates: candidates.map((c) => ({
          candidateId: c.id, name: c.name, party: c.party,
          votes: agg.candidateMap.get(c.id) ?? 0,
        })).sort((a, b) => b.votes - a.votes),
      }
    })

    return {
      positionId: position.id,
      positionTitle: position.title,
      positionType: position.type,
      aggregationLevel: position.aggregationLevel,
      level: "WARD",
      levelLabel: "Polling Stations",
      parentName: ward.name,
      breadcrumb: [
        { id: "national", name: "National", level: "NATIONAL" },
        { id: ward.constituency.county.id, name: ward.constituency.county.name, level: "COUNTY" },
        { id: ward.constituency.id, name: ward.constituency.name, level: "CONSTITUENCY" },
        { id: wardId, name: ward.name, level: "WARD" },
      ],
      totalVotes: overall.totalVotes,
      rejectedVotes: overall.rejectedVotes,
      reportedStreams: streamResults.length,
      totalStreams,
      candidates: candidates.map((c) => ({
        candidateId: c.id, name: c.name, party: c.party,
        votes: overall.candidateMap.get(c.id) ?? 0,
      })).sort((a, b) => b.votes - a.votes),
      children,
    }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Polling station level — break down by stream (leaf level).
 */
export async function getDrillDownStation(
  electionId: string,
  positionId: string,
  stationId: string,
): Promise<DrillDownResult> {
  try {
    const position = await prisma.electionPosition.findUniqueOrThrow({
      where: { id: positionId },
      select: { id: true, title: true, type: true, aggregationLevel: true },
    })
    const candidates = await getCandidatesForPosition(positionId)
    const station = await prisma.pollingStation.findUniqueOrThrow({
      where: { id: stationId },
      include: {
        wardRef: {
          include: {
            constituency: {
              include: { county: { select: { id: true, name: true } } },
            },
          },
        },
      },
    })

    const streams = await prisma.stream.findMany({
      where: { pollingStationId: stationId, isActive: true },
      orderBy: { name: "asc" },
    })

    const streamResults = await prisma.streamResult.findMany({
      where: {
        positionId,
        status: { in: ["SUBMITTED", "VERIFIED"] },
        streamId: { in: streams.map((s) => s.id) },
      },
      include: {
        votes: { select: { candidateId: true, votes: true } },
        stream: { select: { id: true } },
      },
    })

    const byStream = new Map<string, typeof streamResults>()
    for (const sr of streamResults) {
      const arr = byStream.get(sr.stream.id) ?? []
      arr.push(sr)
      byStream.set(sr.stream.id, arr)
    }

    const overall = aggregateVotes(streamResults)

    const children: ChildResult[] = streams.map((stream) => {
      const stResults = byStream.get(stream.id) ?? []
      const agg = aggregateVotes(stResults)
      return {
        entityId: stream.id,
        entityName: stream.name,
        entityCode: stream.code,
        totalVotes: agg.totalVotes,
        rejectedVotes: agg.rejectedVotes,
        reportedStreams: stResults.length,
        totalStreams: 1,
        candidates: candidates.map((c) => ({
          candidateId: c.id, name: c.name, party: c.party,
          votes: agg.candidateMap.get(c.id) ?? 0,
        })).sort((a, b) => b.votes - a.votes),
      }
    })

    return {
      positionId: position.id,
      positionTitle: position.title,
      positionType: position.type,
      aggregationLevel: position.aggregationLevel,
      level: "STATION",
      levelLabel: "Streams",
      parentName: station.name,
      breadcrumb: [
        { id: "national", name: "National", level: "NATIONAL" },
        { id: station.wardRef.constituency.county.id, name: station.wardRef.constituency.county.name, level: "COUNTY" },
        { id: station.wardRef.constituency.id, name: station.wardRef.constituency.name, level: "CONSTITUENCY" },
        { id: station.wardRef.id, name: station.wardRef.name, level: "WARD" },
        { id: stationId, name: station.name, level: "STATION" },
      ],
      totalVotes: overall.totalVotes,
      rejectedVotes: overall.rejectedVotes,
      reportedStreams: streamResults.length,
      totalStreams: streams.length,
      candidates: candidates.map((c) => ({
        candidateId: c.id, name: c.name, party: c.party,
        votes: overall.candidateMap.get(c.id) ?? 0,
      })).sort((a, b) => b.votes - a.votes),
      children,
    }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
