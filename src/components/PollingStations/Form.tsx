/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  VStack,
  Input,
  Flex,
  Button,
  Text,
  Spinner,
  Dialog,
  SimpleGrid,
} from "@chakra-ui/react";
import { PollingStation } from "@prisma/client";
import {
  createPollingStation,
  updatePollingStation,
  PollingStationForm as StationFormData,
} from "@/services/PollingStations";
import { getElectionsLight } from "@/services/Elections";
import { getAllWards } from "@/services/Hierarchy";
import { toaster } from "@/components/ui/toaster";

// Detect Next.js production-sanitized server action errors
function getActionError(e: unknown, fallback: string): string {
  if (!(e instanceof Error)) return fallback;
  if ("digest" in e || e.message.includes("Server Components") || e.message.includes("digest") || !e.message.trim()) {
    return fallback;
  }
  return e.message;
}

const PollingStationForm = ({
  station,
  onClose,
}: {
  station: PollingStation | null;
  onClose: () => void;
}) => {
  const isEdit = !!station;
  const [saving, setSaving] = useState(false);

  const [elections, setElections] = useState<{ id: string; title: string; year: number }[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [wards, setWards] = useState<{
    id: string;
    name: string;
    code: string;
    constituency: { name: string; county: { name: string } };
  }[]>([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [wardsError, setWardsError] = useState(false);
  const [wardSearch, setWardSearch] = useState("");

  useEffect(() => {
    if (!isEdit) {
      getElectionsLight().then(setElections).catch(() => {});
      setWardsLoading(true);
      setWardsError(false);
      getAllWards()
        .then((w: any[]) => setWards(w))
        .catch(() => setWardsError(true))
        .finally(() => setWardsLoading(false));
    }
  }, [isEdit]);

  const [form, setForm] = useState<StationFormData>({
    wardId: station?.wardId || "",
    name: station?.name || "",
    code: station?.code || "",
    county: station?.county || "",
    constituency: station?.constituency || "",
    ward: station?.ward || "",
    registeredVoters: station?.registeredVoters || null,
  });

  const handleChange = (field: keyof StationFormData, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleWardSelect = (wardId: string) => {
    const w = wards.find((x) => x.id === wardId);
    setForm((prev) => ({
      ...prev,
      wardId,
      ward: w?.name ?? prev.ward,
      constituency: w?.constituency?.name ?? prev.constituency,
      county: w?.constituency?.county?.name ?? prev.county,
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.county || !form.constituency || !form.ward) {
      toaster.error({ title: "Please fill all required fields" });
      return;
    }
    if (!form.wardId) {
      toaster.error({ title: "Please select a ward from the dropdown above" });
      return;
    }
    setSaving(true);
    try {
      if (station) {
        await updatePollingStation(station.id, form);
        toaster.success({ title: "Polling station updated" });
      } else {
        await createPollingStation({
          ...form,
          electionId: selectedElectionId || undefined,
        });
        toaster.success({ title: "Polling station created" });
      }
      onClose();
    } catch (e: any) {
      toaster.error({
        title: `Error ${isEdit ? "updating" : "creating"} polling station`,
        description: getActionError(e, "An unexpected error occurred. Please try again."),
      });
    } finally {
      setSaving(false);
    }
  };

  const selectStyle = (hasValue: boolean, disabled?: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "6px 10px",
    fontSize: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: disabled ? "#f7fafc" : "white",
    color: hasValue ? "#1a202c" : "#a0aec0",
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  });

  return (
    <Dialog.Root
      open
      onOpenChange={(d) => {
        if (!d.open) onClose();
      }}
      size="lg"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              {isEdit ? "Edit Polling Station" : "Add Polling Station"}
            </Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} alignItems="stretch">
              {/* Election + Ward — new stations only */}
              {!isEdit && (
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" mb={1}>
                      Election *
                    </Text>
                    <select
                      value={selectedElectionId}
                      onChange={(e) => {
                        setSelectedElectionId(e.target.value);
                      }}
                      style={selectStyle(!!selectedElectionId)}
                    >
                      <option value="">Select election…</option>
                      {elections.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.title} ({e.year})
                        </option>
                      ))}
                    </select>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="500" mb={1}>
                      Ward * {wardsLoading && <Spinner size="xs" ml={1} />}
                    </Text>
                    {wardsError ? (
                      <Text fontSize="xs" color="red.500">
                        Failed to load wards. Please refresh and try again.
                      </Text>
                    ) : (
                      <>
                        <Input
                          size="sm"
                          placeholder="Search ward by name, code or county…"
                          value={wardSearch}
                          onChange={(e) => setWardSearch(e.target.value)}
                          mb={1}
                          disabled={wardsLoading}
                        />
                        <select
                          value={form.wardId}
                          onChange={(e) => handleWardSelect(e.target.value)}
                          disabled={wardsLoading}
                          style={selectStyle(!!form.wardId, wardsLoading)}
                        >
                          <option value="">
                            {wardsLoading ? "Loading wards…" : "Select ward…"}
                          </option>
                          {wards
                            .filter((w) => {
                              if (!wardSearch.trim()) return true;
                              const q = wardSearch.toLowerCase();
                              return (
                                w.name.toLowerCase().includes(q) ||
                                w.code.toLowerCase().includes(q) ||
                                w.constituency?.name?.toLowerCase().includes(q) ||
                                w.constituency?.county?.name?.toLowerCase().includes(q)
                              );
                            })
                            .map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name} — {w.constituency?.name} — {w.constituency?.county?.name} ({w.code})
                              </option>
                            ))}
                        </select>
                      </>
                    )}
                  </Box>
                </SimpleGrid>
              )}

              <SimpleGrid columns={2} gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="500" mb={1}>
                    Station Code *
                  </Text>
                  <Input
                    placeholder="e.g. PS001"
                    value={form.code}
                    onChange={(e) => handleChange("code", e.target.value)}
                    size="sm"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="500" mb={1}>
                    Station Name *
                  </Text>
                  <Input
                    placeholder="e.g. Kenyatta Primary School"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    size="sm"
                  />
                </Box>
              </SimpleGrid>

              <SimpleGrid columns={3} gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="500" mb={1}>
                    County *{" "}
                    {!isEdit && (
                      <Text as="span" fontSize="xs" color="gray.400">
                        (auto-filled)
                      </Text>
                    )}
                  </Text>
                  <Input
                    placeholder="Auto-filled from ward"
                    value={form.county}
                    onChange={(e) => isEdit && handleChange("county", e.target.value)}
                    readOnly={!isEdit}
                    bg={!isEdit ? "gray.50" : undefined}
                    size="sm"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="500" mb={1}>
                    Constituency *{" "}
                    {!isEdit && (
                      <Text as="span" fontSize="xs" color="gray.400">
                        (auto-filled)
                      </Text>
                    )}
                  </Text>
                  <Input
                    placeholder="Auto-filled from ward"
                    value={form.constituency}
                    onChange={(e) => isEdit && handleChange("constituency", e.target.value)}
                    readOnly={!isEdit}
                    bg={!isEdit ? "gray.50" : undefined}
                    size="sm"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="500" mb={1}>
                    Ward Name *{" "}
                    {!isEdit && (
                      <Text as="span" fontSize="xs" color="gray.400">
                        (auto-filled)
                      </Text>
                    )}
                  </Text>
                  <Input
                    placeholder="Auto-filled from ward"
                    value={form.ward}
                    onChange={(e) => isEdit && handleChange("ward", e.target.value)}
                    readOnly={!isEdit}
                    bg={!isEdit ? "gray.50" : undefined}
                    size="sm"
                  />
                </Box>
              </SimpleGrid>

              <Box w="200px">
                <Text fontSize="sm" fontWeight="500" mb={1}>
                  Registered Voters
                </Text>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={form.registeredVoters ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "registeredVoters",
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  size="sm"
                />
              </Box>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <Flex gap={3}>
              <Button
                colorPalette="blue"
                onClick={handleSave}
                loading={saving}
                disabled={!isEdit && !selectedElectionId}
                size="sm"
              >
                {isEdit ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={onClose} size="sm">
                Cancel
              </Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default PollingStationForm;
