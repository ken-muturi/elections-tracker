/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ModuleDetail } from "../type";
import { HStack, Icon, Text } from "@chakra-ui/react";
import Form from "../Form";
import Modal from "@/components/Generic/Modal";
import { FaEdit } from "react-icons/fa";
import DeleteModule from "./DeleteModule";
import { PartialTranslation, TranslationText } from "@/types";
import { dictionary } from "../dictionary";

const columnHelper = createColumnHelper<ModuleDetail>()

const Columns = ({ translate }: {
    translate: (
        text: TranslationText | PartialTranslation | PartialTranslation[] | undefined
    ) => string
}): ColumnDef<ModuleDetail, any>[] => {
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
        header: translate(dictionary.module),
        enableColumnFilter: false,
        enableHiding: false,
        enableGrouping: false,
      }),
      columnHelper.accessor("description", {
        header: translate(dictionary.description),
      }),
      columnHelper.accessor("id", {
        header: translate(dictionary.actions),
        enableColumnFilter: false,
        enableHiding: false,
        enableGrouping: false,
        cell: (cell) => {
          const c = cell.row.original;
          return (
            <HStack>
              <Modal
                size="lg"
                vh="40vh"
                title={`${translate(dictionary.editModule)} ${c.title}`}
                mainContent={<Form module={c} />}
              >
                <Icon
                  cursor="pointer"
                  color="orange.400"
                  as={FaEdit}
                  aria-label="Edit"
                />
              </Modal>
              <DeleteModule id={c.id} />
            </HStack>
          );
        },
      }),
    ];
}
export default Columns;