"use client"

import { useQueryClient } from "@tanstack/react-query"
import { FiTrash2 } from "react-icons/fi"
import { deleteCounty } from "@/services/Hierarchy"
import StyledIconButton from "@/components/Generic/StyledIconButton"
import { toaster } from "../../toaster"

export default function DeleteCounty({ id, name }: { id: string; name: string }) {
  const qc = useQueryClient()

  const handleDelete = async () => {
    if (!confirm(`Delete county "${name}"? This will also remove its constituencies.`)) return
    try {
      await deleteCounty(id)
      toaster.success({ title: "County deleted" })
      await qc.invalidateQueries({ queryKey: ["counties"] })
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message })
    }
  }

  return (
    <StyledIconButton variant="delete" aria-label="Delete county" size="xs" onClick={handleDelete}>
      <FiTrash2 size={11} />
    </StyledIconButton>
  )
}
