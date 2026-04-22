/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Badge, HStack } from "@chakra-ui/react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Stream } from "@prisma/client";
import StyledIconButton from "@/components/Generic/StyledIconButton";
import { Switch } from "@/components/ui/switch";
import { FaEdit, FaTrash } from "react-icons/fa";

const columnHelper = createColumnHelper<Stream>();

export type StreamColumnsOptions = {
  onEdit?: (stream: Stream) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => Promise<void>;
};

export const getStreamColumns = ({
  onEdit,
  onDelete,
  onToggleActive,
}: StreamColumnsOptions = {}): ColumnDef<Stream, any>[] => [
  columnHelper.accessor("code", {
    header: "Code",
    cell: (cell) => <Badge colorPalette="purple">{cell.getValue()}</Badge>,
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (cell) => <span style={{ fontWeight: 500 }}>{cell.getValue()}</span>,
  }),
  columnHelper.accessor("registeredVoters", {
    header: "Reg. Voters",
    cell: (cell) => cell.getValue()?.toLocaleString() ?? "-",
  }),
  columnHelper.accessor("isActive", {
    header: "Status",
    cell: ({ row }) =>
      onToggleActive ? (
        <Switch
          checked={row.original.isActive}
          onCheckedChange={(e) =>
            onToggleActive(row.original.id, e.checked)
          }
          colorPalette={row.original.isActive ? "green" : "gray"}
          size="sm"
        />
      ) : (
        <Badge colorPalette={row.original.isActive ? "green" : "gray"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
  }),
  columnHelper.display({
    id: "stream-actions",
    header: "Actions",
    cell: ({ row }) => (
      <HStack gap={1}>
        {onEdit && (
          <StyledIconButton
            variant="edit"
            aria-label="Edit stream"
            onClick={() => onEdit(row.original)}
          >
            <FaEdit />
          </StyledIconButton>
        )}
        {onDelete && (
          <StyledIconButton
            variant="delete"
            aria-label="Delete stream"
            onClick={() => {
              if (confirm("Are you sure you want to delete this stream?")) {
                onDelete(row.original.id);
              }
            }}
          >
            <FaTrash />
          </StyledIconButton>
        )}
      </HStack>
    ),
  }),
];
