/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { RoleDetail } from "../type";
import { dictionary } from "../dictionary";
import { PartialTranslation, TranslationText } from "@/types";
import Actions from "./Actions";

const columnHelper = createColumnHelper<RoleDetail>();

const Columns = ({
  translate,
}: {
  translate: (
    text:
      | TranslationText
      | PartialTranslation
      | PartialTranslation[]
      | undefined
  ) => string;
}): ColumnDef<RoleDetail, any>[] => {
  return [
    columnHelper.accessor("id", {
      header: "#",
      enableColumnFilter: false,
      enableHiding: false,
      enableGrouping: false,
      size: 30,
      cell: (cell) => cell.row.index + 1,
    }),
    columnHelper.accessor("title", {
      header: translate(dictionary.role),
    }),
    columnHelper.accessor("description", {
      header: translate(dictionary.description),
    }),
    columnHelper.accessor("id", {
      header: translate(dictionary.actions),
      enableColumnFilter: false,
      enableHiding: false,
      enableGrouping: false,
      cell: (cell) => <Actions data={cell.row.original} />,
    }),
  ];
};
export default Columns;