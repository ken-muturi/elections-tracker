"use client"

import React, { useState } from "react"
import { Button, HStack } from "@chakra-ui/react"
import { FiPlus } from "react-icons/fi"
import { useQuery } from "@tanstack/react-query"
import { getWardsByElection } from "@/services/Hierarchy"
import { TableGroupable } from "@/components/Generic/TableGroupable"
import Modal from "@/components/Generic/Modal"
import Form from "../Form"
import Columns, { WardRow } from "./Columns"
import { Election } from "../../types"

export default function Details({ elections }: { elections: Election[] }) {
  const [electionId, setElectionId] = useState(elections[0]?.id ?? "")

  const { data: wards = [], isLoading } = useQuery({
    queryKey: ["wards", electionId],
    queryFn: () => getWardsByElection(electionId),
    enabled: !!electionId,
  })

  const columns = React.useMemo(() => Columns(electionId), [electionId])

  return (
    <TableGroupable<WardRow>
      title="Wards"
      data={wards}
      columnInfo={columns}
      loading={isLoading}
      exportCsv
      defaultGrouping={["countyName"]}
      advancedSearchButton={
        <select
          value={electionId}
          onChange={(e) => setElectionId(e.target.value)}
          style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 10px", fontSize: 13, background: "white" }}
        >
          <option value="">Select election…</option>
          {elections.map((e) => (
            <option key={e.id} value={e.id}>{e.title} ({e.year})</option>
          ))}
        </select>
      }
      headingContent={
        <Modal
          size="sm"
          title="Add Ward"
          mainContent={<Form electionId={electionId} />}
        >
          <Button size="xs" colorPalette="blue" disabled={!electionId}>
            <HStack gap={1.5}>
              <FiPlus fontSize="0.85rem" />
              <span>Add Ward</span>
            </HStack>
          </Button>
        </Modal>
      }
    />
  )
}
