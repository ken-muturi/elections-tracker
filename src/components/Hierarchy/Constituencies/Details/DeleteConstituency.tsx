"use client"

import { useQueryClient } from "@tanstack/react-query"
import { FiTrash2 } from "react-icons/fi"
import { deleteConstituency } from "@/services/Hierarchy"
import StyledIconButton from "@/components/Generic/StyledIconButton"
import { toaster } from "../../toaster"

export default function DeleteConstituency({ id, name }: { id: string; name: string }) {
  const qc = useQueryClient()

  const handleDelete = async () => {
    if (!confirm(`Delete constituency "${name}"?`)) return
    try {
      await deleteConstituency(id)
      toaster.success({ title: "Constituency deleted" })
      await qc.invalidateQueries({ queryKey: ["all-constituencies"] })
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message })
    }
  }

  return (
    <StyledIconButton variant="delete" aria-label="Delete constituency" size="xs" onClick={handleDelete}>
      <FiTrash2 size={11} />
    </StyledIconButton>
  )
}
