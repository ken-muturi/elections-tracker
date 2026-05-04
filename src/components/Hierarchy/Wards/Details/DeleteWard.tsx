"use client"

import { useQueryClient } from "@tanstack/react-query"
import { FiTrash2 } from "react-icons/fi"
import { deleteWard } from "@/services/Hierarchy"
import StyledIconButton from "@/components/Generic/StyledIconButton"
import { toaster } from "../../toaster"

export default function DeleteWard({
  id,
  name,
  electionId,
}: {
  id: string
  name: string
  electionId: string
}) {
  const qc = useQueryClient()

  const handleDelete = async () => {
    if (!confirm(`Delete ward "${name}"?`)) return
    try {
      await deleteWard(id)
      toaster.success({ title: "Ward deleted" })
      await qc.invalidateQueries({ queryKey: ["wards", electionId] })
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message })
    }
  }

  return (
    <StyledIconButton variant="delete" aria-label="Delete ward" size="xs" onClick={handleDelete}>
      <FiTrash2 size={11} />
    </StyledIconButton>
  )
}
