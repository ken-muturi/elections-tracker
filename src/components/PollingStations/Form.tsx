/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  VStack,
  Input,
  createToaster,
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
import { getWardsByElection } from "@/services/Hierarchy";

const toaster = createToaster({ placement: "top-end" });

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

  useEffect(() => {
    if (!isEdit) {
      getElectionsLight().then(setElections).catch(() => {});
    }
  }, [isEdit]);

  useEffect(() => {
    if (!selectedElectionId) { setWards([]); return; }
    setWardsLoading(true);
    getWardsByElection(selectedElectionId)
      .then((w: any[]) => setWards(w))
      .catch(() => {})
      .finally(() => setWardsLoading(false));
  }, [selectedElectionId]);

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
      toaster.error({ title: "Please select a ward (choose an election first)" });
      return;
    }
    setSaving(true);
    try {
      if (station) {
        await updatePollingStation(station.id, form);
        toaster.success({ title: "Polling station updated" });
      } else {
        await createPollingStation(form);
        toaster.success({ title: "Polling station created" });
      }
      onClose();
    } catch (e: any) {
      toaster.error({ title: "Error saving polling station", description: e.message });
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
    <Dialog.Root open onOpenChange={(d) => { if (!d.open) onClose(); }} size="lg">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{isEdit ? "Edit Polling Station" : "Add Polling Station"}</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} alignItems="stretch">

              {/* Election + Ward — new stations only */}
              {!isEdit && (
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" mb={1}>Election *</Text>
                    <select
                      value={selectedElectionId}
                      onChange={(e) => {
                        setSelectedElectionId(e.target.value);
                        setForm((prev) => ({ ...prev, wardId: "", ward: "", constituency: "", county: "" }));
                      }}
                      style={selectStyle(!!selectedElectionId)}
                    >
                      <option value="">Select election…</option>
                      {elections.map((e) => (
                        <option key={e.id} value={e.id}>{e.title} ({e.year})</option>
                      ))}
                    </select>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="500" mb={1}>
                      Ward * {wardsLoading && <Spinner size="xs" ml={1} />}
                    </Text>
                    <select
                      value={form.wardId}
                      onChange={(e) => handleWardSelect(e.target.value)}
                      disabled={!selectedElectionId || wardsLoading}
                      style={selectStyle(!!form.wardId, !selectedElectionId || wardsLoading)}
                    >
                      <option value="">
                        {selectedElectionId ? (wardsLoading ? "Loading…" : "Select ward…") : "Select election first"}
                      </option>
                      {wards.map((w) => (
                        <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                      ))}
                    </select>
                  </Box>
                </SimpleGrid>
              )}

              <SimpleGrid columns={2} gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="500" mb={1}>Station Code *</Text>
                  <Input placeholder="e.g. PS001" value={form.code}
                    onChange={(e) => handleChange("code", e.target.value)} size="sm" />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="500" mb={1}>Station Name *</Text>
                  <Input placeholder="e.g. Kenyatta Primary School" value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)} size="sm" />
                </Box>
              </SimpleGrid>

              <SimpleGrid columns={3} gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="500" mb={1}>
                    County *{" "}
                    {!isEdit && form.county && <Text as="span" fontSize="xs" color="gray.400">(auto-filled)</Text>}
                  </Text>
                  <Input placeholder="e.g. Nairobi" value={form.county}
                    onChange={(e) => handleChange("county", e.target.value)} size="sm" />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="500" mb={1}>
                    Constituency *{" "}
                    {!isEdit && form.constituency && <Text as="span" fontSize="xs" color="gray.400">(auto-filled)</Text>}
                  </Text>
                  <Input placeholder="e.g. Westlands" value={form.constituency}
                    onChange={(e) => handleChange("constituency", e.target.value)} size="sm" />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="500" mb={1}>
                    Ward Name *{" "}
                    {!isEdit && form.ward && <Text as="span" fontSize="xs" color="gray.400">(auto-filled)</Text>}
                  </Text>
                  <Input placeholder="e.g. Parklands" value={form.ward}
                    onChange={(e) => handleChange("ward", e.target.value)} size="sm" />
                </Box>
              </SimpleGrid>

              <Box w="200px">
                <Text fontSize="sm" fontWeight="500" mb={1}>Registered Voters</Text>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={form.registeredVoters ?? ""}
                  onChange={(e) =>
                    handleChange("registeredVoters", e.target.value ? parseInt(e.target.value) : null)
                  }
                  size="sm"
                />
              </Box>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <Flex gap={3}>
              <Button colorPalette="blue" onClick={handleSave} loading={saving} size="sm">
                {isEdit ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={onClose} size="sm">Cancel</Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default PollingStationForm;
