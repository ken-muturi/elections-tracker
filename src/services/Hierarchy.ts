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

export const getWardsByElection = async (electionId: string) => {
  try {
    return await prisma.ward.findMany({
      where: { electionId },
      orderBy: { name: "asc" },
      include: {
        constituency: { select: { name: true, county: { select: { name: true } } } },
        _count: { select: { pollingStations: true } },
      },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Wards for a specific constituency within a specific election */
export const getWardsByConstituencyAndElection = async (constituencyId: string, electionId: string) => {
  try {
    return await prisma.ward.findMany({
      where: { constituencyId, electionId },
      orderBy: { name: "asc" },
    })
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
    return await prisma.ward.findMany({
      where: { electionId },
      orderBy: { name: "asc" },
      include: {
        constituency: { select: { name: true, county: { select: { name: true } } } },
        pollingStations: {
          where: { deletedAt: null },
          orderBy: { name: "asc" },
          include: {
            streams: { where: { isActive: true }, orderBy: { code: "asc" } },
          },
        },
      },
    })
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
  electionId: string,
  constituencyId: string,
  name: string,
  code: string
) => {
  try {
    return await prisma.ward.create({
      data: { electionId, constituencyId, name, code: code.toUpperCase() },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const createPollingStation = async (
  wardId: string,
  data: {
    name: string
    code: string
    county: string
    constituency: string
    ward: string
    registeredVoters?: number
  }
) => {
  try {
    const user = await getCurrentUser()
    return await prisma.pollingStation.create({
      data: { wardId, ...data, createdBy: user.id },
    })
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

export const createStream = async (
  pollingStationId: string,
  name: string,
  code: string,
  registeredVoters?: number
) => {
  try {
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
    const wards = await prisma.ward.count({ where: { electionId } })
    const stations = await prisma.pollingStation.count({
      where: { wardRef: { electionId }, deletedAt: null },
    })
    const streams = await prisma.stream.count({
      where: { pollingStation: { wardRef: { electionId } }, isActive: true },
    })
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
      where: { wardRef: { electionId }, deletedAt: null },
      select: { county: true },
      distinct: ["county"],
      orderBy: { county: "asc" },
    })
    return result.map((r) => r.county)
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Preview how many records would be imported from source → target election */
export const previewPollingStationsImport = async (
  targetElectionId: string,
  sourceElectionId: string,
  options?: { countyNames?: string[]; wardNames?: string[] }
) => {
  try {
    let wardWhere: Record<string, unknown> = { electionId: sourceElectionId }

    if (options?.wardNames?.length) {
      wardWhere = { ...wardWhere, name: { in: options.wardNames } }
    }

    let sourceWards = await prisma.ward.findMany({
      where: wardWhere,
      include: {
        constituency: { select: { name: true, county: { select: { name: true } } } },
        pollingStations: {
          where: { deletedAt: null },
          orderBy: { name: "asc" },
          include: { streams: { select: { id: true, name: true, code: true }, orderBy: { code: "asc" } } },
        },
      },
      orderBy: { name: "asc" },
    })

    if (options?.countyNames?.length) {
      sourceWards = sourceWards.filter((w) =>
        options.countyNames!.includes(w.constituency.county.name)
      )
    }

    const existingWardCodes = new Set(
      (await prisma.ward.findMany({ where: { electionId: targetElectionId }, select: { code: true } })).map(
        (w) => w.code
      )
    )

    let wards = 0, stations = 0, streams = 0

    type PreviewStream = { name: string; code: string }
    type PreviewStation = { name: string; code: string; streams: PreviewStream[] }
    type PreviewWard = {
      name: string; code: string; isNew: boolean
      countyName: string; constituencyName: string
      pollingStations: PreviewStation[]
    }
    const detail: PreviewWard[] = []

    // Pre-load existing station codes for all target wards in one query
    const existingStationCodes = new Set(
      (await prisma.pollingStation.findMany({
        where: { wardRef: { electionId: targetElectionId }, deletedAt: null },
        select: { code: true },
      })).map((s) => s.code)
    )

    for (const w of sourceWards) {
      const wardExists = existingWardCodes.has(w.code)
      if (!wardExists) wards++
      const stationDetails: PreviewStation[] = []
      for (const s of w.pollingStations) {
        const stationIsNew = !existingStationCodes.has(s.code)
        if (stationIsNew) stations++
        streams += s.streams.length
        stationDetails.push({
          name: s.name,
          code: s.code,
          streams: s.streams.map((st) => ({ name: st.name, code: st.code })),
        })
      }
      detail.push({
        name: w.name,
        code: w.code,
        isNew: !wardExists,
        countyName: w.constituency.county.name,
        constituencyName: w.constituency.name,
        pollingStations: stationDetails,
      })
    }
    return { wards, stations, streams, totalWards: sourceWards.length, detail }
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}

/** Copy wards → polling stations → streams from source election to target election (skips duplicates).
 *  Runs entirely inside a single serialisable transaction — all-or-nothing. */
export const importPollingStationsFromElection = async (
  targetElectionId: string,
  sourceElectionId: string,
  options?: { countyNames?: string[]; wardNames?: string[] }
) => {
  try {
    await requireAdmin()
    const user = await getCurrentUser()

    if (!targetElectionId?.trim()) throw new Error("Target election ID is required.")
    if (!sourceElectionId?.trim()) throw new Error("Source election ID is required.")
    if (targetElectionId === sourceElectionId) throw new Error("Source and target elections must be different.")

    // ── 1. Load source wards (all columns needed for copy) ──────────────────
    let wardWhere: Record<string, unknown> = { electionId: sourceElectionId }
    if (options?.wardNames?.length) wardWhere = { ...wardWhere, name: { in: options.wardNames } }

    let sourceWards = await prisma.ward.findMany({
      where: wardWhere,
      select: {
        id: true, name: true, code: true, constituencyId: true,
        constituency: { select: { name: true, county: { select: { name: true } } } },
        pollingStations: {
          where: { deletedAt: null },
          select: {
            id: true, name: true, code: true, county: true, constituency: true, ward: true, registeredVoters: true,
            streams: { select: { name: true, code: true, registeredVoters: true } },
          },
        },
      },
    })

    if (options?.countyNames?.length) {
      sourceWards = sourceWards.filter((w) => options.countyNames!.includes(w.constituency.county.name))
    }

    if (sourceWards.length === 0) throw new Error("No wards found matching the selected criteria.")

    // ── 2. Bulk-load all existing target wards & stations in 2 queries ──────
    const [existingTargetWards, existingTargetStations] = await Promise.all([
      prisma.ward.findMany({
        where: { electionId: targetElectionId },
        select: { id: true, code: true },
      }),
      prisma.pollingStation.findMany({
        where: { wardRef: { electionId: targetElectionId }, deletedAt: null },
        select: { id: true, code: true, wardId: true },
      }),
    ])
    const existingWardByCode = new Map(existingTargetWards.map((w) => [w.code, w.id]))
    // Map: "wardId:stationCode" → stationId
    const existingStationKey = (wardId: string, code: string) => `${wardId}:${code}`
    const existingStationByKey = new Map(
      existingTargetStations.map((s) => [existingStationKey(s.wardId, s.code), s.id])
    )

    // ── 3. Everything inside one transaction ─────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      let wardsCreated = 0, stationsCreated = 0, streamsCreated = 0

      for (const sourceWard of sourceWards) {
        // Ward: create only if not already present
        let targetWardId = existingWardByCode.get(sourceWard.code)
        if (!targetWardId) {
          const newWard = await tx.ward.create({
            data: { electionId: targetElectionId, constituencyId: sourceWard.constituencyId, name: sourceWard.name, code: sourceWard.code },
            select: { id: true },
          })
          targetWardId = newWard.id
          existingWardByCode.set(sourceWard.code, targetWardId)
          wardsCreated++
        }

        // Stations: identify new vs existing up-front
        const newStations = sourceWard.pollingStations.filter(
          (s) => !existingStationByKey.has(existingStationKey(targetWardId!, s.code))
        )

        if (newStations.length > 0) {
          // createMany for all new stations in this ward at once
          await tx.pollingStation.createMany({
            data: newStations.map((s) => ({
              wardId: targetWardId!,
              name: s.name, code: s.code,
              county: s.county, constituency: s.constituency, ward: s.ward,
              registeredVoters: s.registeredVoters,
              createdBy: user.id,
            })),
          })
          stationsCreated += newStations.length
        }

        // Bulk-fetch station IDs for this ward (new + pre-existing) to attach streams
        const stationsInWard = await tx.pollingStation.findMany({
          where: { wardId: targetWardId, code: { in: sourceWard.pollingStations.map((s) => s.code) } },
          select: { id: true, code: true },
        })
        const stationIdByCode = new Map(stationsInWard.map((s) => [s.code, s.id]))

        // Bulk-load existing stream codes for all stations in this ward in one query
        const allStationIds = stationsInWard.map((s) => s.id)
        const existingStreams = await tx.stream.findMany({
          where: { pollingStationId: { in: allStationIds } },
          select: { pollingStationId: true, code: true },
        })
        const existingStreamKey = (psId: string, code: string) => `${psId}:${code}`
        const existingStreamSet = new Set(existingStreams.map((s) => existingStreamKey(s.pollingStationId, s.code)))

        // Build all new streams across all stations in this ward, then createMany once
        const newStreamData: { pollingStationId: string; name: string; code: string; registeredVoters?: number | null }[] = []
        for (const sourceStation of sourceWard.pollingStations) {
          const targetStationId = stationIdByCode.get(sourceStation.code)
          if (!targetStationId) continue
          for (const stream of sourceStation.streams) {
            if (!existingStreamSet.has(existingStreamKey(targetStationId, stream.code))) {
              newStreamData.push({ pollingStationId: targetStationId, name: stream.name, code: stream.code, registeredVoters: stream.registeredVoters })
            }
          }
        }
        if (newStreamData.length > 0) {
          await tx.stream.createMany({ data: newStreamData })
          streamsCreated += newStreamData.length
        }
      }

      return { wardsCreated, stationsCreated, streamsCreated }
    }, { timeout: 30_000 })

    return result
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
 *  Phase 1: full validation pass — collects ALL errors, rejects entire import if any fail.
 *  Phase 2: single transaction with createMany at each level. */
export const importPollingStationsFromCsv = async (
  targetElectionId: string,
  rows: CsvRow[]
) => {
  try {
    await requireAdmin()
    const user = await getCurrentUser()

    // ── Phase 1: validate every row before touching the DB ──────────────────
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("No rows provided.")
    if (!targetElectionId?.trim()) throw new Error("Target election ID is required.")

    const validationErrors: string[] = []
    const REQUIRED = ["ward_name", "ward_code", "constituency_name", "station_name", "station_code"] as const

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      // Reject non-object rows (guard against injected data)
      if (!r || typeof r !== "object") { validationErrors.push(`Row ${i + 1}: invalid data.`); continue }
      const empty = REQUIRED.filter((f) => !r[f]?.trim())
      if (empty.length) validationErrors.push(`Row ${i + 1}: missing required fields: ${empty.join(", ")}.`)
      // Guard string lengths to match schema VarChar limits
      if (r.ward_name?.length > 100)   validationErrors.push(`Row ${i + 1}: ward_name exceeds 100 characters.`)
      if (r.ward_code?.length > 20)    validationErrors.push(`Row ${i + 1}: ward_code exceeds 20 characters.`)
      if (r.station_name?.length > 200) validationErrors.push(`Row ${i + 1}: station_name exceeds 200 characters.`)
      if (r.station_code?.length > 50) validationErrors.push(`Row ${i + 1}: station_code exceeds 50 characters.`)
      if (r.stream_code && r.stream_code.length > 20)  validationErrors.push(`Row ${i + 1}: stream_code exceeds 20 characters.`)
      if (r.stream_name && r.stream_name.length > 100) validationErrors.push(`Row ${i + 1}: stream_name exceeds 100 characters.`)
      // stream_code without stream_name is fine (we fall back to code); reverse is not useful but allowed
    }
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed with ${validationErrors.length} error(s):\n${validationErrors.join("\n")}`)
    }

    // ── Phase 2: bulk pre-load all reference data in parallel ───────────────
    const uniqueConstituencyNames = [...new Set(rows.map((r) => r.constituency_name.trim().toLowerCase()))]
    const uniqueWardCodes = [...new Set(rows.map((r) => r.ward_code.trim()))]

    const [allConstituencies, existingTargetWards, existingTargetStations] = await Promise.all([
      prisma.constituency.findMany({
        select: { id: true, name: true, county: { select: { name: true } } },
      }),
      prisma.ward.findMany({
        where: { electionId: targetElectionId },
        select: { id: true, code: true, constituency: { select: { name: true, county: { select: { name: true } } } } },
      }),
      prisma.pollingStation.findMany({
        where: { wardRef: { electionId: targetElectionId }, deletedAt: null },
        select: { id: true, code: true, wardId: true },
      }),
    ])

    const constituencyByName = new Map(allConstituencies.map((c) => [c.name.toLowerCase().trim(), c]))

    // Validate that all constituency names in the CSV actually exist in DB
    const unknownConstituencies = uniqueConstituencyNames.filter((n) => !constituencyByName.has(n))
    if (unknownConstituencies.length > 0) {
      throw new Error(
        `Unknown constituencies (not found in DB): ${unknownConstituencies.map((n) => `"${n}"`).join(", ")}. ` +
        `Check spelling or add them first.`
      )
    }

    const existingWardByCode = new Map(existingTargetWards.map((w) => [w.code, w]))
    const existingStationKey = (wardId: string, code: string) => `${wardId}:${code}`
    const existingStationByKey = new Map(
      existingTargetStations.map((s) => [existingStationKey(s.wardId, s.code), s.id])
    )

    // ── Phase 3: transaction — wards → stations → streams via createMany ────
    const importResult = await prisma.$transaction(async (tx) => {
      let wardsCreated = 0, stationsCreated = 0, streamsCreated = 0

      // Group rows by ward_code
      const wardGroups = new Map<string, CsvRow[]>()
      for (const row of rows) {
        const wc = row.ward_code.trim()
        if (!wardGroups.has(wc)) wardGroups.set(wc, [])
        wardGroups.get(wc)!.push(row)
      }

      // Create all missing wards in one createMany call
      const wardsToCreate = [...wardGroups.entries()]
        .filter(([code]) => !existingWardByCode.has(code))
        .map(([code, wardRows]) => {
          const r = wardRows[0]
          const constituency = constituencyByName.get(r.constituency_name.trim().toLowerCase())!
          return { electionId: targetElectionId, name: r.ward_name.trim(), code, constituencyId: constituency.id }
        })

      if (wardsToCreate.length > 0) {
        await tx.ward.createMany({ data: wardsToCreate })
        wardsCreated = wardsToCreate.length
      }

      // Bulk-fetch ALL wards for target election (includes just-created ones)
      const allTargetWards = await tx.ward.findMany({
        where: { electionId: targetElectionId, code: { in: uniqueWardCodes } },
        select: { id: true, code: true, constituency: { select: { name: true, county: { select: { name: true } } } } },
      })
      const wardById = new Map(allTargetWards.map((w) => [w.code, w]))

      // Build list of stations to create (filter duplicates)
      const stationsToCreate: {
        wardId: string; name: string; code: string
        county: string; constituency: string; ward: string; createdBy: string
      }[] = []

      for (const [wardCode, wardRows] of wardGroups) {
        const ward = wardById.get(wardCode)!
        const countyName = ward.constituency.county.name
        const constituencyName = ward.constituency.name
        const seenStationCodes = new Set<string>()

        for (const row of wardRows) {
          const sc = row.station_code.trim()
          if (existingStationByKey.has(existingStationKey(ward.id, sc))) continue
          if (seenStationCodes.has(sc)) continue // deduplicate within same CSV
          seenStationCodes.add(sc)
          stationsToCreate.push({
            wardId: ward.id, name: row.station_name.trim(), code: sc,
            county: countyName, constituency: constituencyName, ward: row.ward_name.trim(),
            createdBy: user.id,
          })
        }
      }

      if (stationsToCreate.length > 0) {
        await tx.pollingStation.createMany({ data: stationsToCreate })
        stationsCreated = stationsToCreate.length
      }

      // Bulk-fetch ALL station IDs for these wards (new + pre-existing)
      const allWardIds = allTargetWards.map((w) => w.id)
      const allStationsInWards = await tx.pollingStation.findMany({
        where: { wardId: { in: allWardIds }, deletedAt: null },
        select: { id: true, code: true, wardId: true },
      })
      // Map: "wardId:stationCode" → stationId
      const stationIdByKey = new Map(
        allStationsInWards.map((s) => [existingStationKey(s.wardId, s.code), s.id])
      )

      // Bulk-fetch existing streams for all stations in one query
      const allStationIds = allStationsInWards.map((s) => s.id)
      const existingStreams = allStationIds.length > 0
        ? await tx.stream.findMany({
            where: { pollingStationId: { in: allStationIds } },
            select: { pollingStationId: true, code: true },
          })
        : []
      const existingStreamKey = (psId: string, code: string) => `${psId}:${code}`
      const existingStreamSet = new Set(existingStreams.map((s) => existingStreamKey(s.pollingStationId, s.code)))

      // Build all streams to create across all rows in one pass
      const streamsToCreate: { pollingStationId: string; name: string; code: string }[] = []
      const seenStreamKeys = new Set<string>()

      for (const row of rows) {
        if (!row.stream_code?.trim()) continue
        const ward = wardById.get(row.ward_code.trim())
        if (!ward) continue
        const stationId = stationIdByKey.get(existingStationKey(ward.id, row.station_code.trim()))
        if (!stationId) continue
        const sk = existingStreamKey(stationId, row.stream_code.trim())
        if (existingStreamSet.has(sk) || seenStreamKeys.has(sk)) continue
        seenStreamKeys.add(sk)
        streamsToCreate.push({
          pollingStationId: stationId,
          name: row.stream_name?.trim() || row.stream_code.trim(),
          code: row.stream_code.trim(),
        })
      }

      if (streamsToCreate.length > 0) {
        await tx.stream.createMany({ data: streamsToCreate })
        streamsCreated = streamsToCreate.length
      }

      return { wardsCreated, stationsCreated, streamsCreated }
    }, { timeout: 60_000 })

    return importResult
  } catch (error) {
    throw new Error(handleReturnError(error))
  }
}