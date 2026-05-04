/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { Badge, Text } from "@chakra-ui/react"
import Actions from "./Actions"

export type CountyRow = { id: string; name: string; code: string }

const columnHelper = createColumnHelper<CountyRow>()

const Columns = (): ColumnDef<CountyRow, any>[] => [
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
  columnHelper.display({
    id: "actions",
    header: "Actions",
    enableGrouping: false,
    enableColumnFilter: false,
    cell: ({ row }) => <Actions data={row.original} />,
  }),
]

export default Columns
