"use client"

import React, { useState, useTransition } from "react"
import {
  Box, Text, VStack, HStack, Badge, Flex, Input, Spinner,
} from "@chakra-ui/react"
import {
  FiMapPin, FiPlus, FiTrash2, FiChevronDown, FiChevronRight,
  FiGrid, FiCheck, FiX,
} from "react-icons/fi"
import { MdOutlineLocationCity } from "react-icons/md"
import { toaster } from "@/components/ui/toaster"
import {
  createWard,
  createPollingStation,
  createStream,
  deleteWard,
  getWardsByConstituency,
  getWardPollingStationCount,
} from "@/services/Hierarchy"
import {
  deletePollingStation,
  deleteStream,
} from "@/services/PollingStations"

// ── Types mirroring what getElectionHierarchy returns ─────────────────────

export type StreamData = {
  id: string
  name: string
  code: string
  registeredVoters: number | null
  isActive: boolean
  pollingStationId: string
}

export type StationData = {
  id: string
  name: string
  code: string
  county: string
  constituency: string
  ward: string
  registeredVoters: number | null
  streams: StreamData[]
}

export type WardData = {
  id: string
  name: string
  code: string
  constituencyId: string
  constituency: {
    name: string
    county: { name: string }
  }
  pollingStations: StationData[]
}

export type ConstituencyOption = {
  id: string
  name: string
  county: { name: string; code: string }
}

export type WardOption = {
  id: string
  name: string
  code: string
  constituencyId: string
}

interface Props {
  electionId: string
  initialWards: WardData[]
  constituencies: ConstituencyOption[]
}

// ── Helper: extract a usable message from a server-action error ──────────────
// Next.js replaces error messages with a generic digest string in production.
// Detect that and fall back to a friendly message.
function getActionError(e: unknown, fallback: string): string {
  if (!(e instanceof Error)) return fallback
  // Next.js sanitized error has a 'digest' property OR the generic message text
  if ("digest" in e || e.message.includes("Server Components") || e.message.includes("digest")) {
    return fallback
  }
  return e.message
}

// ── Small reusable inline form ─────────────────────────────────────────────

function InlineForm({
  fields,
  onSave,
  onCancel,
  isPending,
  error,
}: {
  fields: { key: string; label: string; placeholder: string; required?: boolean; type?: string }[]
  onSave: (values: Record<string, string>) => void
  onCancel: () => void
  isPending: boolean
  error?: string
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, ""]))
  )

  const set = (key: string, val: string) => setValues((v) => ({ ...v, [key]: val }))

  return (
    <VStack gap={2} alignItems="stretch">
      <HStack gap={2} flexWrap="wrap">
        {fields.map((f) => (
          <Input
            key={f.key}
            size="sm"
            flex={1}
            minW="120px"
            placeholder={f.placeholder}
            value={values[f.key]}
            type={f.type ?? "text"}
            onChange={(e) => set(f.key, e.target.value)}
            borderRadius="lg"
            borderColor="gray.200"
            _focus={{ borderColor: "#0f172a", boxShadow: "none" }}
            fontSize="xs"
          />
        ))}
      </HStack>
      {error && (
        <Text fontSize="xs" color="#dc2626">{error}</Text>
      )}
      <HStack gap={2}>
        <HStack
          as="button"
          gap={1} px={3} py={1.5} borderRadius="lg"
          bg="#0f172a" color="white" fontSize="xs" fontWeight="600"
          cursor="pointer" _hover={{ bg: "#1e293b" }}
          opacity={isPending ? 0.6 : 1}
          pointerEvents={isPending ? "none" : "auto"}
          onClick={() => onSave(values)}
        >
          {isPending ? <Spinner size="xs" /> : <FiCheck fontSize="0.7rem" />}
          <Text>Save</Text>
        </HStack>
        <HStack
          as="button"
          gap={1} px={3} py={1.5} borderRadius="lg"
          borderWidth="1px" borderColor="gray.200"
          fontSize="xs" fontWeight="600" color="gray.500"
          cursor="pointer" _hover={{ bg: "gray.50" }}
          onClick={onCancel}
        >
          <FiX fontSize="0.7rem" />
          <Text>Cancel</Text>
        </HStack>
      </HStack>
    </VStack>
  )
}

// ── WardDeleteButton — fetches blast-radius before confirming ─────────────

function WardDeleteButton({ wardId, onConfirm, isPending }: { wardId: string; onConfirm: () => void; isPending: boolean }) {
  const [confirm, setConfirm] = useState(false)
  const [stationCount, setStationCount] = useState<number | null>(null)

  const handleOpen = async () => {
    setConfirm(true)
    try {
      const count = await getWardPollingStationCount(wardId)
      setStationCount(count)
    } catch {
      setStationCount(null)
    }
  }

  if (!confirm) {
    return (
      <Flex
        as="button"
        w={6} h={6} borderRadius="md" align="center" justify="center"
        color="gray.300" cursor="pointer"
        _hover={{ color: "#ef4444", bg: "#fef2f2" }}
        transition="all 0.15s"
        onClick={handleOpen}
        flexShrink={0}
      >
        <FiTrash2 fontSize="0.75rem" />
      </Flex>
    )
  }

  return (
    <HStack gap={1} flexShrink={0}>
      <Text fontSize="10px" color="#ef4444" fontWeight="600">
        {stationCount === null
          ? "Sure?"
          : stationCount === 0
            ? "Delete empty ward?"
            : `Delete? (${stationCount} station${stationCount !== 1 ? "s" : ""} across all elections)`}
      </Text>
      <Flex
        as="button"
        w={5} h={5} borderRadius="sm" bg="#fef2f2" align="center" justify="center"
        color="#ef4444" cursor="pointer" _hover={{ bg: "#fee2e2" }}
        onClick={onConfirm}
      >
        {isPending ? <Spinner size="xs" /> : <FiCheck fontSize="0.6rem" />}
      </Flex>
      <Flex
        as="button"
        w={5} h={5} borderRadius="sm" bg="gray.100" align="center" justify="center"
        color="gray.500" cursor="pointer" _hover={{ bg: "gray.200" }}
        onClick={() => { setConfirm(false); setStationCount(null) }}
      >
        <FiX fontSize="0.6rem" />
      </Flex>
    </HStack>
  )
}

// ── DeleteButton ───────────────────────────────────────────────────────────

function DeleteButton({ onConfirm, isPending }: { onConfirm: () => void; isPending: boolean }) {
  const [confirm, setConfirm] = useState(false)

  if (!confirm) {
    return (
      <Flex
        as="button"
        w={6} h={6} borderRadius="md" align="center" justify="center"
        color="gray.300" cursor="pointer"
        _hover={{ color: "#ef4444", bg: "#fef2f2" }}
        transition="all 0.15s"
        onClick={() => setConfirm(true)}
        flexShrink={0}
      >
        <FiTrash2 fontSize="0.75rem" />
      </Flex>
    )
  }

  return (
    <HStack gap={1} flexShrink={0}>
      <Text fontSize="10px" color="#ef4444" fontWeight="600">Sure?</Text>
      <Flex
        as="button"
        w={5} h={5} borderRadius="sm" bg="#fef2f2" align="center" justify="center"
        color="#ef4444" cursor="pointer" _hover={{ bg: "#fee2e2" }}
        onClick={onConfirm}
      >
        {isPending ? <Spinner size="xs" /> : <FiCheck fontSize="0.6rem" />}
      </Flex>
      <Flex
        as="button"
        w={5} h={5} borderRadius="sm" bg="gray.100" align="center" justify="center"
        color="gray.500" cursor="pointer" _hover={{ bg: "gray.200" }}
        onClick={() => setConfirm(false)}
      >
        <FiX fontSize="0.6rem" />
      </Flex>
    </HStack>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ElectionHierarchyManager({
  electionId,
  initialWards,
  constituencies,
}: Props) {
  const [wards, setWards] = useState<WardData[]>(initialWards);
  const [isPending, startTransition] = useTransition();

  // Track which ward rows are expanded (all expanded by default)
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(initialWards.map((w) => w.id)),
  );
  const toggleExpand = (wardId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(wardId)) {
        next.delete(wardId);
      } else {
        next.add(wardId);
      }
      return next;
    });

  // ── Add Polling Station (top-level, cascading) ───────────────────────────
  type InlineStream = { name: string; code: string; voters: string };
  const emptyTopForm = {
    countyName: "",
    constituencyId: "",
    wardId: "",
    wardName: "",
    wardCode: "",
    stationName: "",
    stationCode: "",
    voters: "",
  };
  const emptyStream: InlineStream = { name: "", code: "", voters: "" };
  const [showAddTopStation, setShowAddTopStation] = useState(false);
  const [addTopForm, setAddTopForm] = useState(emptyTopForm);
  const [addTopStreams, setAddTopStreams] = useState<InlineStream[]>([]);
  const [addTopError, setAddTopError] = useState("");
  const [addTopPending, setAddTopPending] = useState(false);

  const patchTop = (patch: Partial<typeof emptyTopForm>) =>
    setAddTopForm((prev) => ({ ...prev, ...patch }));

  const patchStream = (idx: number, patch: Partial<InlineStream>) =>
    setAddTopStreams((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );

  // Master wards for the currently-selected constituency (not election-scoped)
  const [masterWards, setMasterWards] = useState<WardOption[]>([]);
  const [masterWardsLoading, setMasterWardsLoading] = useState(false);

  const handleConstituencyChange = (constituencyId: string) => {
    patchTop({ constituencyId, wardId: "", wardName: "", wardCode: "" });
    setMasterWards([]);
    if (!constituencyId) return;
    setMasterWardsLoading(true);
    getWardsByConstituency(constituencyId)
      .then(setMasterWards)
      .catch(() => {})
      .finally(() => setMasterWardsLoading(false));
  };

  const stationReady =
    addTopForm.stationName.trim() && addTopForm.stationCode.trim();

  const handleAddTopStation = () => {
    const f = addTopForm;
    if (!f.constituencyId) {
      setAddTopError("Select a constituency");
      return;
    }
    if (!f.wardId) {
      setAddTopError("Select or create a ward");
      return;
    }
    if (f.wardId === "__new__" && (!f.wardName.trim() || !f.wardCode.trim())) {
      setAddTopError("Ward name and code are required");
      return;
    }
    if (!f.stationName.trim() || !f.stationCode.trim()) {
      setAddTopError("Station name and code are required");
      return;
    }
    for (let i = 0; i < addTopStreams.length; i++) {
      if (!addTopStreams[i].name.trim() || !addTopStreams[i].code.trim()) {
        setAddTopError(`Stream ${i + 1}: name and code are required`);
        return;
      }
    }
    setAddTopError("");
    setAddTopPending(true);
    startTransition(async () => {
      try {
        const constituency = constituencies.find(
          (c) => c.id === f.constituencyId,
        )!;
        let targetWard: WardData;
        if (f.wardId === "__new__") {
          const created = await createWard(
            f.constituencyId,
            f.wardName.trim(),
            f.wardCode.trim(),
          );
          targetWard = {
            id: created.id,
            name: created.name,
            code: created.code,
            constituencyId: created.constituencyId,
            constituency: {
              name: constituency.name,
              county: { name: constituency.county.name },
            },
            pollingStations: [],
          };
          setWards((prev) =>
            [...prev, targetWard].sort((a, b) => a.name.localeCompare(b.name)),
          );
          setExpanded((prev) => new Set([...prev, created.id]));
        } else {
          targetWard = wards.find((w) => w.id === f.wardId)!;
        }
        const station = await createPollingStation(
          targetWard.id,
          {
            name: f.stationName.trim(),
            code: f.stationCode.trim(),
            county: constituency.county.name,
            constituency: constituency.name,
            ward: targetWard.name,
            registeredVoters: f.voters ? Number(f.voters) : undefined,
          },
          electionId,
        );
        // Create all streams in parallel (no sequential await)
        const streamResults = await Promise.all(
          addTopStreams.map((s) =>
            createStream(
              station.id,
              s.name.trim(),
              s.code.trim(),
              s.voters ? Number(s.voters) : undefined,
            ),
          ),
        );
        const createdStreams: StreamData[] = streamResults.map((stream) => ({
          id: stream.id,
          name: stream.name,
          code: stream.code,
          registeredVoters: stream.registeredVoters ?? null,
          isActive: stream.isActive,
          pollingStationId: stream.pollingStationId,
        }));
        const newStation: StationData = {
          id: station.id,
          name: station.name,
          code: station.code,
          county: station.county,
          constituency: station.constituency,
          ward: station.ward,
          registeredVoters: station.registeredVoters,
          streams: createdStreams,
        };
        setWards((prev) =>
          prev.map((w) =>
            w.id === targetWard.id
              ? {
                  ...w,
                  pollingStations: [...w.pollingStations, newStation].sort(
                    (a, b) => a.name.localeCompare(b.name),
                  ),
                }
              : w,
          ),
        );
        setExpanded((prev) => new Set([...prev, targetWard.id]));
        setAddTopForm(emptyTopForm);
        setAddTopStreams([]);
        setShowAddTopStation(false);
        toaster.success({
          title: `Polling station added${createdStreams.length ? ` with ${createdStreams.length} stream${createdStreams.length > 1 ? "s" : ""}` : ""}`,
        });
      } catch (e) {
        setAddTopError(
          getActionError(e, "Failed to add polling station. Please try again."),
        );
      } finally {
        setAddTopPending(false);
      }
    });
  };

  const handleDeleteWard = (wardId: string) => {
    startTransition(async () => {
      try {
        await deleteWard(wardId);
        setWards((prev) => prev.filter((w) => w.id !== wardId));
        toaster.success({ title: "Ward deleted" });
      } catch (e) {
        toaster.error({
          title: "Delete failed",
          description: getActionError(e, "Failed to delete ward. Please try again."),
        });
      }
    });
  };

  // ── Add Polling Station ───────────────────────────────────────────────────
  const [addingStationToWard, setAddingStationToWard] = useState<string | null>(
    null,
  );
  const [addStationError, setAddStationError] = useState("");
  const [addStationPending, setAddStationPending] = useState(false);

  const handleAddStation = (wardId: string, values: Record<string, string>) => {
    if (!values.name || !values.code) {
      setAddStationError("Name and code are required");
      return;
    }
    setAddStationError("");
    setAddStationPending(true);
    const ward = wards.find((w) => w.id === wardId)!;
    startTransition(async () => {
      try {
        const station = await createPollingStation(
          wardId,
          {
            name: values.name.trim(),
            code: values.code.trim(),
            county: ward.constituency.county.name,
            constituency: ward.constituency.name,
            ward: ward.name,
            registeredVoters: values.voters ? Number(values.voters) : undefined,
          },
          electionId,
        );
        const newStation: StationData = {
          id: station.id,
          name: station.name,
          code: station.code,
          county: station.county,
          constituency: station.constituency,
          ward: station.ward,
          registeredVoters: station.registeredVoters,
          streams: [],
        };
        setWards((prev) =>
          prev.map((w) =>
            w.id === wardId
              ? {
                  ...w,
                  pollingStations: [...w.pollingStations, newStation].sort(
                    (a, b) => a.name.localeCompare(b.name),
                  ),
                }
              : w,
          ),
        );
        setAddingStationToWard(null);
        toaster.success({ title: "Polling station added" });
      } catch (e) {
        setAddStationError(
          getActionError(e, "Failed to add station. Please try again."),
        );
      } finally {
        setAddStationPending(false);
      }
    });
  };

  const handleDeleteStation = (wardId: string, stationId: string) => {
    startTransition(async () => {
      try {
        await deletePollingStation(stationId);
        setWards((prev) =>
          prev.map((w) =>
            w.id === wardId
              ? {
                  ...w,
                  pollingStations: w.pollingStations.filter(
                    (s) => s.id !== stationId,
                  ),
                }
              : w,
          ),
        );
        toaster.success({ title: "Polling station removed" });
      } catch (e) {
        toaster.error({
          title: "Delete failed",
          description: getActionError(e, "Failed to remove station. Please try again."),
        });
      }
    });
  };

  // ── Add Stream ────────────────────────────────────────────────────────────
  const [addingStreamToStation, setAddingStreamToStation] = useState<
    string | null
  >(null);
  const [addStreamError, setAddStreamError] = useState("");
  const [addStreamPending, setAddStreamPending] = useState(false);

  const handleAddStream = (
    wardId: string,
    stationId: string,
    values: Record<string, string>,
  ) => {
    if (!values.name || !values.code) {
      setAddStreamError("Name and code are required");
      return;
    }
    setAddStreamError("");
    setAddStreamPending(true);
    startTransition(async () => {
      try {
        const stream = await createStream(
          stationId,
          values.name.trim(),
          values.code.trim(),
          values.voters ? Number(values.voters) : undefined,
        );
        const newStream: StreamData = {
          id: stream.id,
          name: stream.name,
          code: stream.code,
          registeredVoters: stream.registeredVoters ?? null,
          isActive: stream.isActive,
          pollingStationId: stream.pollingStationId,
        };
        setWards((prev) =>
          prev.map((w) =>
            w.id === wardId
              ? {
                  ...w,
                  pollingStations: w.pollingStations.map((ps) =>
                    ps.id === stationId
                      ? { ...ps, streams: [...ps.streams, newStream] }
                      : ps,
                  ),
                }
              : w,
          ),
        );
        setAddingStreamToStation(null);
        toaster.success({ title: "Stream added" });
      } catch (e) {
        setAddStreamError(
          getActionError(e, "Failed to add stream. Please try again."),
        );
      } finally {
        setAddStreamPending(false);
      }
    });
  };

  const handleDeleteStream = (
    wardId: string,
    stationId: string,
    streamId: string,
  ) => {
    startTransition(async () => {
      try {
        await deleteStream(streamId);
        setWards((prev) =>
          prev.map((w) =>
            w.id === wardId
              ? {
                  ...w,
                  pollingStations: w.pollingStations.map((ps) =>
                    ps.id === stationId
                      ? {
                          ...ps,
                          streams: ps.streams.filter((s) => s.id !== streamId),
                        }
                      : ps,
                  ),
                }
              : w,
          ),
        );
        toaster.success({ title: "Stream removed" });
      } catch (e) {
        toaster.error({
          title: "Delete failed",
          description: getActionError(e, "Failed to remove stream. Please try again."),
        });
      }
    });
  };

  // ── Helpers for the add-station form ──────────────────────────────────────
  const uniqueCounties = [
    ...new Set(constituencies.map((c) => c.county.name)),
  ].sort();
  const selStyle = (hasVal: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: `1px solid ${hasVal ? "#d1d5db" : "#e5e7eb"}`,
    fontSize: "0.875rem",
    color: hasVal ? "#1f2937" : "#9ca3af",
    background: "white",
    cursor: "pointer",
    outline: "none",
  });

  // ── Group by county → constituency ─────────────────────────────────────────
  type ConstGroup = { constituencyName: string; wards: WardData[] };
  type CountyGroup = { constituencies: Record<string, ConstGroup> };
  const groups: Record<string, CountyGroup> = {};
  for (const ward of wards) {
    const county = ward.constituency.county.name;
    const constituency = ward.constituency.name;
    if (!groups[county]) groups[county] = { constituencies: {} };
    if (!groups[county].constituencies[constituency])
      groups[county].constituencies[constituency] = {
        constituencyName: constituency,
        wards: [],
      };
    groups[county].constituencies[constituency].wards.push(ward);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <VStack gap={4} alignItems="stretch">
      {/* Add Polling Station button / cascading form */}
      <Box>
        {!showAddTopStation ? (
          <HStack
            as="button"
            gap={2}
            px={4}
            py={2}
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            fontSize="sm"
            fontWeight="600"
            color="gray.600"
            cursor="pointer"
            _hover={{ bg: "gray.50", borderColor: "gray.300" }}
            transition="all 0.15s"
            onClick={() => setShowAddTopStation(true)}
          >
            <FiPlus fontSize="0.85rem" />
            <Text>Add Polling Station</Text>
          </HStack>
        ) : (
          <Box
            bg="white"
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
            boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
          >
            <Text fontSize="sm" fontWeight="600" color="gray.700" mb={4}>
              Add Polling Station
            </Text>
            <VStack gap={3} alignItems="stretch">
              {/* County + Constituency */}
              <HStack gap={3} flexWrap="wrap">
                <Box flex={1} minW="180px">
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    fontWeight="600"
                    mb={1.5}
                  >
                    County *
                  </Text>
                  <select
                    style={selStyle(!!addTopForm.countyName)}
                    value={addTopForm.countyName}
                    onChange={(e) =>
                      patchTop({
                        countyName: e.target.value,
                        constituencyId: "",
                        wardId: "",
                        wardName: "",
                        wardCode: "",
                      })
                    }
                  >
                    <option value="">Select county…</option>
                    {uniqueCounties.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Box>
                <Box flex={1} minW="180px">
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    fontWeight="600"
                    mb={1.5}
                  >
                    Constituency *
                  </Text>
                  <select
                    style={selStyle(!!addTopForm.constituencyId)}
                    value={addTopForm.constituencyId}
                    onChange={(e) => handleConstituencyChange(e.target.value)}
                  >
                    <option value="">Select constituency…</option>
                    {constituencies
                      .filter((c) => c.county.name === addTopForm.countyName)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </Box>
              </HStack>

              {/* Ward — unlocks once constituency chosen */}
              {addTopForm.constituencyId && (
                <Box>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    fontWeight="600"
                    mb={1.5}
                  >
                    Ward *
                  </Text>
                  <select
                    style={selStyle(!!addTopForm.wardId)}
                    value={addTopForm.wardId}
                    onChange={(e) =>
                      patchTop({
                        wardId: e.target.value,
                        wardName: "",
                        wardCode: "",
                      })
                    }
                  >
                    <option value="">
                      {masterWardsLoading ? "Loading wards…" : "Select ward…"}
                    </option>
                    {masterWards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                        {wards.some((ew) => ew.id === w.id) ? " ✓" : ""}
                      </option>
                    ))}
                    <option value="__new__">＋ Create new ward</option>
                  </select>
                </Box>
              )}

              {/* New ward name + code */}
              {addTopForm.wardId === "__new__" && (
                <HStack
                  gap={3}
                  pl={3}
                  borderLeftWidth="2px"
                  borderLeftColor="#e0e7ff"
                  flexWrap="wrap"
                >
                  <Box flex={1} minW="150px">
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      fontWeight="600"
                      mb={1.5}
                    >
                      Ward Name *
                    </Text>
                    <Input
                      size="sm"
                      placeholder="e.g. Kinangop Ward 1"
                      value={addTopForm.wardName}
                      onChange={(e) => patchTop({ wardName: e.target.value })}
                      borderRadius="lg"
                      borderColor="gray.200"
                      _focus={{ borderColor: "#0f172a", boxShadow: "none" }}
                      fontSize="xs"
                    />
                  </Box>
                  <Box flex={1} minW="120px">
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      fontWeight="600"
                      mb={1.5}
                    >
                      Ward Code *
                    </Text>
                    <Input
                      size="sm"
                      placeholder="e.g. WD-001"
                      value={addTopForm.wardCode}
                      onChange={(e) => patchTop({ wardCode: e.target.value })}
                      borderRadius="lg"
                      borderColor="gray.200"
                      _focus={{ borderColor: "#0f172a", boxShadow: "none" }}
                      fontSize="xs"
                    />
                  </Box>
                </HStack>
              )}

              {/* Station fields — unlocks once ward is resolved */}
              {addTopForm.wardId &&
                (addTopForm.wardId !== "__new__" ||
                  (addTopForm.wardName.trim() &&
                    addTopForm.wardCode.trim())) && (
                  <HStack
                    gap={3}
                    pt={2}
                    borderTopWidth="1px"
                    borderTopColor="gray.100"
                    flexWrap="wrap"
                  >
                    <Box flex={2} minW="200px">
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        fontWeight="600"
                        mb={1.5}
                      >
                        Station Name *
                      </Text>
                      <Input
                        size="sm"
                        placeholder="e.g. Kenyatta Primary School"
                        value={addTopForm.stationName}
                        onChange={(e) =>
                          patchTop({ stationName: e.target.value })
                        }
                        borderRadius="lg"
                        borderColor="gray.200"
                        _focus={{ borderColor: "#0f172a", boxShadow: "none" }}
                        fontSize="xs"
                      />
                    </Box>
                    <Box flex={1} minW="130px">
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        fontWeight="600"
                        mb={1.5}
                      >
                        Station Code *
                      </Text>
                      <Input
                        size="sm"
                        placeholder="e.g. PS-001"
                        value={addTopForm.stationCode}
                        onChange={(e) =>
                          patchTop({ stationCode: e.target.value })
                        }
                        borderRadius="lg"
                        borderColor="gray.200"
                        _focus={{ borderColor: "#0f172a", boxShadow: "none" }}
                        fontSize="xs"
                      />
                    </Box>
                    <Box flex={1} minW="130px">
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        fontWeight="600"
                        mb={1.5}
                      >
                        Registered Voters
                      </Text>
                      <Input
                        size="sm"
                        type="number"
                        placeholder="Optional"
                        value={addTopForm.voters}
                        onChange={(e) => patchTop({ voters: e.target.value })}
                        borderRadius="lg"
                        borderColor="gray.200"
                        _focus={{ borderColor: "#0f172a", boxShadow: "none" }}
                        fontSize="xs"
                      />
                    </Box>
                  </HStack>
                )}

              {/* Streams — unlocks once station name + code are filled */}
              {stationReady && (
                <Box pt={2} borderTopWidth="1px" borderTopColor="gray.100">
                  <HStack justify="space-between" mb={2}>
                    <HStack gap={1.5}>
                      <FiGrid fontSize="0.75rem" color="#6b7280" />
                      <Text fontSize="xs" fontWeight="600" color="gray.600">
                        Streams{" "}
                        {addTopStreams.length > 0 && (
                          <Text as="span" color="gray.400">
                            ({addTopStreams.length})
                          </Text>
                        )}
                      </Text>
                    </HStack>
                    <HStack
                      as="button"
                      gap={1}
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="10px"
                      fontWeight="600"
                      color="gray.400"
                      cursor="pointer"
                      _hover={{ color: "#16a34a", bg: "#dcfce7" }}
                      transition="all 0.15s"
                      onClick={() =>
                        setAddTopStreams((prev) => [
                          ...prev,
                          { ...emptyStream },
                        ])
                      }
                    >
                      <FiPlus fontSize="0.65rem" />
                      <Text>Add Stream</Text>
                    </HStack>
                  </HStack>
                  {addTopStreams.length === 0 && (
                    <Text fontSize="xs" color="gray.300">
                      No streams yet — click &quot;Add Stream&quot; to define
                      them now, or add later.
                    </Text>
                  )}
                  <VStack gap={2} alignItems="stretch">
                    {addTopStreams.map((s, idx) => (
                      <HStack
                        key={idx}
                        gap={2}
                        pl={3}
                        borderLeftWidth="2px"
                        borderLeftColor="#dcfce7"
                        flexWrap="wrap"
                      >
                        <Box flex={2} minW="130px">
                          <Input
                            size="sm"
                            placeholder="Stream name e.g. Stream A"
                            value={s.name}
                            onChange={(e) =>
                              patchStream(idx, { name: e.target.value })
                            }
                            borderRadius="lg"
                            borderColor="gray.200"
                            _focus={{
                              borderColor: "#16a34a",
                              boxShadow: "none",
                            }}
                            fontSize="xs"
                          />
                        </Box>
                        <Box flex={1} minW="80px">
                          <Input
                            size="sm"
                            placeholder="Code e.g. A"
                            value={s.code}
                            onChange={(e) =>
                              patchStream(idx, { code: e.target.value })
                            }
                            borderRadius="lg"
                            borderColor="gray.200"
                            _focus={{
                              borderColor: "#16a34a",
                              boxShadow: "none",
                            }}
                            fontSize="xs"
                          />
                        </Box>
                        <Box flex={1} minW="80px">
                          <Input
                            size="sm"
                            type="number"
                            placeholder="Voters"
                            value={s.voters}
                            onChange={(e) =>
                              patchStream(idx, { voters: e.target.value })
                            }
                            borderRadius="lg"
                            borderColor="gray.200"
                            _focus={{
                              borderColor: "#16a34a",
                              boxShadow: "none",
                            }}
                            fontSize="xs"
                          />
                        </Box>
                        <Flex
                          as="button"
                          w={6}
                          h={6}
                          borderRadius="md"
                          align="center"
                          justify="center"
                          color="gray.300"
                          cursor="pointer"
                          flexShrink={0}
                          _hover={{ color: "#ef4444", bg: "#fef2f2" }}
                          transition="all 0.15s"
                          onClick={() =>
                            setAddTopStreams((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          <FiX fontSize="0.7rem" />
                        </Flex>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}

              {addTopError && (
                <Text fontSize="xs" color="#dc2626">
                  {addTopError}
                </Text>
              )}

              <HStack gap={2}>
                <HStack
                  as="button"
                  gap={1}
                  px={3}
                  py={1.5}
                  borderRadius="lg"
                  bg="#0f172a"
                  color="white"
                  fontSize="xs"
                  fontWeight="600"
                  cursor="pointer"
                  _hover={{ bg: "#1e293b" }}
                  opacity={addTopPending ? 0.6 : 1}
                  pointerEvents={addTopPending ? "none" : "auto"}
                  onClick={handleAddTopStation}
                >
                  {addTopPending ? (
                    <Spinner size="xs" />
                  ) : (
                    <FiCheck fontSize="0.7rem" />
                  )}
                  <Text>Save</Text>
                </HStack>
                <HStack
                  as="button"
                  gap={1}
                  px={3}
                  py={1.5}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="gray.200"
                  fontSize="xs"
                  fontWeight="600"
                  color="gray.500"
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => {
                    setAddTopForm(emptyTopForm);
                    setAddTopStreams([]);
                    setShowAddTopStation(false);
                    setAddTopError("");
                  }}
                >
                  <FiX fontSize="0.7rem" />
                  <Text>Cancel</Text>
                </HStack>
              </HStack>
            </VStack>
          </Box>
        )}
      </Box>

      {/* Empty state */}
      {wards.length === 0 && (
        <Box
          bg="white"
          p={10}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.100"
          textAlign="center"
        >
          <Flex
            w={16}
            h={16}
            borderRadius="2xl"
            bg="gray.50"
            align="center"
            justify="center"
            mx="auto"
            mb={4}
          >
            <FiMapPin fontSize="1.5rem" color="#9ca3af" />
          </Flex>
          <Text fontWeight="700" color="gray.700" mb={1}>
            No polling stations yet
          </Text>
          <Text fontSize="sm" color="gray.400">
            Add a polling station above, or import from another election.
          </Text>
        </Box>
      )}

      {/* County groups */}
      {Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([countyName, group]) => {
          const allWards = Object.values(group.constituencies).flatMap(
            (cg) => cg.wards,
          );
          const totalStations = allWards.reduce(
            (s, w) => s + w.pollingStations.length,
            0,
          );
          const totalStreams = allWards.reduce(
            (s, w) =>
              s +
              w.pollingStations.reduce((ss, ps) => ss + ps.streams.length, 0),
            0,
          );

          return (
            <Box
              key={countyName}
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.100"
              boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
              overflow="hidden"
            >
              {/* County header */}
              <HStack
                px={5}
                py={4}
                bg="#f8fafc"
                borderBottomWidth="1px"
                borderBottomColor="gray.100"
                gap={3}
              >
                <Flex
                  w={8}
                  h={8}
                  borderRadius="lg"
                  bg="#e0e7ff"
                  align="center"
                  justify="center"
                  color="#4f46e5"
                  fontSize="0.9rem"
                >
                  <MdOutlineLocationCity />
                </Flex>
                <Text fontWeight="700" color="gray.900" flex={1}>
                  {countyName}
                </Text>
                <HStack gap={2}>
                  <Badge
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    bg="#eff6ff"
                    color="#1d4ed8"
                    fontSize="xs"
                    fontWeight="600"
                  >
                    {allWards.length} ward{allWards.length !== 1 ? "s" : ""}
                  </Badge>
                  <Badge
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    bg="#f0fdf4"
                    color="#166534"
                    fontSize="xs"
                    fontWeight="600"
                  >
                    {totalStations} station{totalStations !== 1 ? "s" : ""}
                  </Badge>
                  <Badge
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    bg="#faf5ff"
                    color="#7e22ce"
                    fontSize="xs"
                    fontWeight="600"
                  >
                    {totalStreams} stream{totalStreams !== 1 ? "s" : ""}
                  </Badge>
                </HStack>
              </HStack>

              {/* Constituencies → Wards */}
              <VStack gap={0} alignItems="stretch">
                {Object.values(group.constituencies)
                  .sort((a, b) =>
                    a.constituencyName.localeCompare(b.constituencyName),
                  )
                  .map((constGroup) => {
                    const constStations = constGroup.wards.reduce((s, w) => s + w.pollingStations.length, 0)
                    const constStreams = constGroup.wards.reduce(
                      (s, w) => s + w.pollingStations.reduce((ss, ps) => ss + ps.streams.length, 0), 0
                    )
                    return (
                    <Box key={constGroup.constituencyName}>
                      {/* Constituency sub-header */}
                      <HStack
                        px={5}
                        py={2}
                        gap={2}
                        bg="#f1f5f9"
                        borderTopWidth="1px"
                        borderTopColor="gray.100"
                      >
                        <Box
                          w={2}
                          h={2}
                          borderRadius="full"
                          bg="#818cf8"
                          flexShrink={0}
                        />
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color="#4338ca"
                          flex={1}
                        >
                          {constGroup.constituencyName}
                        </Text>
                        <HStack gap={1.5}>
                          <Text fontSize="10px" color="gray.400">
                            {constGroup.wards.length} ward{constGroup.wards.length !== 1 ? "s" : ""}
                          </Text>
                          <Text fontSize="10px" color="gray.300">·</Text>
                          <Text fontSize="10px" color="gray.400">
                            {constStations} station{constStations !== 1 ? "s" : ""}
                          </Text>
                          {constStreams > 0 && (
                            <>
                              <Text fontSize="10px" color="gray.300">·</Text>
                              <Text fontSize="10px" color="gray.400">
                                {constStreams} stream{constStreams !== 1 ? "s" : ""}
                              </Text>
                            </>
                          )}
                        </HStack>
                      </HStack>

                      {/* Wards in this constituency */}
                      {constGroup.wards
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((ward, idx) => {
                          const isOpen = expanded.has(ward.id);
                          const wardStreams = ward.pollingStations.reduce(
                            (s, ps) => s + ps.streams.length,
                            0,
                          );
                          const isAddingStation =
                            addingStationToWard === ward.id;

                          return (
                            <Box
                              key={ward.id}
                              borderTopWidth={idx > 0 ? "1px" : "0"}
                              borderTopColor="gray.100"
                            >
                              {/* Ward row */}
                              <HStack px={5} py={3} gap={3} bg="gray.50">
                                <Flex
                                  as="button"
                                  w={5}
                                  h={5}
                                  borderRadius="sm"
                                  bg="white"
                                  align="center"
                                  justify="center"
                                  borderWidth="1px"
                                  borderColor="gray.200"
                                  cursor="pointer"
                                  _hover={{ bg: "gray.100" }}
                                  flexShrink={0}
                                  onClick={() => toggleExpand(ward.id)}
                                >
                                  {isOpen ? (
                                    <FiChevronDown
                                      fontSize="0.7rem"
                                      color="#6b7280"
                                    />
                                  ) : (
                                    <FiChevronRight
                                      fontSize="0.7rem"
                                      color="#6b7280"
                                    />
                                  )}
                                </Flex>
                                <Box
                                  w={1}
                                  h={4}
                                  bg="#c7d2fe"
                                  borderRadius="full"
                                  flexShrink={0}
                                />
                                <Text
                                  fontSize="sm"
                                  fontWeight="600"
                                  color="gray.700"
                                  flex={1}
                                >
                                  {ward.name}
                                </Text>
                                <Text fontSize="xs" color="gray.400">
                                  {ward.pollingStations.length} station
                                  {ward.pollingStations.length !== 1 ? "s" : ""}
                                  {" · "}
                                  {wardStreams} stream
                                  {wardStreams !== 1 ? "s" : ""}
                                </Text>
                                {/* Add station button */}
                                <HStack
                                  as="button"
                                  gap={1}
                                  px={2}
                                  py={1}
                                  borderRadius="md"
                                  fontSize="10px"
                                  fontWeight="600"
                                  color="gray.400"
                                  cursor="pointer"
                                  _hover={{ color: "#0891b2", bg: "#e0f2fe" }}
                                  transition="all 0.15s"
                                  onClick={() => {
                                    setAddingStationToWard(ward.id);
                                    setAddStationError("");
                                    if (!isOpen) toggleExpand(ward.id);
                                  }}
                                >
                                  <FiPlus fontSize="0.65rem" />
                                  <Text>Station</Text>
                                </HStack>
                                <WardDeleteButton
                                  wardId={ward.id}
                                  onConfirm={() => handleDeleteWard(ward.id)}
                                  isPending={isPending}
                                />
                              </HStack>

                              {/* Expanded content */}
                              {isOpen && (
                                <Box>
                                  {/* Add station inline form */}
                                  {isAddingStation && (
                                    <Box
                                      px={8}
                                      py={3}
                                      bg="#f0f9ff"
                                      borderTopWidth="1px"
                                      borderTopColor="#e0f2fe"
                                    >
                                      <Text
                                        fontSize="xs"
                                        fontWeight="600"
                                        color="#0369a1"
                                        mb={2}
                                      >
                                        Add Polling Station to{" "}
                                        <strong>{ward.name}</strong>
                                      </Text>
                                      <InlineForm
                                        fields={[
                                          {
                                            key: "name",
                                            label: "Name",
                                            placeholder: "Station name",
                                            required: true,
                                          },
                                          {
                                            key: "code",
                                            label: "Code",
                                            placeholder: "Code e.g. PS-001",
                                            required: true,
                                          },
                                          {
                                            key: "voters",
                                            label: "Voters",
                                            placeholder:
                                              "Registered voters (optional)",
                                            type: "number",
                                          },
                                        ]}
                                        onSave={(vals) =>
                                          handleAddStation(ward.id, vals)
                                        }
                                        onCancel={() => {
                                          setAddingStationToWard(null);
                                          setAddStationError("");
                                        }}
                                        isPending={addStationPending}
                                        error={addStationError}
                                      />
                                    </Box>
                                  )}

                                  {/* Polling stations */}
                                  {ward.pollingStations.length === 0 &&
                                    !isAddingStation && (
                                      <HStack
                                        px={8}
                                        py={3}
                                        gap={2}
                                        borderTopWidth="1px"
                                        borderTopColor="gray.50"
                                      >
                                        <Text fontSize="xs" color="gray.300">
                                          No polling stations &mdash; click
                                          &quot;+ Station&quot; to add one.
                                        </Text>
                                      </HStack>
                                    )}

                                  {ward.pollingStations
                                    .sort((a, b) =>
                                      a.name.localeCompare(b.name),
                                    )
                                    .map((ps, psIdx) => {
                                      const isAddingStreamHere =
                                        addingStreamToStation === ps.id;
                                      return (
                                        <Box
                                          key={ps.id}
                                          borderTopWidth="1px"
                                          borderTopColor="gray.50"
                                          bg={
                                            psIdx % 2 === 0
                                              ? "white"
                                              : "#fafafa"
                                          }
                                        >
                                          {/* Station row */}
                                          <HStack px={8} py={2.5} gap={3}>
                                            <FiMapPin
                                              fontSize="0.75rem"
                                              color="#9ca3af"
                                            />
                                            <Text
                                              fontSize="sm"
                                              color="gray.700"
                                              flex={1}
                                            >
                                              {ps.name}
                                              <Text
                                                as="span"
                                                fontSize="xs"
                                                color="gray.400"
                                                ml={1.5}
                                              >
                                                {ps.code}
                                              </Text>
                                            </Text>

                                            {/* Streams */}
                                            <HStack
                                              gap={1.5}
                                              flexWrap="wrap"
                                              flex={1}
                                            >
                                              {ps.streams.length === 0 &&
                                                !isAddingStreamHere && (
                                                  <Text
                                                    fontSize="10px"
                                                    color="gray.300"
                                                  >
                                                    no streams
                                                  </Text>
                                                )}
                                              {ps.streams.map((stream) => (
                                                <HStack
                                                  key={stream.id}
                                                  gap={0.5}
                                                >
                                                  <Badge
                                                    px={1.5}
                                                    py={0.5}
                                                    bg="#f3f4f6"
                                                    color="gray.600"
                                                    borderRadius="sm"
                                                    fontSize="10px"
                                                    fontWeight="600"
                                                  >
                                                    <HStack gap={1}>
                                                      <FiGrid fontSize="0.55rem" />
                                                      <Text>
                                                        {stream.name ||
                                                          stream.code}
                                                      </Text>
                                                    </HStack>
                                                  </Badge>
                                                  <DeleteButton
                                                    onConfirm={() =>
                                                      handleDeleteStream(
                                                        ward.id,
                                                        ps.id,
                                                        stream.id,
                                                      )
                                                    }
                                                    isPending={isPending}
                                                  />
                                                </HStack>
                                              ))}
                                            </HStack>

                                            {ps.registeredVoters && (
                                              <Text
                                                fontSize="xs"
                                                color="gray.400"
                                                flexShrink={0}
                                              >
                                                {ps.registeredVoters.toLocaleString()}{" "}
                                                voters
                                              </Text>
                                            )}

                                            {/* Add stream button */}
                                            <HStack
                                              as="button"
                                              gap={1}
                                              px={2}
                                              py={1}
                                              borderRadius="md"
                                              fontSize="10px"
                                              fontWeight="600"
                                              color="gray.400"
                                              cursor="pointer"
                                              _hover={{
                                                color: "#16a34a",
                                                bg: "#dcfce7",
                                              }}
                                              transition="all 0.15s"
                                              onClick={() => {
                                                setAddingStreamToStation(ps.id);
                                                setAddStreamError("");
                                              }}
                                            >
                                              <FiPlus fontSize="0.65rem" />
                                              <Text>Stream</Text>
                                            </HStack>
                                            <DeleteButton
                                              onConfirm={() =>
                                                handleDeleteStation(
                                                  ward.id,
                                                  ps.id,
                                                )
                                              }
                                              isPending={isPending}
                                            />
                                          </HStack>

                                          {/* Add stream inline form */}
                                          {isAddingStreamHere && (
                                            <Box
                                              px={10}
                                              py={3}
                                              bg="#f0fdf4"
                                              borderTopWidth="1px"
                                              borderTopColor="#dcfce7"
                                            >
                                              <Text
                                                fontSize="xs"
                                                fontWeight="600"
                                                color="#16a34a"
                                                mb={2}
                                              >
                                                Add Stream to{" "}
                                                <strong>{ps.name}</strong>
                                              </Text>
                                              <InlineForm
                                                fields={[
                                                  {
                                                    key: "name",
                                                    label: "Name",
                                                    placeholder:
                                                      "e.g. Stream A",
                                                    required: true,
                                                  },
                                                  {
                                                    key: "code",
                                                    label: "Code",
                                                    placeholder: "e.g. A",
                                                    required: true,
                                                  },
                                                  {
                                                    key: "voters",
                                                    label: "Voters",
                                                    placeholder:
                                                      "Registered voters (optional)",
                                                    type: "number",
                                                  },
                                                ]}
                                                onSave={(vals) =>
                                                  handleAddStream(
                                                    ward.id,
                                                    ps.id,
                                                    vals,
                                                  )
                                                }
                                                onCancel={() => {
                                                  setAddingStreamToStation(
                                                    null,
                                                  );
                                                  setAddStreamError("");
                                                }}
                                                isPending={addStreamPending}
                                                error={addStreamError}
                                              />
                                            </Box>
                                          )}
                                        </Box>
                                      );
                                    })}
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                    </Box>
                  )})}
              </VStack>
            </Box>
          );
        })}
    </VStack>
  );
}
