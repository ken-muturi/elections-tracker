/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { Badge, Text } from "@chakra-ui/react"
import Actions from "./Actions"

export type WardRow = {
  id: string; name: string; code: string; constituencyId: string
  constituency: { name: string; county: { name: string } }
  _count: { pollingStations: number }
}

const columnHelper = createColumnHelper<WardRow>()

const Columns = (electionId: string): ColumnDef<WardRow, any>[] => [
  columnHelper.accessor("id", {
    header: "#",
    enableGrouping: false,
    enableColumnFilter: false,
    size: 40,
    cell: (cell) => cell.row.index + 1,
  }),
  columnHelper.accessor("name", {
    header: "Ward",
    cell: (cell) => <Text fontWeight="500">{cell.getValue()}</Text>,
  }),
  columnHelper.accessor("code", {
    header: "Code",
    cell: (cell) => <Badge colorPalette="purple">{cell.getValue()}</Badge>,
  }),
  columnHelper.accessor("constituency.name", {
    id: "constituencyName",
    header: "Constituency",
    cell: (cell) => cell.getValue(),
  }),
  columnHelper.accessor("constituency.county.name", {
    id: "countyName",
    header: "County",
    cell: (cell) => cell.getValue(),
  }),
  columnHelper.accessor("_count.pollingStations", {
    id: "stations",
    header: "Stations",
    enableGrouping: false,
    cell: (cell) => <Badge colorPalette="blue" variant="subtle">{cell.getValue()}</Badge>,
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    enableGrouping: false,
    enableColumnFilter: false,
    cell: ({ row }) => <Actions data={row.original} electionId={electionId} />,
  }),
]

export default Columns
