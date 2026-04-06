/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import {
  Badge,
  Button,
  HStack,
  createToaster,
} from "@chakra-ui/react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PollingStation } from "@prisma/client";
import {
  getPollingStations,
  deletePollingStation,
} from "@/services/PollingStations";
import { TableGroupable } from "@/components/Generic/TableGroupable";
import PollingStationForm from "./Form";
import FullPageLoader from "@/components/Generic/FullPageLoader";

const toaster = createToaster({ placement: "top-end" });
const columnHelper = createColumnHelper<PollingStation>();

/* ── Column definitions ────────────────────────────────── */

const getColumns = (
  onEdit: (station: PollingStation) => void,
  onDelete: (id: string) => void,
): ColumnDef<PollingStation, any>[] => [
  columnHelper.accessor("id", {
    header: "#",
    enableColumnFilter: false,
    enableHiding: false,
    enableGrouping: false,
    size: 40,
    cell: (cell) => cell.row.index + 1,
  }),
  columnHelper.accessor("code", {
    header: "Code",
    size: 100,
    cell: (cell) => <Badge colorPalette="blue">{cell.getValue()}</Badge>,
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (cell) => <span style={{ fontWeight: 500 }}>{cell.getValue()}</span>,
  }),
  columnHelper.accessor("county", {
    header: "County",
  }),
  columnHelper.accessor("constituency", {
    header: "Constituency",
  }),
  columnHelper.accessor("ward", {
    header: "Ward",
  }),
  columnHelper.accessor("registeredVoters", {
    header: "Reg. Voters",
    enableGrouping: false,
    cell: (cell) => cell.getValue()?.toLocaleString() ?? "-",
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    enableColumnFilter: false,
    enableSorting: false,
    enableHiding: false,
    enableGrouping: false,
    cell: ({ row }) => (
      <HStack gap={2}>
        <Button size="xs" variant="outline" onClick={() => onEdit(row.original)}>
          Edit
        </Button>
        <Button
          size="xs"
          variant="outline"
          colorPalette="red"
          onClick={() => onDelete(row.original.id)}
        >
          Delete
        </Button>
      </HStack>
    ),
  }),
];

/* ── Main component ────────────────────────────────────── */

const PollingStationsTable = ({
  stations: initialStations,
}: {
  stations: PollingStation[];
}) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editStation, setEditStation] = useState<PollingStation | null>(null);

  const { data: stations, isLoading } = useQuery({
    queryKey: ["polling-stations"],
    queryFn: async () => (await getPollingStations()) as PollingStation[],
    initialData: initialStations,
  });

  const handleDelete = async (id: string) => {
    try {
      await deletePollingStation(id);
      queryClient.invalidateQueries({ queryKey: ["polling-stations"] });
      toaster.success({ title: "Polling station deleted" });
    } catch (e: any) {
      toaster.error({
        title: "Error deleting station",
        description: e.message,
      });
    }
  };

  const handleEdit = (station: PollingStation) => setEditStation(station);

  const columns = useMemo(
    () => getColumns(handleEdit, handleDelete),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
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
      <TableGroupable<PollingStation>
        title="Polling Stations"
        data={stations || []}
        columnInfo={columns}
        exportCsv={true}
        defaultGrouping={[]}
        loading={isLoading}
        headingContent={
          <Button colorPalette="blue" onClick={() => setShowForm(true)}>
            + Add Polling Station
          </Button>
        }
      />
    </>
  );
};

export default PollingStationsTable;
