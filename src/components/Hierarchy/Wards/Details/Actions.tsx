"use client"

import { HStack } from "@chakra-ui/react"
import { FiEdit2 } from "react-icons/fi"
import Modal from "@/components/Generic/Modal"
import StyledIconButton from "@/components/Generic/StyledIconButton"
import Form from "../Form"
import DeleteWard from "./DeleteWard"
import { WardRow } from "./Columns"

export default function Actions({ data, electionId }: { data: WardRow; electionId: string }) {
  return (
    <HStack gap={1}>
      <Modal
        size="sm"
        title={`Edit Ward — ${data.name}`}
        mainContent={<Form ward={data} electionId={electionId} />}
      >
        <StyledIconButton variant="edit" aria-label="Edit ward" size="xs">
          <FiEdit2 size={11} />
        </StyledIconButton>
      </Modal>
      <DeleteWard id={data.id} name={data.name} electionId={electionId} />
    </HStack>
  )
}
