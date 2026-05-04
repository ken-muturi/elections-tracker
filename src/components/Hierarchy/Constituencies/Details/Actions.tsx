"use client"

import { HStack } from "@chakra-ui/react"
import { FiEdit2 } from "react-icons/fi"
import Modal from "@/components/Generic/Modal"
import StyledIconButton from "@/components/Generic/StyledIconButton"
import Form from "../Form"
import DeleteConstituency from "./DeleteConstituency"
import { ConstituencyRow } from "./Columns"

export default function Actions({ data }: { data: ConstituencyRow }) {
  return (
    <HStack gap={1}>
      <Modal size="sm" title={`Edit Constituency — ${data.name}`} mainContent={<Form constituency={data} />}>
        <StyledIconButton variant="edit" aria-label="Edit constituency" size="xs">
          <FiEdit2 size={11} />
        </StyledIconButton>
      </Modal>
      <DeleteConstituency id={data.id} name={data.name} />
    </HStack>
  )
}
