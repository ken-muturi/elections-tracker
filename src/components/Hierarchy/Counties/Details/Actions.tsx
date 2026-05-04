"use client"

import { HStack } from "@chakra-ui/react"
import { FiEdit2 } from "react-icons/fi"
import Modal from "@/components/Generic/Modal"
import StyledIconButton from "@/components/Generic/StyledIconButton"
import Form from "../Form"
import DeleteCounty from "./DeleteCounty"

type County = { id: string; name: string; code: string }

export default function Actions({ data }: { data: County }) {
  return (
    <HStack gap={1}>
      <Modal size="sm" title={`Edit County — ${data.name}`} mainContent={<Form county={data} />}>
        <StyledIconButton variant="edit" aria-label="Edit county" size="xs">
          <FiEdit2 size={11} />
        </StyledIconButton>
      </Modal>
      <DeleteCounty id={data.id} name={data.name} />
    </HStack>
  )
}
