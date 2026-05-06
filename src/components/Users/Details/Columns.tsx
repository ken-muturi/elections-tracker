/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Text, HStack, Box, Tooltip } from "@chakra-ui/react";
import { UserDetail } from "../type";
import PhotoModal from "@/components/Generic/PhotoModel";
const columnHelper = createColumnHelper<UserDetail>();
import { ucwords } from "@/utils/util";
import Actions from "./Actions";
import { Role } from "@prisma/client";
import { PartialTranslation, TranslationText } from "@/types";
import { dictionary } from "../dictionary";
type UserColumnProps = {
  roles: Role[];
  translate: (
    text:
      | TranslationText
      | PartialTranslation
      | PartialTranslation[]
      | undefined,
  ) => string;
};
const Columns = ({
  roles,
  translate,
}: UserColumnProps): ColumnDef<UserDetail, any>[] => {
  return [
    columnHelper.accessor("id", {
      header: "#",
      cell: (cell) => cell.row.index + 1,
      enableGrouping: false,
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
      size: 50,
    }),
    columnHelper.accessor("fullnames", {
      header: translate(dictionary.fullnames),
    }),
    columnHelper.accessor("image", {
      header: "Photo",
      enableColumnFilter: false,
      enableSorting: false,
      enableHiding: false,
      enableGrouping: false,
      cell: (cell) => (
        <PhotoModal
          image={cell.row.original.image}
          title={`${cell.row.original.firstname} ${cell.row.original.othernames}`}
        />
      ),
    }),
    columnHelper.accessor("role", {
      header: translate(dictionary.role),
    }),
    columnHelper.accessor("partyTitle", {
      header: translate(dictionary.party),
    }),
    columnHelper.accessor("gender", {
      header: translate(dictionary.gender),
      cell: (cell) => ucwords(cell.getValue()),
    }),

    columnHelper.accessor("phone", {
      header: translate(dictionary.phone),
    }),
    columnHelper.accessor("alternatePhone", {
      header: translate(dictionary.alternatePhone),
    }),
    columnHelper.accessor("email", {
      header: translate(dictionary.email),
      cell: (cell) => {
        const d = cell.row.original;
        return (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Box>{d.email}</Box>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <Tooltip.Arrow />
              {`${d.email} - ${d.phone}`}
            </Tooltip.Content>
          </Tooltip.Root>
        );
      },
    }),
    // columnHelper.accessor("nextOfKin", {
    //   header: translate(dictionary.nextOfKin),
    //   cell: (cell) => {
    //     const d = cell.row.original;
    //     return (
    //       <Tooltip
    //         hasArrow
    //         label={`${d.nextOfKin} - ${d.nextOfKinContacts}`}
    //         aria-label={`${d.nextOfKin} - ${d.nextOfKinContacts}`}
    //       >
    //         <Box>{d.nextOfKin}</Box>
    //       </Tooltip>
    //     );
    //   },
    // }),
    columnHelper.accessor("id", {
      header: translate(dictionary.actions),
      cell: (cell) => <Actions roles={roles} data={cell.row.original} />,
    }),
  ];
};

export default Columns;