"use client"

import React from "react"
import { Button, HStack } from "@chakra-ui/react"
import { FiPlus } from "react-icons/fi"
import { useQuery } from "@tanstack/react-query"
import { getAllConstituencies } from "@/services/Hierarchy"
import { TableGroupable } from "@/components/Generic/TableGroupable"
import Modal from "@/components/Generic/Modal"
import Form from "../Form"
import Columns, { ConstituencyRow } from "./Columns"

export default function Details() {
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["all-constituencies"],
    queryFn: getAllConstituencies,
  })

  const columns = React.useMemo(() => Columns(), [])

  return (
    <TableGroupable<ConstituencyRow>
      title="Constituencies"
      data={all}
      columnInfo={columns}
      loading={isLoading}
      exportCsv
      defaultGrouping={["countyName"]}
      headingContent={
        <Modal size="sm" title="Add Constituency" mainContent={<Form />}>
          <Button size="xs" colorPalette="blue">
            <HStack gap={1.5}>
              <FiPlus fontSize="0.85rem" />
              <span>Add Constituency</span>
            </HStack>
          </Button>
        </Modal>
      }
    />
  )
}
