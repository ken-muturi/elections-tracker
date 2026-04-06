"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"

/**
 * Public (no auth) drill-down results service.
 *
 * Hierarchy for drill-down:
 *   National → County → Constituency → Ward → Polling Station → Stream
 *
 * PERF — compared to the previous version:
 *   • N+1 stream.count() loops replaced with a single groupBy query
 *   • All stream results fetched once, grouped in JS (no per-entity re-queries)
 *   • Parallel queries where possible (Promise.all)
 *   • Only the columns we need are selected
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
  positionId: string;
  positionTitle: string;
  positionType: string;
  aggregationLevel: string;
  level: string;
  levelLabel: string;
  parentName: string | null;
  breadcrumb: { id: string; name: string; level: string }[];
  totalVotes: number;
  rejectedVotes: number;
  reportedStreams: number;
  totalStreams: number;
  candidates: CandidateVoteSummary[];
  children: ChildResult[];
};

/** Candidate lookup for a position. */
async function getCandidatesForPosition(positionId: string) {
  return prisma.candidate.findMany({
    where: { positionId },
    select: { id: true, name: true, party: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  })
}

/** Build the CandidateVoteSummary[] from a candidate list + a vote map. */
function buildCandidateSummaries(
  candidates: { id: string; name: string; party: string | null }[],
  voteMap: Map<string, number>,
): CandidateVoteSummary[] {
  return candidates
    .map((c) => ({
      candidateId: c.id,
      name: c.name,
      party: c.party,
      votes: voteMap.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes)
}

// ═══════════════════════════════════════════════════════════════════════════
// National level — break down by county
// ═══════════════════════════════════════════════════════════════════════════

export async function getDrillDownNational(
  electionId: string,
  positionId: string,
): Promise<DrillDownResult> {
  try {
    // All lightweight metadata in parallel
    const [position, candidates, counties] = await Promise.all([
      prisma.electionPosition.findUniqueOrThrow({
        where: { id: positionId },
        select: { id: true, title: true, type: true, aggregationLevel: true },
      }),
      getCandidatesForPosition(positionId),
      prisma.county.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          constituencies: {
            select: {
              id: true,
              wards: { where: { electionId }, select: { id: true } },
            },
          },
        },
      }),
    ]);

    // Only counties that participate in this election
    const activeCounties = counties.filter((c) =>
      c.constituencies.some((con) => con.wards.length > 0),
    );
    // ward → county lookup
    const wardToCounty = new Map<string, string>();
    for (const county of activeCounties) {
      for (const con of county.constituencies) {
        for (const w of con.wards) {
          wardToCounty.set(w.id, county.id);
        }
      }
    }
    const allWardIds = Array.from(wardToCounty.keys());

    // Heavy queries in parallel — all use indexes
    const [streamResults, voteRows, streamCountsByWard] = await Promise.all([
      // Stream result header rows (no votes, no joins)
      prisma.streamResult.findMany({
        where: {
          positionId,
          status: { in: ["SUBMITTED", "VERIFIED"] },
          stream: { pollingStation: { wardId: { in: allWardIds } } },
        },
        select: {
          totalVotes: true,
          rejectedVotes: true,
          stream: { select: { pollingStation: { select: { wardId: true } } } },
        },
      }),
      // Vote rows (flat, no nested joins)
      prisma.streamCandidateVote.findMany({
        where: {
          streamResult: {
            positionId,
            status: { in: ["SUBMITTED", "VERIFIED"] },
            stream: { pollingStation: { wardId: { in: allWardIds } } },
          },
        },
        select: {
          candidateId: true,
          votes: true,
          streamResult: {
            select: {
              stream: {
                select: { pollingStation: { select: { wardId: true } } },
              },
            },
          },
        },
      }),
      // Stream counts grouped by wardId — ONE query, no N+1
      prisma.stream.groupBy({
        by: ["pollingStationId"],
        where: {
          isActive: true,
          pollingStation: { wardId: { in: allWardIds } },
        },
        _count: { id: true },
      }),
    ]);

    // Map pollingStationId → wardId for stream counts
    const stationWardRows = await prisma.pollingStation.findMany({
      where: { wardId: { in: allWardIds } },
      select: { id: true, wardId: true },
    });
    const stationToWard = new Map(stationWardRows.map((s) => [s.id, s.wardId]));

    // Aggregate streams per county
    const streamsByCounty = new Map<string, number>();
    for (const row of streamCountsByWard) {
      const wardId = stationToWard.get(row.pollingStationId);
      const countyId = wardId ? wardToCounty.get(wardId) : undefined;
      if (countyId) {
        streamsByCounty.set(
          countyId,
          (streamsByCounty.get(countyId) ?? 0) + row._count.id,
        );
      }
    }

    // Group vote rows by county
    const votesByCounty = new Map<string, typeof voteRows>();
    const resultsByCounty = new Map<string, typeof streamResults>();

    for (const sr of streamResults) {
      const wardId = sr.stream.pollingStation.wardId;
      const countyId = wardToCounty.get(wardId);
      if (!countyId) continue;
      const arr = resultsByCounty.get(countyId) ?? [];
      arr.push(sr);
      resultsByCounty.set(countyId, arr);
    }
    for (const v of voteRows) {
      const wardId = v.streamResult.stream.pollingStation.wardId;
      const countyId = wardToCounty.get(wardId);
      if (!countyId) continue;
      const arr = votesByCounty.get(countyId) ?? [];
      arr.push(v);
      votesByCounty.set(countyId, arr);
    }

    // Overall aggregation
    const overallVoteMap = new Map<string, number>();
    for (const v of voteRows) {
      overallVoteMap.set(
        v.candidateId,
        (overallVoteMap.get(v.candidateId) ?? 0) + v.votes,
      );
    }
    let overallTotalVotes = 0;
    let overallRejected = 0;
    for (const sr of streamResults) {
      overallTotalVotes += sr.totalVotes ?? 0;
      overallRejected += sr.rejectedVotes ?? 0;
    }
    const totalStreams = Array.from(streamsByCounty.values()).reduce(
      (a, b) => a + b,
      0,
    );

    const children: ChildResult[] = activeCounties.map((county) => {
      const cVotes = votesByCounty.get(county.id) ?? [];
      const cResults = resultsByCounty.get(county.id) ?? [];
      const cMap = new Map<string, number>();
      for (const v of cVotes)
        cMap.set(v.candidateId, (cMap.get(v.candidateId) ?? 0) + v.votes);
      let cTotal = 0,
        cRejected = 0;
      for (const r of cResults) {
        cTotal += r.totalVotes ?? 0;
        cRejected += r.rejectedVotes ?? 0;
      }

      return {
        entityId: county.id,
        entityName: county.name,
        entityCode: county.code,
        totalVotes: cTotal,
        rejectedVotes: cRejected,
        reportedStreams: cResults.length,
        totalStreams: streamsByCounty.get(county.id) ?? 0,
        candidates: buildCandidateSummaries(candidates, cMap),
      };
    });

    return {
      positionId: position.id,
      positionTitle: position.title,
      positionType: position.type,
      aggregationLevel: position.aggregationLevel,
      level: "NATIONAL",
      levelLabel: "Counties",
      parentName: null,
      breadcrumb: [{ id: "national", name: "National", level: "NATIONAL" }],
      totalVotes: overallTotalVotes,
      rejectedVotes: overallRejected,
      reportedStreams: streamResults.length,
      totalStreams,
      candidates: buildCandidateSummaries(candidates, overallVoteMap),
      children,
    };
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// County level — break down by constituency
// ═══════════════════════════════════════════════════════════════════════════

export async function getDrillDownCounty(
  electionId: string,
  positionId: string,
  countyId: string,
): Promise<DrillDownResult> {
  try {
    const [position, candidates, county, constituencies] = await Promise.all([
      prisma.electionPosition.findUniqueOrThrow({
        where: { id: positionId },
        select: { id: true, title: true, type: true, aggregationLevel: true },
      }),
      getCandidatesForPosition(positionId),
      prisma.county.findUniqueOrThrow({
        where: { id: countyId },
        select: { id: true, name: true },
      }),
      prisma.constituency.findMany({
        where: { countyId },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          wards: { where: { electionId }, select: { id: true } },
        },
      }),
    ]);

    const activeConstituencies = constituencies.filter(
      (c) => c.wards.length > 0,
    );
    // ward → constituency lookup
    const wardToConstituency = new Map<string, string>();
    for (const con of activeConstituencies) {
      for (const w of con.wards) wardToConstituency.set(w.id, con.id);
    }
    const allWardIds = Array.from(wardToConstituency.keys());

    const [streamResults, voteRows, streamCountGroups, stationWardRows] =
      await Promise.all([
        prisma.streamResult.findMany({
          where: {
            positionId,
            status: { in: ["SUBMITTED", "VERIFIED"] },
            stream: { pollingStation: { wardId: { in: allWardIds } } },
          },
          select: {
            totalVotes: true,
            rejectedVotes: true,
            stream: {
              select: { pollingStation: { select: { wardId: true } } },
            },
          },
        }),
        prisma.streamCandidateVote.findMany({
          where: {
            streamResult: {
              positionId,
              status: { in: ["SUBMITTED", "VERIFIED"] },
              stream: { pollingStation: { wardId: { in: allWardIds } } },
            },
          },
          select: {
            candidateId: true,
            votes: true,
            streamResult: {
              select: {
                stream: {
                  select: { pollingStation: { select: { wardId: true } } },
                },
              },
            },
          },
        }),
        prisma.stream.groupBy({
          by: ["pollingStationId"],
          where: {
            isActive: true,
            pollingStation: { wardId: { in: allWardIds } },
          },
          _count: { id: true },
        }),
        prisma.pollingStation.findMany({
          where: { wardId: { in: allWardIds } },
          select: { id: true, wardId: true },
        }),
      ]);

    const stationToWard = new Map(stationWardRows.map((s) => [s.id, s.wardId]));

    // Batch stream counts per constituency
    const streamsByConstituency = new Map<string, number>();
    for (const row of streamCountGroups) {
      const wardId = stationToWard.get(row.pollingStationId);
      const conId = wardId ? wardToConstituency.get(wardId) : undefined;
      if (conId)
        streamsByConstituency.set(
          conId,
          (streamsByConstituency.get(conId) ?? 0) + row._count.id,
        );
    }

    // Group by constituency
    const votesByCon = new Map<string, typeof voteRows>();
    const resultsByCon = new Map<string, typeof streamResults>();
    for (const sr of streamResults) {
      const conId = wardToConstituency.get(sr.stream.pollingStation.wardId);
      if (!conId) continue;
      const arr = resultsByCon.get(conId) ?? [];
      arr.push(sr);
      resultsByCon.set(conId, arr);
    }
    for (const v of voteRows) {
      const conId = wardToConstituency.get(
        v.streamResult.stream.pollingStation.wardId,
      );
      if (!conId) continue;
      const arr = votesByCon.get(conId) ?? [];
      arr.push(v);
      votesByCon.set(conId, arr);
    }

    const overallVoteMap = new Map<string, number>();
    for (const v of voteRows)
      overallVoteMap.set(
        v.candidateId,
        (overallVoteMap.get(v.candidateId) ?? 0) + v.votes,
      );
    let overallTotal = 0,
      overallRejected = 0;
    for (const sr of streamResults) {
      overallTotal += sr.totalVotes ?? 0;
      overallRejected += sr.rejectedVotes ?? 0;
    }
    const totalStreams = Array.from(streamsByConstituency.values()).reduce(
      (a, b) => a + b,
      0,
    );

    const children: ChildResult[] = activeConstituencies.map((con) => {
      const cVotes = votesByCon.get(con.id) ?? [];
      const cResults = resultsByCon.get(con.id) ?? [];
      const cMap = new Map<string, number>();
      for (const v of cVotes)
        cMap.set(v.candidateId, (cMap.get(v.candidateId) ?? 0) + v.votes);
      let cTotal = 0,
        cRejected = 0;
      for (const r of cResults) {
        cTotal += r.totalVotes ?? 0;
        cRejected += r.rejectedVotes ?? 0;
      }
      return {
        entityId: con.id,
        entityName: con.name,
        entityCode: con.code,
        totalVotes: cTotal,
        rejectedVotes: cRejected,
        reportedStreams: cResults.length,
        totalStreams: streamsByConstituency.get(con.id) ?? 0,
        candidates: buildCandidateSummaries(candidates, cMap),
      };
    });

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
      totalVotes: overallTotal,
      rejectedVotes: overallRejected,
      reportedStreams: streamResults.length,
      totalStreams,
      candidates: buildCandidateSummaries(candidates, overallVoteMap),
      children,
    };
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Constituency level — break down by ward
// ═══════════════════════════════════════════════════════════════════════════

export async function getDrillDownConstituency(
  electionId: string,
  positionId: string,
  constituencyId: string,
): Promise<DrillDownResult> {
  try {
    const [position, candidates, constituency, wards] = await Promise.all([
      prisma.electionPosition.findUniqueOrThrow({
        where: { id: positionId },
        select: { id: true, title: true, type: true, aggregationLevel: true },
      }),
      getCandidatesForPosition(positionId),
      prisma.constituency.findUniqueOrThrow({
        where: { id: constituencyId },
        include: { county: { select: { id: true, name: true } } },
      }),
      prisma.ward.findMany({
        where: { constituencyId, electionId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const wardIds = wards.map((w) => w.id);

    // All heavy queries in parallel — no N+1 loops
    const [streamResults, voteRows, streamCountGroups, stationWardRows] =
      await Promise.all([
        prisma.streamResult.findMany({
          where: {
            positionId,
            status: { in: ["SUBMITTED", "VERIFIED"] },
            stream: { pollingStation: { wardId: { in: wardIds } } },
          },
          select: {
            totalVotes: true,
            rejectedVotes: true,
            stream: {
              select: { pollingStation: { select: { wardId: true } } },
            },
          },
        }),
        prisma.streamCandidateVote.findMany({
          where: {
            streamResult: {
              positionId,
              status: { in: ["SUBMITTED", "VERIFIED"] },
              stream: { pollingStation: { wardId: { in: wardIds } } },
            },
          },
          select: {
            candidateId: true,
            votes: true,
            streamResult: {
              select: {
                stream: {
                  select: { pollingStation: { select: { wardId: true } } },
                },
              },
            },
          },
        }),
        // ONE groupBy instead of N ward.count() calls
        prisma.stream.groupBy({
          by: ["pollingStationId"],
          where: {
            isActive: true,
            pollingStation: { wardId: { in: wardIds } },
          },
          _count: { id: true },
        }),
        prisma.pollingStation.findMany({
          where: { wardId: { in: wardIds } },
          select: { id: true, wardId: true },
        }),
      ]);

    const stationToWard = new Map(stationWardRows.map((s) => [s.id, s.wardId]));

    const streamsByWard = new Map<string, number>();
    for (const row of streamCountGroups) {
      const wardId = stationToWard.get(row.pollingStationId);
      if (wardId)
        streamsByWard.set(
          wardId,
          (streamsByWard.get(wardId) ?? 0) + row._count.id,
        );
    }

    const votesByWard = new Map<string, typeof voteRows>();
    const resultsByWard = new Map<string, typeof streamResults>();
    for (const sr of streamResults) {
      const wId = sr.stream.pollingStation.wardId;
      const arr = resultsByWard.get(wId) ?? [];
      arr.push(sr);
      resultsByWard.set(wId, arr);
    }
    for (const v of voteRows) {
      const wId = v.streamResult.stream.pollingStation.wardId;
      const arr = votesByWard.get(wId) ?? [];
      arr.push(v);
      votesByWard.set(wId, arr);
    }

    const overallVoteMap = new Map<string, number>();
    for (const v of voteRows)
      overallVoteMap.set(
        v.candidateId,
        (overallVoteMap.get(v.candidateId) ?? 0) + v.votes,
      );
    let overallTotal = 0,
      overallRejected = 0;
    for (const sr of streamResults) {
      overallTotal += sr.totalVotes ?? 0;
      overallRejected += sr.rejectedVotes ?? 0;
    }
    const totalStreams = Array.from(streamsByWard.values()).reduce(
      (a, b) => a + b,
      0,
    );

    const children: ChildResult[] = wards.map((ward) => {
      const wVotes = votesByWard.get(ward.id) ?? [];
      const wResults = resultsByWard.get(ward.id) ?? [];
      const wMap = new Map<string, number>();
      for (const v of wVotes)
        wMap.set(v.candidateId, (wMap.get(v.candidateId) ?? 0) + v.votes);
      let wTotal = 0,
        wRejected = 0;
      for (const r of wResults) {
        wTotal += r.totalVotes ?? 0;
        wRejected += r.rejectedVotes ?? 0;
      }
      return {
        entityId: ward.id,
        entityName: ward.name,
        entityCode: ward.code,
        totalVotes: wTotal,
        rejectedVotes: wRejected,
        reportedStreams: wResults.length,
        totalStreams: streamsByWard.get(ward.id) ?? 0,
        candidates: buildCandidateSummaries(candidates, wMap),
      };
    });

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
        {
          id: constituency.county.id,
          name: constituency.county.name,
          level: "COUNTY",
        },
        { id: constituencyId, name: constituency.name, level: "CONSTITUENCY" },
      ],
      totalVotes: overallTotal,
      rejectedVotes: overallRejected,
      reportedStreams: streamResults.length,
      totalStreams,
      candidates: buildCandidateSummaries(candidates, overallVoteMap),
      children,
    };
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Ward level — break down by polling station
// ═══════════════════════════════════════════════════════════════════════════

export async function getDrillDownWard(
  electionId: string,
  positionId: string,
  wardId: string,
): Promise<DrillDownResult> {
  try {
    const [position, candidates, ward] = await Promise.all([
      prisma.electionPosition.findUniqueOrThrow({
        where: { id: positionId },
        select: { id: true, title: true, type: true, aggregationLevel: true },
      }),
      getCandidatesForPosition(positionId),
      prisma.ward.findUniqueOrThrow({
        where: { id: wardId },
        include: {
          constituency: {
            include: { county: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    // Stations + stream counts in one query via include
    const stations = await prisma.pollingStation.findMany({
      where: { wardId, deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        streams: { where: { isActive: true }, select: { id: true } },
      },
    });
    const stationIds = stations.map((s) => s.id);

    const [streamResults, voteRows] = await Promise.all([
      prisma.streamResult.findMany({
        where: {
          positionId,
          status: { in: ["SUBMITTED", "VERIFIED"] },
          stream: { pollingStationId: { in: stationIds } },
        },
        select: {
          totalVotes: true,
          rejectedVotes: true,
          stream: { select: { pollingStationId: true } },
        },
      }),
      prisma.streamCandidateVote.findMany({
        where: {
          streamResult: {
            positionId,
            status: { in: ["SUBMITTED", "VERIFIED"] },
            stream: { pollingStationId: { in: stationIds } },
          },
        },
        select: {
          candidateId: true,
          votes: true,
          streamResult: {
            select: { stream: { select: { pollingStationId: true } } },
          },
        },
      }),
    ]);

    const totalStreams = stations.reduce((s, st) => s + st.streams.length, 0);

    const votesByStation = new Map<string, typeof voteRows>();
    const resultsByStation = new Map<string, typeof streamResults>();
    for (const sr of streamResults) {
      const sId = sr.stream.pollingStationId;
      const arr = resultsByStation.get(sId) ?? [];
      arr.push(sr);
      resultsByStation.set(sId, arr);
    }
    for (const v of voteRows) {
      const sId = v.streamResult.stream.pollingStationId;
      const arr = votesByStation.get(sId) ?? [];
      arr.push(v);
      votesByStation.set(sId, arr);
    }

    const overallVoteMap = new Map<string, number>();
    for (const v of voteRows)
      overallVoteMap.set(
        v.candidateId,
        (overallVoteMap.get(v.candidateId) ?? 0) + v.votes,
      );
    let overallTotal = 0,
      overallRejected = 0;
    for (const sr of streamResults) {
      overallTotal += sr.totalVotes ?? 0;
      overallRejected += sr.rejectedVotes ?? 0;
    }

    const children: ChildResult[] = stations.map((station) => {
      const sVotes = votesByStation.get(station.id) ?? [];
      const sResults = resultsByStation.get(station.id) ?? [];
      const sMap = new Map<string, number>();
      for (const v of sVotes)
        sMap.set(v.candidateId, (sMap.get(v.candidateId) ?? 0) + v.votes);
      let sTotal = 0,
        sRejected = 0;
      for (const r of sResults) {
        sTotal += r.totalVotes ?? 0;
        sRejected += r.rejectedVotes ?? 0;
      }
      return {
        entityId: station.id,
        entityName: station.name,
        entityCode: station.code,
        totalVotes: sTotal,
        rejectedVotes: sRejected,
        reportedStreams: sResults.length,
        totalStreams: station.streams.length,
        candidates: buildCandidateSummaries(candidates, sMap),
      };
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
        {
          id: ward.constituency.county.id,
          name: ward.constituency.county.name,
          level: "COUNTY",
        },
        {
          id: ward.constituency.id,
          name: ward.constituency.name,
          level: "CONSTITUENCY",
        },
        { id: wardId, name: ward.name, level: "WARD" },
      ],
      totalVotes: overallTotal,
      rejectedVotes: overallRejected,
      reportedStreams: streamResults.length,
      totalStreams,
      candidates: buildCandidateSummaries(candidates, overallVoteMap),
      children,
    };
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Polling station level — break down by stream (leaf)
// ═══════════════════════════════════════════════════════════════════════════

export async function getDrillDownStation(
  electionId: string,
  positionId: string,
  stationId: string,
): Promise<DrillDownResult> {
  try {
    const [position, candidates, station] = await Promise.all([
      prisma.electionPosition.findUniqueOrThrow({
        where: { id: positionId },
        select: { id: true, title: true, type: true, aggregationLevel: true },
      }),
      getCandidatesForPosition(positionId),
      prisma.pollingStation.findUniqueOrThrow({
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
      }),
    ]);

    const streams = await prisma.stream.findMany({
      where: { pollingStationId: stationId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    });

    const streamIds = streams.map((s) => s.id);

    const [streamResults, voteRows] = await Promise.all([
      prisma.streamResult.findMany({
        where: {
          positionId,
          status: { in: ["SUBMITTED", "VERIFIED"] },
          streamId: { in: streamIds },
        },
        select: { totalVotes: true, rejectedVotes: true, streamId: true },
      }),
      prisma.streamCandidateVote.findMany({
        where: {
          streamResult: {
            positionId,
            status: { in: ["SUBMITTED", "VERIFIED"] },
            streamId: { in: streamIds },
          },
        },
        select: {
          candidateId: true,
          votes: true,
          streamResult: { select: { streamId: true } },
        },
      }),
    ]);

    const votesByStream = new Map<string, typeof voteRows>();
    const resultsByStream = new Map<string, typeof streamResults>();
    for (const sr of streamResults) {
      const arr = resultsByStream.get(sr.streamId) ?? [];
      arr.push(sr);
      resultsByStream.set(sr.streamId, arr);
    }
    for (const v of voteRows) {
      const sId = v.streamResult.streamId;
      const arr = votesByStream.get(sId) ?? [];
      arr.push(v);
      votesByStream.set(sId, arr);
    }

    const overallVoteMap = new Map<string, number>();
    for (const v of voteRows)
      overallVoteMap.set(
        v.candidateId,
        (overallVoteMap.get(v.candidateId) ?? 0) + v.votes,
      );
    let overallTotal = 0,
      overallRejected = 0;
    for (const sr of streamResults) {
      overallTotal += sr.totalVotes ?? 0;
      overallRejected += sr.rejectedVotes ?? 0;
    }

    const children: ChildResult[] = streams.map((stream) => {
      const sVotes = votesByStream.get(stream.id) ?? [];
      const sResults = resultsByStream.get(stream.id) ?? [];
      const sMap = new Map<string, number>();
      for (const v of sVotes)
        sMap.set(v.candidateId, (sMap.get(v.candidateId) ?? 0) + v.votes);
      let sTotal = 0,
        sRejected = 0;
      for (const r of sResults) {
        sTotal += r.totalVotes ?? 0;
        sRejected += r.rejectedVotes ?? 0;
      }
      return {
        entityId: stream.id,
        entityName: stream.name,
        entityCode: stream.code,
        totalVotes: sTotal,
        rejectedVotes: sRejected,
        reportedStreams: sResults.length,
        totalStreams: 1,
        candidates: buildCandidateSummaries(candidates, sMap),
      };
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
        {
          id: station.wardRef.constituency.county.id,
          name: station.wardRef.constituency.county.name,
          level: "COUNTY",
        },
        {
          id: station.wardRef.constituency.id,
          name: station.wardRef.constituency.name,
          level: "CONSTITUENCY",
        },
        { id: station.wardRef.id, name: station.wardRef.name, level: "WARD" },
        { id: stationId, name: station.name, level: "STATION" },
      ],
      totalVotes: overallTotal,
      rejectedVotes: overallRejected,
      reportedStreams: streamResults.length,
      totalStreams: streams.length,
      candidates: buildCandidateSummaries(candidates, overallVoteMap),
      children,
    };
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
