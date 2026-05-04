"use client"

import React from "react"
import { Button, HStack } from "@chakra-ui/react"
import { FiPlus } from "react-icons/fi"
import { useQuery } from "@tanstack/react-query"
import { getCounties } from "@/services/Hierarchy"
import { TableGroupable } from "@/components/Generic/TableGroupable"
import Modal from "@/components/Generic/Modal"
import Form from "../Form"
import Columns, { CountyRow } from "./Columns"

export default function Details() {
  const { data: counties = [], isLoading } = useQuery({ queryKey: ["counties"], queryFn: getCounties })

  const columns = React.useMemo(() => Columns(), [])

  return (
    <TableGroupable<CountyRow>
      title="Counties"
      data={counties}
      columnInfo={columns}
      loading={isLoading}
      exportCsv
      headingContent={
        <Modal size="sm" title="Add County" mainContent={<Form />}>
          <Button size="xs" colorPalette="blue">
            <HStack gap={1.5}>
              <FiPlus fontSize="0.85rem" />
              <span>Add County</span>
            </HStack>
          </Button>
        </Modal>
      }
    />
  )
}
