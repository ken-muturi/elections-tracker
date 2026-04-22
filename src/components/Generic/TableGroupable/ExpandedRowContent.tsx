/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Table } from "@chakra-ui/react";
import { type ColumnDef } from "@tanstack/react-table";

/** Rendered as a sub-header row when a parent row is expanded */
export const ChildHeader = <T,>({
  childColumns,
  totalColumnCount = 0,
}: {
  childColumns: ColumnDef<T>[];
  totalColumnCount?: number;
}): React.ReactElement => {
  const remainingCols = Math.max(0, totalColumnCount - childColumns.length - 1);

  return (
    <Table.Row bg="#e8f4f8">
      {/* indent cell */}
      <Table.Cell
        bg="#e8f4f8"
        borderBottom="2px solid"
        borderColor="#d0e8f0"
        p={0}
        w="40px"
      />
      {childColumns.map((column: any, idx: number) => (
        <Table.Cell
          key={idx}
          fontWeight="bold"
          fontSize="xs"
          py={1}
          px={3}
          borderBottom="2px solid"
          borderColor="#d0e8f0"
          bg="#e8f4f8"
          style={{ textTransform: "uppercase", letterSpacing: "0.5px", color: "#374151" }}
        >
          {typeof column.header === "string" ? column.header : ""}
        </Table.Cell>
      ))}
      {remainingCols > 0 && (
        <Table.Cell
          colSpan={remainingCols}
          bg="#e8f4f8"
          borderBottom="2px solid"
          borderColor="#d0e8f0"
        />
      )}
    </Table.Row>
  );
};

/** Rendered once per child item under an expanded parent row */
export const ChildRow = <T,>({
  item,
  childColumns,
  totalColumnCount = 0,
}: {
  item: T;
  childColumns: ColumnDef<T>[];
  totalColumnCount?: number;
}): React.ReactElement => {
  const remainingCols = Math.max(0, totalColumnCount - childColumns.length - 1);

  return (
    <Table.Row bg="#f5f9fc" _hover={{ bg: "#eef5fb" }} transition="background 0.12s">
      {/* indent cell */}
      <Table.Cell
        bg="inherit"
        borderBottom="1px solid"
        borderColor="#e0e0e0"
        p={0}
        w="40px"
        borderLeft="3px solid #90cdf4"
      />
      {childColumns.map((column: any, idx: number) => {
        // Build a minimal CellContext-compatible mock so column.cell() works
        // regardless of whether it uses cell.getValue(), row.original, etc.
        const getValue = () => (item as any)[column.accessorKey];
        const mockContext = {
          getValue,
          renderValue: getValue,
          row: { original: item, getValue, id: idx.toString() },
          column: { id: column.accessorKey ?? column.id ?? String(idx), columnDef: column },
          cell: { id: String(idx), getValue, renderValue: getValue },
          table: {},
        };
        const cellContent =
          typeof column.cell === "function"
            ? column.cell(mockContext)
            : String((item as any)[column.accessorKey] ?? "");

        return (
          <Table.Cell
            key={idx}
            py={1}
            px={3}
            fontSize="xs"
            borderBottom="1px solid"
            borderColor="#e0e0e0"
            bg="inherit"
          >
            {cellContent}
          </Table.Cell>
        );
      })}
      {remainingCols > 0 && (
        <Table.Cell
          colSpan={remainingCols}
          bg="inherit"
          borderBottom="1px solid"
          borderColor="#e0e0e0"
        />
      )}
    </Table.Row>
  );
};
