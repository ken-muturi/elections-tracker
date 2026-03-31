/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { QuestionnaireDetail } from "../type";
import { PartialTranslation, TranslationText } from "@/types";
import { dictionary } from "../dictionary";
import Actions from "./Actions";
import { Box, VStack } from "@chakra-ui/react";

const columnHelper = createColumnHelper<QuestionnaireDetail>();

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
}): ColumnDef<QuestionnaireDetail, any>[] => {
  return [
    columnHelper.accessor("id", {
      header: "#",
      enableColumnFilter: false,
      enableHiding: false,
      enableGrouping: false,
      size: 30,
      cell: ({ row }) => row.index + 1,
    }),
    columnHelper.accessor("title", {
      header: translate(dictionary.form),
      cell: ({ row }) => {
        return (
          <VStack align="start" gap={1} py={2}>
            <Box fontSize="sm">{translate(row.original.title)}</Box>
            <Box fontSize="xs" fontStyle="italic">
              {translate(row.original.description)}
            </Box>
          </VStack>
        );
      },
    }),
    columnHelper.accessor("startDate", {
      header: translate(dictionary.startDate),
    }),
    columnHelper.accessor("endDate", {
      header: translate(dictionary.endDate),
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