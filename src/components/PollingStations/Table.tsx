/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import {
  Badge,
  Button,
  HStack,
} from "@chakra-ui/react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PollingStation, Stream } from "@prisma/client";
import {
  getPollingStations,
  deletePollingStation,
  deleteStream,
  togglePollingStationActive,
  toggleStreamActive,
} from "@/services/PollingStations";
import { TableGroupable } from "@/components/Generic/TableGroupable";
import PollingStationForm from "./Form";
import StreamForm from "./StreamForm";
import FullPageLoader from "@/components/Generic/FullPageLoader";
import StyledIconButton from "@/components/Generic/StyledIconButton";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import { getStreamColumns } from "./StreamColumns";

import { toaster } from "@/components/ui/toaster";
type ElectionActivation = { election: { id: string; title: string; year: number } }
type PollingStationWithStreams = PollingStation & { streams: Stream[]; electionActivations?: ElectionActivation[] };

const columnHelper = createColumnHelper<PollingStationWithStreams>();

/* ── Column definitions ────────────────────────────────── */

const getColumns = (
  onEdit: (station: PollingStationWithStreams) => void,
  onDelete: (id: string) => void,
  onToggleActive: (id: string, isActive: boolean) => Promise<void>,
  onAddStream: (station: PollingStationWithStreams) => void,
): ColumnDef<PollingStationWithStreams, any>[] => [
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
    id: "elections",
    header: "Elections",
    enableGrouping: false,
    enableSorting: false,
    cell: ({ row }) => {
      const activations = row.original.electionActivations
      if (!activations?.length) return <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
      return (
        <HStack gap={1} flexWrap="wrap">
          {activations.map(({ election }) => (
            <Badge key={election.id} colorPalette="blue" size="xs" borderRadius="full">
              {election.title} ({election.year})
            </Badge>
          ))}
        </HStack>
      )
    },
  }),
  columnHelper.accessor("isActive", {
    header: "Status",
    enableGrouping: false,
    enableSorting: true,
    size: 100,
    cell: ({ row }) => (
      <Switch
        checked={row.original.isActive}
        onCheckedChange={(e) => onToggleActive(row.original.id, e.checked)}
        colorPalette={row.original.isActive ? "green" : "gray"}
        size="sm"
      />
    ),
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
        <StyledIconButton
          variant="edit"
          aria-label="Add stream"
          onClick={() => onAddStream(row.original)}
        >
          <FaPlus />
        </StyledIconButton>
        <StyledIconButton
          variant="edit"
          aria-label="Edit polling station"
          onClick={() => onEdit(row.original)}
        >
          <FaEdit />
        </StyledIconButton>
        <StyledIconButton
          variant="delete"
          aria-label="Delete polling station"
          onClick={() => {
            if (confirm("Are you sure you want to delete this polling station?")) {
              onDelete(row.original.id);
            }
          }}
        >
          <FaTrash />
        </StyledIconButton>
      </HStack>
    ),
  }),
];

/* ── Main component ────────────────────────────────────── */

const PollingStationsTable = ({
  stations: initialStations,
}: {
  stations: PollingStationWithStreams[];
}) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editStation, setEditStation] =
    useState<PollingStationWithStreams | null>(null);
  const [editStream, setEditStream] = useState<Stream | null>(null);
  const [addStreamForStation, setAddStreamForStation] = useState<PollingStationWithStreams | null>(null);

  const { data: stations, isLoading } = useQuery({
    queryKey: ["polling-stations"],
    queryFn: async () =>
      (await getPollingStations()) as PollingStationWithStreams[],
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

  const handleEdit = (station: PollingStationWithStreams) =>
    setEditStation(station);

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await togglePollingStationActive(id, isActive);
      queryClient.invalidateQueries({ queryKey: ["polling-stations"] });
    } catch (e: any) {
      toaster.error({
        title: "Error updating status",
        description: e.message,
      });
    }
  };

  const handleToggleStream = async (id: string, isActive: boolean) => {
    try {
      await toggleStreamActive(id, isActive);
      queryClient.invalidateQueries({ queryKey: ["polling-stations"] });
    } catch (e: any) {
      toaster.error({ title: "Error updating stream status", description: e.message });
    }
  };

  const handleDeleteStream = async (id: string) => {
    try {
      await deleteStream(id);
      queryClient.invalidateQueries({ queryKey: ["polling-stations"] });
      toaster.success({ title: "Stream deleted" });
    } catch (e: any) {
      toaster.error({ title: "Error deleting stream", description: e.message });
    }
  };

  const columns = useMemo(
    () => getColumns(handleEdit, handleDelete, handleToggleActive, setAddStreamForStation),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const streamColumns = useMemo(
    () =>
      getStreamColumns({
        onToggleActive: handleToggleStream,
        onEdit: setEditStream,
        onDelete: handleDeleteStream,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <>
      {isLoading && <FullPageLoader />}
      {(showForm || editStation) && (
        <PollingStationForm
          station={editStation}
          onClose={() => {
            setShowForm(false);
            setEditStation(null);
            queryClient.invalidateQueries({ queryKey: ["polling-stations"] });
          }}
        />
      )}
      {editStream && (() => {
        const parentStation = stations?.find(s => s.id === editStream.pollingStationId);
        const siblingTotal = (parentStation?.streams ?? []).reduce(
          (s, st) => s + (st.id !== editStream.id ? (st.registeredVoters ?? 0) : 0), 0
        );
        return (
          <StreamForm
            stream={editStream}
            stationVoterCap={parentStation?.registeredVoters}
            siblingVoterTotal={siblingTotal}
            onClose={() => {
              setEditStream(null);
              queryClient.invalidateQueries({ queryKey: ["polling-stations"] });
            }}
          />
        );
      })()}
      {addStreamForStation && (() => {
        const siblingTotal = addStreamForStation.streams.reduce(
          (s, st) => s + (st.registeredVoters ?? 0), 0
        );
        return (
          <StreamForm
            pollingStationId={addStreamForStation.id}
            stationVoterCap={addStreamForStation.registeredVoters}
            siblingVoterTotal={siblingTotal}
            onClose={() => {
              setAddStreamForStation(null);
              queryClient.invalidateQueries({ queryKey: ["polling-stations"] });
            }}
          />
        );
      })()}
      <TableGroupable<PollingStationWithStreams, Stream>
        title="Polling Stations"
        data={stations || []}
        columnInfo={columns}
        exportCsv={true}
        defaultGrouping={[]}
        loading={isLoading}
        expandedRows={true}
        childColumnsInfo={streamColumns}
        getChildRows={(row) => row.streams ?? []}
        headingContent={
          <Button
            size="xs"
            colorPalette="blue"
            onClick={() => setShowForm(true)}
          >
            + Add Polling Station
          </Button>
        }
      />
    </>
  );
};

export default PollingStationsTable;
