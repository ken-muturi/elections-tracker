/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Heading,
  Input,
  createToaster,
  Table,
  Badge,
  Flex,
  Button,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PollingStation } from "@prisma/client";
import {
  getPollingStations,
  deletePollingStation,
} from "@/services/PollingStations";
import PollingStationForm from "./Form";
import FullPageLoader from "@/components/Generic/FullPageLoader";

const toaster = createToaster({ placement: "top-end" });

const PollingStationsTable = ({
  stations: initialStations,
}: {
  stations: PollingStation[];
}) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editStation, setEditStation] = useState<PollingStation | null>(null);
  const [search, setSearch] = useState("");

  const { data: stations, isLoading } = useQuery({
    queryKey: ["polling-stations"],
    queryFn: async () => (await getPollingStations()) as PollingStation[],
    initialData: initialStations,
  });

  const handleDelete = async (id: string) => {
    try {
      await deletePollingStation(id);
      queryClient.invalidateQueries({ queryKey: ["polling-stations"] });
      toaster.success({
        title: "Polling station deleted",
      });
    } catch (e: any) {
      toaster.error({
        title: "Error deleting station",
        description: e.message,
      });
    }
  };

  const filtered = (stations || []).filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.county.toLowerCase().includes(search.toLowerCase()) ||
      s.constituency.toLowerCase().includes(search.toLowerCase()) ||
      s.ward.toLowerCase().includes(search.toLowerCase())
  );

  if (showForm || editStation) {
    return (
      <PollingStationForm
        station={editStation}
        onClose={() => {
          setShowForm(false);
          setEditStation(null);
          queryClient.invalidateQueries({ queryKey: ["polling-stations"] });
        }}
      />
    );
  }

  return (
    <>
      {isLoading && <FullPageLoader />}
      <VStack gap={4} w="full" alignItems="start" p={4}>
        <Flex
          w="full"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={3}
        >
          <Box>
            <Heading size="lg">Polling Stations</Heading>
            <Text color="gray.500" fontSize="sm">
              Manage polling stations for election result collection
            </Text>
          </Box>
          <Button
            colorPalette="blue"
            onClick={() => setShowForm(true)}
          >
            + Add Polling Station
          </Button>
        </Flex>

        <Input
          placeholder="Search by name, code, county, constituency, or ward..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxW="400px"
          size="sm"
        />

        <Box w="full" overflowX="auto">
          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>#</Table.ColumnHeader>
                <Table.ColumnHeader>Code</Table.ColumnHeader>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>County</Table.ColumnHeader>
                <Table.ColumnHeader>Constituency</Table.ColumnHeader>
                <Table.ColumnHeader>Ward</Table.ColumnHeader>
                <Table.ColumnHeader>Reg. Voters</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filtered.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8}>
                    <Text textAlign="center" color="gray.400" py={4}>
                      No polling stations found
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filtered.map((station, index) => (
                  <Table.Row key={station.id}>
                    <Table.Cell>{index + 1}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette="blue">{station.code}</Badge>
                    </Table.Cell>
                    <Table.Cell fontWeight="500">{station.name}</Table.Cell>
                    <Table.Cell>{station.county}</Table.Cell>
                    <Table.Cell>{station.constituency}</Table.Cell>
                    <Table.Cell>{station.ward}</Table.Cell>
                    <Table.Cell>
                      {station.registeredVoters?.toLocaleString() ?? "-"}
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={2}>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setEditStation(station)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          colorPalette="red"
                          onClick={() => handleDelete(station.id)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>

        <Text fontSize="xs" color="gray.400">
          Total: {filtered.length} polling stations
        </Text>
      </VStack>
    </>
  );
};

export default PollingStationsTable;
