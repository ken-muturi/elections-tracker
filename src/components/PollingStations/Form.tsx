/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Box,
  VStack,
  Heading,
  Input,
  createToaster,
  Flex,
  Button,
  Text,
} from "@chakra-ui/react";
import { PollingStation } from "@prisma/client";
import {
  createPollingStation,
  updatePollingStation,
  PollingStationForm as StationFormData,
} from "@/services/PollingStations";

const toaster = createToaster({ placement: "top-end" });

const PollingStationForm = ({
  station,
  onClose,
}: {
  station: PollingStation | null;
  onClose: () => void;
}) => {
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    if (!form.name || !form.code || !form.county || !form.constituency || !form.ward) {
      toaster.error({ title: "Please fill all required fields" });
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
      toaster.error({
        title: "Error saving polling station",
        description: e.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack gap={4} w="full" alignItems="start" p={4} maxW="600px">
      <Heading size="lg">
        {station ? "Edit Polling Station" : "Add Polling Station"}
      </Heading>

      <Box w="full">
        <Text fontSize="sm" fontWeight="500" mb={1}>Station Code *</Text>
        <Input
          placeholder="e.g. PS001"
          value={form.code}
          onChange={(e) => handleChange("code", e.target.value)}
          size="sm"
        />
      </Box>

      <Box w="full">
        <Text fontSize="sm" fontWeight="500" mb={1}>Station Name *</Text>
        <Input
          placeholder="e.g. Kenyatta Primary School"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          size="sm"
        />
      </Box>

      <Box w="full">
        <Text fontSize="sm" fontWeight="500" mb={1}>County *</Text>
        <Input
          placeholder="e.g. Nairobi"
          value={form.county}
          onChange={(e) => handleChange("county", e.target.value)}
          size="sm"
        />
      </Box>

      <Box w="full">
        <Text fontSize="sm" fontWeight="500" mb={1}>Constituency *</Text>
        <Input
          placeholder="e.g. Westlands"
          value={form.constituency}
          onChange={(e) => handleChange("constituency", e.target.value)}
          size="sm"
        />
      </Box>

      <Box w="full">
        <Text fontSize="sm" fontWeight="500" mb={1}>Ward *</Text>
        <Input
          placeholder="e.g. Parklands"
          value={form.ward}
          onChange={(e) => handleChange("ward", e.target.value)}
          size="sm"
        />
      </Box>

      <Box w="full">
        <Text fontSize="sm" fontWeight="500" mb={1}>Registered Voters</Text>
        <Input
          type="number"
          placeholder="e.g. 5000"
          value={form.registeredVoters ?? ""}
          onChange={(e) =>
            handleChange(
              "registeredVoters",
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          size="sm"
        />
      </Box>

      <Flex gap={3} mt={2}>
        <Button
          colorPalette="blue"
          onClick={handleSave}
          loading={saving}
          size="sm"
        >
          {station ? "Update" : "Create"}
        </Button>
        <Button variant="outline" onClick={onClose} size="sm">
          Cancel
        </Button>
      </Flex>
    </VStack>
  );
};

export default PollingStationForm;
