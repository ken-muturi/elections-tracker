"use server"

import prisma from "@/db"
import { handleReturnError } from "@/db/error-handling"
import { getCurrentUser } from "./UserSessison"
import { requireAdmin } from "./Authorization";

// ─── Permanent hierarchy (County / Constituency) ───────────────────────────

export const getCounties = async () => {
  try {
    return await prisma.county.findMany({ orderBy: { name: "asc" } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getConstituenciesByCounty = async (countyId: string) => {
  try {
    return await prisma.constituency.findMany({
      where: { countyId },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getAllConstituencies = async () => {
  try {
    return await prisma.constituency.findMany({
      orderBy: [{ county: { name: "asc" } }, { name: "asc" }],
      include: { county: { select: { name: true, code: true } } },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─── Election-scoped hierarchy (Ward / PollingStation / Stream) ────────────

/** All master wards (not election-scoped) — used when creating new polling stations */
export const getAllWards = async () => {
  try {
    return await prisma.ward.findMany({
      orderBy: [{ constituency: { county: { name: "asc" } } }, { constituency: { name: "asc" } }, { name: "asc" }],
      include: {
        constituency: {
          select: { name: true, county: { select: { name: true } } },
        },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getWardsByElection = async (electionId: string) => {
  try {
    return await prisma.ward.findMany({
      where: {
        pollingStations: {
          some: {
            electionActivations: { some: { electionId, isActive: true } },
          },
        },
      },
      orderBy: { name: "asc" },
      include: {
        constituency: {
          select: { name: true, county: { select: { name: true } } },
        },
        _count: { select: { pollingStations: true } },
      },
    });
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Wards for a specific constituency within a specific election */
export const getWardsByConstituencyAndElection = async (constituencyId: string, electionId: string) => {
  try {
    return await prisma.ward.findMany({
      where: {
        constituencyId,
        pollingStations: {
          some: {
            electionActivations: { some: { electionId, isActive: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** All master wards for a constituency (not election-scoped) */
export const getWardsByConstituency = async (constituencyId: string) => {
  try {
    return await prisma.ward.findMany({
      where: { constituencyId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, constituencyId: true },
    });
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Count of polling stations in a ward across ALL elections (blast-radius check) */
export const getWardPollingStationCount = async (wardId: string) => {
  try {
    return await prisma.pollingStation.count({
      where: { wardId, deletedAt: null },
    });
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getPollingStationsByWard = async (wardId: string) => {
  try {
    return await prisma.pollingStation.findMany({
      where: { wardId, deletedAt: null },
      include: { streams: { where: { isActive: true }, orderBy: { code: "asc" } } },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getStreamsByStation = async (pollingStationId: string) => {
  try {
    return await prisma.stream.findMany({
      where: { pollingStationId, isActive: true },
      orderBy: { code: "asc" },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const getStreamById = async (id: string) => {
  try {
    return await prisma.stream.findUnique({
      where: { id },
      include: {
        pollingStation: {
          include: {
            wardRef: {
              include: {
                constituency: { include: { county: true } },
              },
            },
          },
        },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Full election hierarchy: Ward → PollingStation → Stream for one election */
export const getElectionHierarchy = async (electionId: string) => {
  try {
    const activations = await prisma.electionPollingStation.findMany({
      where: {
        electionId,
        isActive: true,
        pollingStation: { deletedAt: null },
      },
      select: {
        pollingStation: {
          select: {
            id: true,
            name: true,
            code: true,
            county: true,
            constituency: true,
            ward: true,
            registeredVoters: true,
            isActive: true,
            deletedAt: true,
            streams: {
              where: { isActive: true },
              orderBy: { code: "asc" },
              select: {
                id: true,
                name: true,
                code: true,
                registeredVoters: true,
                isActive: true,
                pollingStationId: true,
              },
            },
            wardRef: {
              select: {
                id: true,
                name: true,
                code: true,
                constituencyId: true,
                constituency: {
                  select: {
                    id: true,
                    name: true,
                    county: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group active stations by ward
    const wardMap = new Map<
      string,
      {
        id: string;
        name: string;
        code: string;
        constituencyId: string;
        constituency: {
          id: string;
          name: string;
          county: { id: string; name: string };
        };
        pollingStations: (typeof activations)[number]["pollingStation"][];
      }
    >();

    for (const { pollingStation: ps } of activations) {
      const w = ps.wardRef;
      if (!wardMap.has(w.id)) {
        wardMap.set(w.id, {
          id: w.id,
          name: w.name,
          code: w.code,
          constituencyId: w.constituencyId,
          constituency: w.constituency,
          pollingStations: [],
        });
      }
      wardMap.get(w.id)!.pollingStations.push(ps);
    }

    return Array.from(wardMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((w) => ({
        ...w,
        pollingStations: [...w.pollingStations].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      }));
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Permanent hierarchy tree: County → Constituency (no wards — those are election-scoped) */
export const getPermanentHierarchy = async () => {
  try {
    return await prisma.county.findMany({
      orderBy: { name: "asc" },
      include: {
        constituencies: { orderBy: { name: "asc" } },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

// ─── Write hierarchy ───────────────────────────────────────────────────────

export const updateCounty = async (id: string, name: string, code: string) => {
  try {
    return await prisma.county.update({ where: { id }, data: { name, code: code.toUpperCase() } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const deleteCounty = async (id: string) => {
  try {
    return await prisma.county.delete({ where: { id } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const updateConstituency = async (id: string, name: string, code: string, countyId?: string) => {
  try {
    return await prisma.constituency.update({
      where: { id },
      data: { name, code: code.toUpperCase(), ...(countyId ? { countyId } : {}) },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const deleteConstituency = async (id: string) => {
  try {
    return await prisma.constituency.delete({ where: { id } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const updateWard = async (id: string, name: string, code: string, constituencyId?: string) => {
  try {
    return await prisma.ward.update({
      where: { id },
      data: { name, code: code.toUpperCase(), ...(constituencyId ? { constituencyId } : {}) },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const deleteWard = async (id: string) => {
  try {
    return await prisma.ward.delete({ where: { id } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const createCounty = async (name: string, code: string) => {
  try {
    return await prisma.county.create({ data: { name, code: code.toUpperCase() } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const createConstituency = async (countyId: string, name: string, code: string) => {
  try {
    return await prisma.constituency.create({ data: { countyId, name, code: code.toUpperCase() } })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const createWard = async (
  constituencyId: string,
  name: string,
  code: string,
) => {
  try {
    return await prisma.ward.upsert({
      where: {
        constituencyId_code: { constituencyId, code: code.toUpperCase() },
      },
      create: { constituencyId, name, code: code.toUpperCase() },
      update: { name }, // keep the master record up-to-date if it already exists
    });
  } catch (error) {
    throw new Error(handleReturnError(error));
  }
};

export const createPollingStation = async (
  wardId: string,
  data: {
    name: string;
    code: string;
    county: string;
    constituency: string;
    ward: string;
    registeredVoters?: number;
  },
  electionId?: string,
) => {
  try {
    const user = await getCurrentUser();
    // Upsert the master record — station may already exist from a previous election
    const station = await prisma.pollingStation.upsert({
      where: { wardId_code: { wardId, code: data.code } },
      create: { wardId, ...data, createdBy: user.id },
      update: {
        name: data.name,
        registeredVoters: data.registeredVoters ?? null,
        county: data.county,
        constituency: data.constituency,
        ward: data.ward,
        deletedAt: null, // restore if previously soft-deleted
        deletedBy: null,
      },
    });
    if (electionId) {
      await prisma.electionPollingStation.upsert({
        where: {
          electionId_pollingStationId: {
            electionId,
            pollingStationId: station.id,
          },
        },
        create: { electionId, pollingStationId: station.id, isActive: true },
        update: { isActive: true },
      });
    }
    return station;
  } catch (error) {
    throw new Error(handleReturnError(error));
  }
};

export const createStream = async (
  pollingStationId: string,
  name: string,
  code: string,
  registeredVoters?: number
) => {
  try {
    // Enforce: streams' total registered voters must not exceed the polling station's cap
    if (registeredVoters && registeredVoters > 0) {
      const station = await prisma.pollingStation.findUnique({
        where: { id: pollingStationId },
        select: {
          registeredVoters: true,
          streams: { select: { registeredVoters: true } },
        },
      });
      if (station?.registeredVoters) {
        const siblingTotal = station.streams.reduce((s, st) => s + (st.registeredVoters ?? 0), 0);
        const newTotal = siblingTotal + registeredVoters;
        if (newTotal > station.registeredVoters) {
          const remaining = Math.max(0, station.registeredVoters - siblingTotal);
          throw new Error(
            `This stream's registered voters (${registeredVoters.toLocaleString()}) would bring the total to ${newTotal.toLocaleString()}, exceeding the polling station cap of ${station.registeredVoters.toLocaleString()}. Available: ${remaining.toLocaleString()}.`,
          );
        }
      }
    }
    return await prisma.stream.create({
      data: { pollingStationId, name, code, registeredVoters },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Hierarchy counts for a specific election */
export const getElectionHierarchyCounts = async (electionId: string) => {
  try {
    const activations = await prisma.electionPollingStation.findMany({
      where: { electionId, isActive: true },
      select: {
        pollingStationId: true,
        pollingStation: { select: { wardId: true, deletedAt: true } },
      },
    });
    const active = activations.filter((a) => !a.pollingStation.deletedAt);
    const wards = new Set(active.map((a) => a.pollingStation.wardId)).size;
    const stations = active.length;
    const stationIds = active.map((a) => a.pollingStationId);
    const streams = await prisma.stream.count({
      where: { pollingStationId: { in: stationIds }, isActive: true },
    });
    return { wards, stations, streams }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Permanent structure counts */
export const getPermanentCounts = async () => {
  try {
    const [counties, constituencies] = await Promise.all([
      prisma.county.count(),
      prisma.constituency.count(),
    ])
    return { counties, constituencies }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Distinct county names present in an election's polling stations */
export const getElectionCountyNames = async (electionId: string) => {
  try {
    const result = await prisma.pollingStation.findMany({
      where: {
        electionActivations: { some: { electionId, isActive: true } },
        deletedAt: null,
      },
      select: { county: true },
      distinct: ["county"],
      orderBy: { county: "asc" },
    });
    return result.map((r) => r.county)
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Preview how many records would be activated from source → target election */
export const previewPollingStationsImport = async (
  targetElectionId: string,
  sourceElectionId: string,
  options?: { countyNames?: string[]; wardNames?: string[] }
) => {
  try {
    // Load all source activations with full geographic context
    const sourceActivations = await prisma.electionPollingStation.findMany({
      where: { electionId: sourceElectionId, isActive: true },
      select: {
        pollingStationId: true,
        pollingStation: {
          select: {
            id: true,
            name: true,
            code: true,
            deletedAt: true,
            wardId: true,
            streams: {
              select: { name: true, code: true },
              orderBy: { code: "asc" },
            },
            wardRef: {
              select: {
                id: true,
                name: true,
                code: true,
                constituency: {
                  select: { name: true, county: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { pollingStation: { name: "asc" } },
    });

    // Apply filters and skip deleted master records
    let filtered = sourceActivations.filter((a) => !a.pollingStation.deletedAt);
    if (options?.countyNames?.length) {
      filtered = filtered.filter((a) =>
        options.countyNames!.includes(
          a.pollingStation.wardRef.constituency.county.name,
        ),
      );
    }
    if (options?.wardNames?.length) {
      filtered = filtered.filter((a) =>
        options.wardNames!.includes(a.pollingStation.wardRef.name),
      );
    }

    // Find which stations/wards are already activated in target election — parallel
    const [targetActivationRows, targetWardRows] = await Promise.all([
      prisma.electionPollingStation.findMany({
        where: { electionId: targetElectionId },
        select: { pollingStationId: true },
      }),
      prisma.electionPollingStation.findMany({
        where: { electionId: targetElectionId, isActive: true },
        select: { pollingStation: { select: { wardId: true } } },
      }),
    ]);
    const targetActivationIds = new Set(
      targetActivationRows.map((a) => a.pollingStationId),
    );
    const targetWardIds = new Set(
      targetWardRows.map((a) => a.pollingStation.wardId),
    );

    type PreviewStream = { name: string; code: string };
    type PreviewStation = {
      name: string;
      code: string;
      streams: PreviewStream[];
    };
    type PreviewWard = {
      name: string;
      code: string;
      isNew: boolean;
      countyName: string;
      constituencyName: string;
      pollingStations: PreviewStation[];
    };

    const wardDetailMap = new Map<string, PreviewWard>();
    let stationsToAdd = 0,
      streamsToAdd = 0,
      wardsToAdd = 0;

    for (const { pollingStationId, pollingStation: ps } of filtered) {
      const ward = ps.wardRef;
      const isNewStation = !targetActivationIds.has(pollingStationId);
      if (isNewStation) {
        stationsToAdd++;
        streamsToAdd += ps.streams.length;
      }
      if (!wardDetailMap.has(ward.id)) {
        const isNewWard = !targetWardIds.has(ward.id);
        if (isNewWard) wardsToAdd++;
        wardDetailMap.set(ward.id, {
          name: ward.name,
          code: ward.code,
          isNew: isNewWard,
          countyName: ward.constituency.county.name,
          constituencyName: ward.constituency.name,
          pollingStations: [],
        });
      }
      wardDetailMap.get(ward.id)!.pollingStations.push({
        name: ps.name,
        code: ps.code,
        streams: ps.streams.map((s) => ({ name: s.name, code: s.code })),
      });
    }

    const detail = Array.from(wardDetailMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return {
      wards: wardsToAdd,
      stations: stationsToAdd,
      streams: streamsToAdd,
      totalWards: wardDetailMap.size,
      detail,
    };
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
/** Activate polling stations from a source election into a target election.
 *  Ward/PollingStation/Stream are master records — only ElectionPollingStation junction rows are created. */
export const importPollingStationsFromElection = async (
  targetElectionId: string,
  sourceElectionId: string,
  options?: { countyNames?: string[]; wardNames?: string[] }
) => {
  try {
    await requireAdmin();

    if (!targetElectionId?.trim())
      throw new Error("Target election ID is required.");
    if (!sourceElectionId?.trim())
      throw new Error("Source election ID is required.");
    if (targetElectionId === sourceElectionId)
      throw new Error("Source and target elections must be different.");

    const sourceActivations = await prisma.electionPollingStation.findMany({
      where: { electionId: sourceElectionId, isActive: true },
      select: {
        pollingStationId: true,
        pollingStation: {
          select: {
            deletedAt: true,
            wardId: true,
            wardRef: {
              select: {
                name: true,
                constituency: {
                  select: { county: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    let filtered = sourceActivations.filter((a) => !a.pollingStation.deletedAt);
    if (options?.countyNames?.length) {
      filtered = filtered.filter((a) =>
        options.countyNames!.includes(
          a.pollingStation.wardRef.constituency.county.name,
        ),
      );
    }
    if (options?.wardNames?.length) {
      filtered = filtered.filter((a) =>
        options.wardNames!.includes(a.pollingStation.wardRef.name),
      );
    }
    if (filtered.length === 0)
      throw new Error(
        "No polling stations found matching the selected criteria.",
      );

    const existingTargetIds = new Set(
      (
        await prisma.electionPollingStation.findMany({
          where: { electionId: targetElectionId },
          select: { pollingStationId: true },
        })
      ).map((a) => a.pollingStationId),
    );
    const toActivate = filtered.filter(
      (a) => !existingTargetIds.has(a.pollingStationId),
    );

    if (toActivate.length > 0) {
      await prisma.electionPollingStation.createMany({
        data: toActivate.map((a) => ({
          electionId: targetElectionId,
          pollingStationId: a.pollingStationId,
          isActive: true,
        })),
        skipDuplicates: true,
      });
    }

    // Re-activate any stations that already had a record but were deactivated
    const reactivateIds = filtered
      .map((a) => a.pollingStationId)
      .filter((id) => existingTargetIds.has(id));
    if (reactivateIds.length > 0) {
      await prisma.electionPollingStation.updateMany({
        where: {
          electionId: targetElectionId,
          pollingStationId: { in: reactivateIds },
          isActive: false,
        },
        data: { isActive: true },
      });
    }

    const activatedWardIds = new Set(
      toActivate.map((a) => a.pollingStation.wardId),
    );
    return {
      wardsCreated: activatedWardIds.size,
      stationsCreated: toActivate.length,
      streamsCreated: 0,
    };
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export type CsvRow = {
  ward_name: string; ward_code: string; constituency_name: string
  station_name: string; station_code: string
  stream_name?: string; stream_code?: string
}

/** Import polling stations from validated CSV rows.
 *  Phase 1: full validation pass — collects ALL errors.
 *  Phase 2: find-or-create master Ward/PollingStation/Stream records.
 *  Phase 3: activate stations for this election via ElectionPollingStation junction. */
export const importPollingStationsFromCsv = async (
  targetElectionId: string,
  rows: CsvRow[]
) => {
  try {
    await requireAdmin();
    const user = await getCurrentUser();

    if (!Array.isArray(rows) || rows.length === 0)
      throw new Error("No rows provided.");
    if (!targetElectionId?.trim())
      throw new Error("Target election ID is required.");

    const validationErrors: string[] = [];
    const REQUIRED = [
      "ward_name",
      "ward_code",
      "constituency_name",
      "station_name",
      "station_code",
    ] as const;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || typeof r !== "object") {
        validationErrors.push(`Row ${i + 1}: invalid data.`);
        continue;
      }
      const empty = REQUIRED.filter((f) => !r[f]?.trim());
      if (empty.length)
        validationErrors.push(
          `Row ${i + 1}: missing required fields: ${empty.join(", ")}.`,
        );
      if (r.ward_name?.length > 100)
        validationErrors.push(
          `Row ${i + 1}: ward_name exceeds 100 characters.`,
        );
      if (r.ward_code?.length > 20)
        validationErrors.push(`Row ${i + 1}: ward_code exceeds 20 characters.`);
      if (r.station_name?.length > 200)
        validationErrors.push(
          `Row ${i + 1}: station_name exceeds 200 characters.`,
        );
      if (r.station_code?.length > 50)
        validationErrors.push(
          `Row ${i + 1}: station_code exceeds 50 characters.`,
        );
      if (r.stream_code && r.stream_code.length > 20)
        validationErrors.push(
          `Row ${i + 1}: stream_code exceeds 20 characters.`,
        );
      if (r.stream_name && r.stream_name.length > 100)
        validationErrors.push(
          `Row ${i + 1}: stream_name exceeds 100 characters.`,
        );
    }
    // Validate: same ward_code must not appear under two different constituencies
    const wardConstituencyMap = new Map<string, string>();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r?.ward_code?.trim() || !r?.constituency_name?.trim()) continue;
      const wc = r.ward_code.trim().toUpperCase();
      const cn = r.constituency_name.trim().toLowerCase();
      if (!wardConstituencyMap.has(wc)) {
        wardConstituencyMap.set(wc, cn);
      } else if (wardConstituencyMap.get(wc) !== cn) {
        validationErrors.push(
          `Row ${i + 1}: ward_code "${r.ward_code}" appears under multiple constituencies — check spelling.`,
        );
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(
        `Validation failed with ${validationErrors.length} error(s):\n${validationErrors.join("\n")}`,
      );
    }

    const uniqueConstituencyNames = [
      ...new Set(rows.map((r) => r.constituency_name.trim().toLowerCase())),
    ];

    const [allConstituencies, existingActivations] = await Promise.all([
      prisma.constituency.findMany({
        select: { id: true, name: true, county: { select: { name: true } } },
      }),
      prisma.electionPollingStation.findMany({
        where: { electionId: targetElectionId },
        select: { pollingStationId: true },
      }),
    ]);

    const constituencyByName = new Map(
      allConstituencies.map((c) => [c.name.toLowerCase().trim(), c]),
    );
    const unknownConstituencies = uniqueConstituencyNames.filter(
      (n) => !constituencyByName.has(n),
    );
    if (unknownConstituencies.length > 0) {
      throw new Error(
        `Unknown constituencies: ${unknownConstituencies.map((n) => `"${n}"`).join(", ")}. Check spelling or add them first.`,
      );
    }

    const alreadyActivatedIds = new Set(
      existingActivations.map((a) => a.pollingStationId),
    );

    const importResult = await prisma.$transaction(
      async (tx) => {
        let wardsCreated = 0,
          stationsCreated = 0,
          streamsCreated = 0;
        const newActivations: string[] = [];

        const wardGroups = new Map<string, CsvRow[]>();
        for (const row of rows) {
          const wc = row.ward_code.trim();
          if (!wardGroups.has(wc)) wardGroups.set(wc, []);
          wardGroups.get(wc)!.push(row);
        }

        for (const [wardCode, wardRows] of wardGroups) {
          const firstRow = wardRows[0];
          const constituency = constituencyByName.get(
            firstRow.constituency_name.trim().toLowerCase(),
          )!;

          let ward = await tx.ward.findUnique({
            where: {
              constituencyId_code: {
                constituencyId: constituency.id,
                code: wardCode,
              },
            },
          });
          if (!ward) {
            ward = await tx.ward.create({
              data: {
                constituencyId: constituency.id,
                name: firstRow.ward_name.trim(),
                code: wardCode,
              },
            });
            wardsCreated++;
          }

          const stationGroups = new Map<string, CsvRow[]>();
          for (const row of wardRows) {
            const sc = row.station_code.trim();
            if (!stationGroups.has(sc)) stationGroups.set(sc, []);
            stationGroups.get(sc)!.push(row);
          }

          // ── Phase A: find-or-create all stations in this ward ─────────────────
          const stationIdByCode = new Map<string, string>();
          for (const [stationCode, stationRows] of stationGroups) {
            const firstStationRow = stationRows[0];
            let station = await tx.pollingStation.findUnique({
              where: { wardId_code: { wardId: ward.id, code: stationCode } },
            });
            if (!station) {
              station = await tx.pollingStation.create({
                data: {
                  wardId: ward.id,
                  name: firstStationRow.station_name.trim(),
                  code: stationCode,
                  county: constituency.county.name,
                  constituency: constituency.name,
                  ward: ward.name,
                  createdBy: user.id,
                },
              });
              stationsCreated++;
            }
            stationIdByCode.set(stationCode, station.id);
            if (!alreadyActivatedIds.has(station.id))
              newActivations.push(station.id);
          }

          // ── Phase B: bulk-load existing streams for all stations in one query ──
          const allStationIds = Array.from(stationIdByCode.values());
          const existingStreams = await tx.stream.findMany({
            where: { pollingStationId: { in: allStationIds } },
            select: { pollingStationId: true, code: true },
          });
          const existingStreamSet = new Set(
            existingStreams.map((s) => `${s.pollingStationId}:${s.code}`),
          );

          // ── Phase C: batch-create all missing streams with one createMany ──────
          const newStreamData: {
            pollingStationId: string;
            name: string;
            code: string;
          }[] = [];
          for (const [stationCode, stationRows] of stationGroups) {
            const psId = stationIdByCode.get(stationCode)!;
            for (const row of stationRows) {
              if (!row.stream_code?.trim()) continue;
              const code = row.stream_code.trim();
              const key = `${psId}:${code}`;
              if (!existingStreamSet.has(key)) {
                newStreamData.push({
                  pollingStationId: psId,
                  name: row.stream_name?.trim() || code,
                  code,
                });
                existingStreamSet.add(key); // prevent dups within the same batch
              }
            }
          }
          if (newStreamData.length > 0) {
            await tx.stream.createMany({
              data: newStreamData,
              skipDuplicates: true,
            });
            streamsCreated += newStreamData.length;
          }
        }

        if (newActivations.length > 0) {
          await tx.electionPollingStation.createMany({
            data: newActivations.map((psId) => ({
              electionId: targetElectionId,
              pollingStationId: psId,
              isActive: true,
            })),
            skipDuplicates: true,
          });
        }

        return { wardsCreated, stationsCreated, streamsCreated };
      },
      { timeout: 60_000 },
    );

    return importResult;
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}
