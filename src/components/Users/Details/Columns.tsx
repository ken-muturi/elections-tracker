/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Text, HStack, Box, Tooltip } from "@chakra-ui/react";
import { UserDetail } from "../type";
// import PhotoModal from "@/components/Generic/PhotoModal"; // TODO: Implement PhotoModal component
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
      | undefined
  ) => string;
};
const Columns = ({
  roles,
  translate,
}: UserColumnProps): ColumnDef<UserDetail, any>[] => {
  return [
    // columnHelper.accessor("id", {
    //   header: "#",
    //   cell: ({ row }) => row.index + 1,
    //   enableGrouping: false,
    //   enableSorting: false,
    //   enableHiding: false,
    //   enableColumnFilter: false,
    //   size: 50,
    // }),
    columnHelper.accessor("fullnames", {
      header: translate(dictionary.photo),
      enableGrouping: false,
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
      size: 50,
      cell: ({ row }) => (
        <HStack gap={2} alignItems="center" py={1}>
          <Box 
            w="40px" 
            h="40px" 
            bg="gray.200" 
            rounded="md" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
          >
            {/* TODO: Replace with PhotoModal component */}
            {row.original.image ? "IMG" : "?"}
          </Box>
          <Text>{row.original.fullnames}</Text>
        </HStack>
      ),
    }),
    columnHelper.accessor("role", {
      header: translate(dictionary.role),
    }),
    columnHelper.accessor("organizationTitle", {
      header: translate(dictionary.organization),
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

    // columnHelper.accessor("dateOfBirth", {
    //   header: translate(dictionary.dateOfBirth),
    //   cell: (cell) => {
    //     const d = cell.getValue();
    //     return <Box>{new Date(d).toLocaleDateString()}</Box>;
    //   },
    // }),
    // columnHelper.accessor("nationalId", {
    //   header: translate(dictionary.nationalId),
    // }),
    // columnHelper.accessor("address", {
    //   header: translate(dictionary.address),
    // }),
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
      cell: (cell) => (
        <Actions
          roles={roles}
          data={cell.row.original}
        />
      ),
    }),
  ];
};

export default Columns;