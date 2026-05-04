/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { Badge, Text } from "@chakra-ui/react"
import Actions from "./Actions"

export type ConstituencyRow = {
  id: string; name: string; code: string; countyId: string
  county: { name: string; code: string }
}

const columnHelper = createColumnHelper<ConstituencyRow>()

const Columns = (): ColumnDef<ConstituencyRow, any>[] => [
  columnHelper.accessor("id", {
    header: "#",
    enableGrouping: false,
    enableColumnFilter: false,
    size: 40,
    cell: (cell) => cell.row.index + 1,
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (cell) => <Text fontWeight="500">{cell.getValue()}</Text>,
  }),
  columnHelper.accessor("code", {
    header: "Code",
    cell: (cell) => <Badge colorPalette="gray">{cell.getValue()}</Badge>,
  }),
  columnHelper.accessor("county.name", {
    id: "countyName",
    header: "County",
    cell: (cell) => cell.getValue(),
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    enableGrouping: false,
    enableColumnFilter: false,
    cell: ({ row }) => <Actions data={row.original} />,
  }),
]

export default Columns
