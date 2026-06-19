/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { AggregationLevel, ResultStatus } from "@prisma/client"
import { requireAdmin } from "./Authorization"

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

/**
 * Compute the total registered voter count for any geographic entity by
 * summing pollingStation.registeredVoters across all stations under it.
 * Returns null if no data is available (no stations have registeredVoters set).
 */
async function fetchRegisteredVotersCap(
  level: AggregationLevel,
  entityId: string,
  electionId?: string,
): Promise<number | null> {
  const sumStations = async (where: Record<string, unknown>) => {
    const r = await prisma.pollingStation.aggregate({
      where: { ...where, deletedAt: null },
      _sum: { registeredVoters: true },
    })
    return r._sum.registeredVoters
  }

  if (level === "POLLING_STATION") {
    // For a single station, use its own field first, then fall back to summing streams
    const station = await prisma.pollingStation.findUnique({
      where: { id: entityId },
      select: { registeredVoters: true },
    })
    return station?.registeredVoters ?? null
  }

  if (level === "WARD") {
    return sumStations({ wardId: entityId })
  }

  if (level === "CONSTITUENCY") {
    const wards = await prisma.ward.findMany({
      where: { constituencyId: entityId },
      select: { id: true },
    })
    return sumStations({ wardId: { in: wards.map((w) => w.id) } })
  }

  if (level === "COUNTY") {
    const constituencies = await prisma.constituency.findMany({
      where: { countyId: entityId },
      select: { id: true },
    })
    const wards = await prisma.ward.findMany({
      where: { constituencyId: { in: constituencies.map((c) => c.id) } },
      select: { id: true },
    })
    return sumStations({ wardId: { in: wards.map((w) => w.id) } })
  }

  if (level === "NATIONAL") {
    const where = electionId
      ? { electionActivations: { some: { electionId, isActive: true } } }
      : {}
    return sumStations(where)
  }

  return null
}

/**
 * Returns the total registered voter count for any geographic entity.
 * Used by the client to show the cap in the vote entry form.
 */
export const getRegisteredVotersForEntity = async (
  level: AggregationLevel,
  entityId: string,
  electionId?: string,
): Promise<number | null> => {
  try {
    return await fetchRegisteredVotersCap(level, entityId, electionId)
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Upsert a level result (create or update).
 * Wrapped in a Prisma transaction for atomicity.
 * When status is SUBMITTED, `submittedAt` is set automatically.
 */
export const upsertLevelResult = async (input: LevelResultInput, status: ResultStatus = "DRAFT") => {
  try {
    const user = await requireAdmin()
    const role = (user.role ?? "").toLowerCase()

    const submittedAt = status === "SUBMITTED" ? new Date() : undefined

    // ── Server-side voter cap: only enforced on SUBMIT ────────────────────
    if (status === "SUBMITTED" && input.totalVotes != null && input.totalVotes > 0) {
      const cap = await fetchRegisteredVotersCap(input.level, input.entityId)
      if (cap !== null && input.totalVotes > cap) {
        throw new Error(
          `Total votes (${input.totalVotes.toLocaleString()}) exceed the registered voter count for this entity (${cap.toLocaleString()}). Submission rejected.`,
        )
      }
    }

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.levelResult.findUnique({
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
      // Prevent overwriting a VERIFIED result unless you are a super admin
      if (existing.status === "VERIFIED" && role !== "super admin") {
        throw new Error(
          "This result has been verified and can only be modified by a super admin.",
        );
      }
      await tx.levelResult.update({
        where: { id: existing.id },
        data: {
          validatorId: user.id,
          status,
          totalVotes: input.totalVotes,
          rejectedVotes: input.rejectedVotes,
          notes: input.notes,
          imageUrl: input.imageUrl,
          voiceUrl: input.voiceUrl,
          ...(submittedAt ? { submittedAt } : {}),
        },
      });
      resultId = existing.id;
    } else {
      const created = await tx.levelResult.create({
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
          ...(submittedAt ? { submittedAt } : {}),
        },
      });
      resultId = created.id;
    }

      for (const cv of input.votes) {
        await tx.levelCandidateVote.upsert({
          where: { levelResultId_candidateId: { levelResultId: resultId, candidateId: cv.candidateId } },
          create: { levelResultId: resultId, candidateId: cv.candidateId, votes: cv.votes },
          update: { votes: cv.votes },
        })
      }

      return await tx.levelResult.findUnique({
        where: { id: resultId },
        include: { votes: { include: { candidate: true } } },
      })
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * @deprecated Use upsertLevelResult with status "SUBMITTED" instead.
 * Kept for backward compatibility.
 */
export const submitLevelResult = async (levelResultId: string) => {
  try {
    await requireAdmin();
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
    await requireAdmin();
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

    if (level === "POLLING_STATION") {
      // Get all streams in this polling station
      streamResults = await prisma.streamResult.findMany({
        where: {
          positionId,
          stream: { pollingStationId: entityId },
          status: { in: ["SUBMITTED", "VERIFIED"] },
        },
        include: { votes: true },
      })
    } else if (level === "WARD") {
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
 * Lightweight summary for every position in an election — stream stats only,
 * no candidate breakdown. Used to populate the position tab strip on the
 * public results page without loading all candidate data upfront.
 */
export const getElectionPositionsSummary = async (electionId: string) => {
  try {
    const positions = await prisma.electionPosition.findMany({
      where: { electionId },
      select: {
        id: true,
        type: true,
        title: true,
        aggregationLevel: true,
        _count: {
          select: {
            levelResults: { where: { status: { in: ["SUBMITTED", "VERIFIED"] } } },
          },
        },
      },
    });

    const positionIds = positions.map((p) => p.id);
    const [streamStats, totalExpectedRaw] = await Promise.all([
      prisma.streamResult.groupBy({
        by: ["positionId"],
        where: { positionId: { in: positionIds }, status: { in: ["SUBMITTED", "VERIFIED"] } },
        _count: { id: true },
        _sum: { totalVotes: true, rejectedVotes: true },
      }),
      // Count total active streams for the election (same for all positions)
      prisma.stream.count({
        where: { pollingStation: { electionActivations: { some: { electionId, isActive: true } } }, isActive: true },
      }),
    ]);

    const streamStatMap = new Map(
      streamStats.map((r) => [
        r.positionId,
        {
          totalReported: r._count.id,
          totalVotes: r._sum.totalVotes ?? 0,
          rejectedVotes: r._sum.rejectedVotes ?? 0,
        },
      ]),
    );

    return positions.map((p) => ({
      positionId: p.id,
      positionType: p.type,
      positionTitle: p.title,
      aggregationLevel: p.aggregationLevel,
      streamStats: {
        ...(streamStatMap.get(p.id) ?? { totalReported: 0, totalVotes: 0, rejectedVotes: 0 }),
        totalExpected: totalExpectedRaw,
      },
      levelValidations: p._count.levelResults,
    }));
  } catch (error) {
    throw new Error(handleReturnError(error));
  }
};

/**
 * Full candidate results for a single position — called on demand from the
 * client when the user selects a tab. Returns the same shape as one entry
 * from getElectionResults. Only fetches geo data relevant to the position's
 * aggregation level.
 */
export const getElectionResultsByPosition = async (
  electionId: string,
  positionId: string,
) => {
  try {
    const position = await prisma.electionPosition.findUnique({
      where: { id: positionId },
      include: {
        candidates: { orderBy: { sortOrder: "asc" } },
        levelResults: {
          where: { status: { in: ["SUBMITTED", "VERIFIED"] } },
          include: { votes: true },
        },
      },
    });

    if (!position) return null;

    const level = position.aggregationLevel;

    type GeoInfo = { name: string; countyName: string | null; constituencyName: string | null };

    // Build a normalised geo map that includes parent names for hierarchical display.
    // Only fetch the table(s) actually needed for this position's aggregation level.
    const geoPromise: Promise<(GeoInfo & { id: string })[]> =
      level === "COUNTY"
        ? prisma.county
            .findMany({ select: { id: true, name: true } })
            .then((rows) =>
              rows.map((r) => ({
                id: r.id,
                name: r.name,
                countyName: null,
                constituencyName: null,
              })),
            )
        : level === "CONSTITUENCY"
          ? prisma.constituency
              .findMany({
                select: {
                  id: true,
                  name: true,
                  county: { select: { name: true } },
                },
              })
              .then((rows) =>
                rows.map((r) => ({
                  id: r.id,
                  name: r.name,
                  countyName: r.county.name,
                  constituencyName: null,
                })),
              )
          : level === "WARD"
            ? prisma.ward
                .findMany({
                  where: {
                    pollingStations: {
                      some: {
                        electionActivations: {
                          some: { electionId, isActive: true },
                        },
                      },
                    },
                  },
                  select: {
                    id: true,
                    name: true,
                    constituency: {
                      select: {
                        name: true,
                        county: { select: { name: true } },
                      },
                    },
                  },
                })
                .then((rows) =>
                  rows.map((r) => ({
                    id: r.id,
                    name: r.name,
                    countyName: r.constituency.county.name,
                    constituencyName: r.constituency.name,
                  })),
                )
            : Promise.resolve([]);

    const [geoRows, candidateVoteTotals, streamStatRows] = await Promise.all([
      geoPromise,
      prisma.streamCandidateVote.groupBy({
        by: ["candidateId"],
        where: {
          streamResult: { positionId, status: { in: ["SUBMITTED", "VERIFIED"] } },
        },
        _sum: { votes: true },
      }),
      prisma.streamResult.groupBy({
        by: ["positionId"],
        where: { positionId, status: { in: ["SUBMITTED", "VERIFIED"] } },
        _count: { id: true },
        _sum: { totalVotes: true, rejectedVotes: true },
      }),
    ]);

    const geoInfoById = new Map(geoRows.map((r) => [r.id, r as GeoInfo]));
    const candidateVoteMap = new Map(candidateVoteTotals.map((r) => [r.candidateId, r._sum.votes ?? 0]));

    const levelAgg = new Map<string, number>();
    const levelTotals = new Map<string, { totalVotes: number; rejectedVotes: number }>();
    for (const lr of position.levelResults) {
      for (const v of lr.votes) {
        levelAgg.set(v.candidateId, (levelAgg.get(v.candidateId) ?? 0) + v.votes);
      }
      const existing = levelTotals.get(lr.entityId) ?? { totalVotes: 0, rejectedVotes: 0 };
      levelTotals.set(lr.entityId, {
        totalVotes: existing.totalVotes + (lr.totalVotes ?? 0),
        rejectedVotes: existing.rejectedVotes + (lr.rejectedVotes ?? 0),
      });
    }

    const resolveGeoInfo = (entityId: string | null): GeoInfo => {
      if (level === "NATIONAL" || entityId === null)
        return { name: "National", countyName: null, constituencyName: null };
      return geoInfoById.get(entityId) ?? { name: entityId, countyName: null, constituencyName: null };
    };

    const entityMap = new Map<string, {
      entityId: string;
      entityName: string;
      countyName: string | null;
      constituencyName: string | null;
      candidates: { id: string; name: string; party: string | null; streamVotes: number; levelVotes: number }[];
    }>();

    for (const c of position.candidates) {
      const rawEntityId = level === "NATIONAL" ? "national" : (c.entityId ?? "national");
      const geo = resolveGeoInfo(rawEntityId === "national" ? null : rawEntityId);
      if (!entityMap.has(rawEntityId)) {
        entityMap.set(rawEntityId, {
          entityId: rawEntityId,
          entityName: geo.name,
          countyName: geo.countyName,
          constituencyName: geo.constituencyName,
          candidates: [],
        });
      }
      entityMap.get(rawEntityId)!.candidates.push({
        id: c.id,
        name: c.name,
        party: c.party,
        streamVotes: candidateVoteMap.get(c.id) ?? 0,
        levelVotes: levelAgg.get(c.id) ?? 0,
      });
    }

    for (const entity of entityMap.values()) {
      entity.candidates.sort((a, b) => b.streamVotes - a.streamVotes);
    }

    const entities = Array.from(entityMap.values())
      .map((entity) => {
        const totals = levelTotals.get(entity.entityId) ?? { totalVotes: 0, rejectedVotes: 0 };
        return {
          entityId: entity.entityId,
          entityName: entity.entityName,
          countyName: entity.countyName,
          constituencyName: entity.constituencyName,
          candidates: entity.candidates,
          totalVotes: totals.totalVotes,
          rejectedVotes: totals.rejectedVotes,
        };
      })
      .sort((a, b) => a.entityName.localeCompare(b.entityName));

    const statsRow = streamStatRows[0];
    const streamStats = statsRow
      ? {
          totalReported: statsRow._count.id,
          totalVotes: statsRow._sum.totalVotes ?? 0,
          rejectedVotes: statsRow._sum.rejectedVotes ?? 0,
        }
      : { totalReported: 0, totalVotes: 0, rejectedVotes: 0 };

    return {
      positionId: position.id,
      positionType: position.type,
      positionTitle: position.title,
      aggregationLevel: level,
      entities,
      streamStats,
      levelValidations: position.levelResults.length,
    };
  } catch (error) {
    throw new Error(handleReturnError(error));
  }
};

/**
 * Full election results view — candidate totals at each position's natural level.
 * MCA per ward, MP per constituency, etc.
 * This is the main public results endpoint.
 *
 * PERF: Uses SQL-level aggregation (groupBy / _sum / _count) instead of
 * loading every StreamResult + votes row into Node.js memory.
 * Old approach: O(streams × candidates) rows transferred.
 * New approach: O(positions + candidates) rows — orders of magnitude less.
 */
export const getElectionResults = async (electionId: string) => {
  try {
    // 1. Light metadata: positions + candidates (small)
    // 2. SQL-level aggregation: stream vote totals grouped by candidate
    // 3. SQL-level aggregation: stream-result stats (count, sum) per position
    // 4. Level results — already small, kept as-is

    const [counties, constituencies, wards, positions, totalExpected] = await Promise.all([
      prisma.county.findMany({ select: { id: true, name: true } }),
      prisma.constituency.findMany({ select: { id: true, name: true } }),
      prisma.ward.findMany({
        where: {
          pollingStations: {
            some: {
              electionActivations: { some: { electionId, isActive: true } },
            },
          },
        },
        select: { id: true, name: true },
      }),
      prisma.electionPosition.findMany({
        where: { electionId },
        include: {
          candidates: { orderBy: { sortOrder: "asc" } },
          levelResults: {
            where: { status: { in: ["SUBMITTED", "VERIFIED"] } },
            include: { votes: true },
          },
        },
      }),
      prisma.stream.count({
        where: {
          pollingStation: {
            electionActivations: { some: { electionId, isActive: true } },
          },
        },
      }),
    ]);

    const positionIds = positions.map((p) => p.id);

    // ── SQL aggregation: vote totals per candidate ───────────────────────
    // One query replaces loading ALL StreamResult + StreamCandidateVote rows.
    const [candidateVoteTotals, streamStats] = await Promise.all([
      prisma.streamCandidateVote.groupBy({
        by: ["candidateId"],
        where: {
          streamResult: {
            positionId: { in: positionIds },
            status: { in: ["SUBMITTED", "VERIFIED"] },
          },
        },
        _sum: { votes: true },
      }),
      // ── SQL aggregation: stream stats per position ─────────────────────
      prisma.streamResult.groupBy({
        by: ["positionId"],
        where: {
          positionId: { in: positionIds },
          status: { in: ["SUBMITTED", "VERIFIED"] },
        },
        _count: { id: true },
        _sum: { totalVotes: true, rejectedVotes: true },
      }),
    ]);

    // Build fast lookup maps
    const candidateVoteMap = new Map(
      candidateVoteTotals.map((r) => [r.candidateId, r._sum.votes ?? 0]),
    );
    const streamStatMap = new Map(
      streamStats.map((r) => [
        r.positionId,
        {
          totalReported: r._count.id,
          totalVotes: r._sum.totalVotes ?? 0,
          rejectedVotes: r._sum.rejectedVotes ?? 0,
        },
      ]),
    );

    const countyNameById = new Map(counties.map((c) => [c.id, c.name]));
    const constituencyNameById = new Map(
      constituencies.map((c) => [c.id, c.name]),
    );
    const wardNameById = new Map(wards.map((w) => [w.id, w.name]));

    return positions.map((position) => {
      const level = position.aggregationLevel;

      // ── Level votes lookup: candidateId → total level votes ───────────────
      const levelAgg = new Map<string, number>();
      for (const lr of position.levelResults) {
        for (const v of lr.votes) {
          levelAgg.set(
            v.candidateId,
            (levelAgg.get(v.candidateId) ?? 0) + v.votes,
          );
        }
      }

      // ── Level result totals lookup: entityId → { totalVotes, rejectedVotes }
      const levelTotals = new Map<
        string,
        { totalVotes: number; rejectedVotes: number }
      >();
      for (const lr of position.levelResults) {
        const key = lr.entityId;
        const existing = levelTotals.get(key) ?? {
          totalVotes: 0,
          rejectedVotes: 0,
        };
        levelTotals.set(key, {
          totalVotes: existing.totalVotes + (lr.totalVotes ?? 0),
          rejectedVotes: existing.rejectedVotes + (lr.rejectedVotes ?? 0),
        });
      }

      // ── Helper: resolve entity name from its id ───────────────────────────
      const resolveEntityName = (entityId: string | null): string => {
        if (level === "NATIONAL" || entityId === null) return "National";
        if (level === "COUNTY") return countyNameById.get(entityId) ?? entityId;
        if (level === "CONSTITUENCY")
          return constituencyNameById.get(entityId) ?? entityId;
        if (level === "WARD") return wardNameById.get(entityId) ?? entityId;
        return entityId;
      };

      // ── Group candidates by entityId ──────────────────────────────────────
      const entityMap = new Map<
        string,
        {
          entityId: string;
          entityName: string;
          candidates: {
            id: string;
            name: string;
            party: string | null;
            streamVotes: number;
            levelVotes: number;
          }[];
        }
      >();

      for (const c of position.candidates) {
        const rawEntityId =
          level === "NATIONAL" ? "national" : (c.entityId ?? "national");
        const entityName = resolveEntityName(
          rawEntityId === "national" ? null : rawEntityId,
        );

        if (!entityMap.has(rawEntityId)) {
          entityMap.set(rawEntityId, {
            entityId: rawEntityId,
            entityName,
            candidates: [],
          });
        }

        entityMap.get(rawEntityId)!.candidates.push({
          id: c.id,
          name: c.name,
          party: c.party,
          streamVotes: candidateVoteMap.get(c.id) ?? 0,
          levelVotes: levelAgg.get(c.id) ?? 0,
        });
      }

      // ── Sort candidates within each entity by streamVotes desc ────────────
      for (const entity of entityMap.values()) {
        entity.candidates.sort((a, b) => b.streamVotes - a.streamVotes);
      }

      // ── Build final entities array sorted alphabetically by name ──────────
      const entities = Array.from(entityMap.values())
        .map((entity) => {
          const totals = levelTotals.get(entity.entityId) ?? {
            totalVotes: 0,
            rejectedVotes: 0,
          };
          return {
            entityId: entity.entityId,
            entityName: entity.entityName,
            candidates: entity.candidates,
            totalVotes: totals.totalVotes,
            rejectedVotes: totals.rejectedVotes,
          };
        })
        .sort((a, b) => a.entityName.localeCompare(b.entityName));

      const stats = streamStatMap.get(position.id) ?? {
        totalReported: 0,
        totalVotes: 0,
        rejectedVotes: 0,
      };

      return {
        positionId: position.id,
        positionType: position.type,
        positionTitle: position.title,
        aggregationLevel: level,
        entities,
        streamStats: { ...stats, totalExpected },
        levelValidations: position.levelResults.length,
      };
    });
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─── Batch level-entry queries (for drill-down display) ─────────────────────

export type LevelEntryData = {
  entityId: string
  totalVotes: number | null
  rejectedVotes: number | null
  status: string
  candidates: { candidateId: string; votes: number }[]
}

// ─── Entity search for level-entry UI ───────────────────────────────────────

export type LevelEntity = {
  id: string
  name: string
  parentName?: string      // e.g. constituency name for a ward, county name for constituency
  grandparentName?: string // e.g. county name for a ward
}

/**
 * Search geographic entities at a given aggregation level for an election.
 * Used by the level-entry UI (Form B/C) to pick which entity to enter results for.
 */
export const searchEntitiesAtLevel = async (
  electionId: string,
  level: AggregationLevel,
  search?: string,
): Promise<LevelEntity[]> => {
  try {
    const q = search?.trim().toLowerCase()

    if (level === "NATIONAL") {
      return [{ id: "national", name: "National" }]
    }

    if (level === "COUNTY") {
      const counties = await prisma.county.findMany({
        where: q ? { name: { contains: q, mode: "insensitive" } } : {},
        orderBy: { name: "asc" },
        take: 50,
      })
      return counties.map((c) => ({ id: c.id, name: c.name }))
    }

    if (level === "CONSTITUENCY") {
      const constituencies = await prisma.constituency.findMany({
        where: q ? { name: { contains: q, mode: "insensitive" } } : {},
        orderBy: { name: "asc" },
        take: 50,
        include: { county: { select: { name: true } } },
      })
      return constituencies.map((c) => ({
        id: c.id,
        name: c.name,
        parentName: c.county.name,
      }))
    }

    if (level === "WARD") {
      const wards = await prisma.ward.findMany({
        where: {
          pollingStations: {
            some: {
              electionActivations: { some: { electionId, isActive: true } },
            },
          },
          ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        },
        orderBy: { name: "asc" },
        take: 50,
        include: {
          constituency: {
            select: { name: true, county: { select: { name: true } } },
          },
        },
      });
      return wards.map((w) => ({
        id: w.id,
        name: w.name,
        parentName: w.constituency.name,
        grandparentName: w.constituency.county.name,
      }))
    }

    return []
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Get level-entry completion status for a position across all entities at a level.
 * Returns an array of { entityId, status } for entities that have entries.
 */
export const getLevelEntryStatuses = async (
  positionId: string,
  level: AggregationLevel,
): Promise<{ entityId: string; status: string }[]> => {
  try {
    const results = await prisma.levelResult.findMany({
      where: { positionId, level },
      select: { entityId: true, status: true },
    })
    return results
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/**
 * Fetch LevelResult entries for multiple entities at a given level + position.
 * Returns a map of entityId → entry data (or empty map if none exist).
 * Used by the drill-down to show "entered at this level" alongside aggregated totals.
 */
export async function getLevelEntriesForEntities(
  positionId: string,
  level: AggregationLevel,
  entityIds: string[],
): Promise<Map<string, LevelEntryData>> {
  try {
    if (entityIds.length === 0) return new Map()

    const results = await prisma.levelResult.findMany({
      where: { positionId, level, entityId: { in: entityIds } },
      include: { votes: true },
    })

    const map = new Map<string, LevelEntryData>()
    for (const r of results) {
      map.set(r.entityId, {
        entityId: r.entityId,
        totalVotes: r.totalVotes,
        rejectedVotes: r.rejectedVotes,
        status: r.status,
        candidates: r.votes.map((v) => ({
          candidateId: v.candidateId,
          votes: v.votes,
        })),
      })
    }
    return map
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
