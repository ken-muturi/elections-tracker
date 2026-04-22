/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Input,
  Text,
  VStack,
  createToaster,
} from "@chakra-ui/react";
import { Stream } from "@prisma/client";
import { updateStream, StreamForm as StreamFormData } from "@/services/PollingStations";

const toaster = createToaster({ placement: "top-end" });

const StreamForm = ({
  stream,
  onClose,
}: {
  stream: Stream;
  onClose: () => void;
}) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StreamFormData>({
    name: stream.name,
    code: stream.code,
    registeredVoters: stream.registeredVoters ?? null,
  });

  const handleChange = (field: keyof StreamFormData, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toaster.error({ title: "Name and code are required" });
      return;
    }
    setSaving(true);
    try {
      await updateStream(stream.id, form);
      toaster.success({ title: "Stream updated" });
      onClose();
    } catch (e: any) {
      toaster.error({ title: "Error saving stream", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(d) => { if (!d.open) onClose(); }} size="sm">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Edit Stream</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} alignItems="stretch">
              <Box>
                <Text fontSize="sm" fontWeight="500" mb={1}>Stream Code *</Text>
                <Input
                  placeholder="e.g. S001"
                  value={form.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  size="sm"
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="500" mb={1}>Stream Name *</Text>
                <Input
                  placeholder="e.g. Stream A"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  size="sm"
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="500" mb={1}>Registered Voters</Text>
                <Input
                  type="number"
                  placeholder="e.g. 500"
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
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <Flex gap={3}>
              <Button
                colorPalette="blue"
                onClick={handleSave}
                loading={saving}
                size="sm"
              >
                Update
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

export default StreamForm;
