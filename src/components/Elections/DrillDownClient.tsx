"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import DrillDown from "./DrillDown"
import type { DrillDownResult } from "@/services/PublicResults"

export default function DrillDownClient({ electionId, positionId }: { electionId: string; positionId: string }) {
  const { data: initial, isLoading } = useQuery<DrillDownResult>({
    queryKey: ["public-results", electionId, positionId],
    queryFn: async () => {
      const res = await fetch(`/api/public-results?electionId=${encodeURIComponent(electionId)}&positionId=${encodeURIComponent(positionId)}`)
      return res.json()
    },
  })

  if (isLoading || !initial) return null
  return <DrillDown initial={initial} electionId={electionId} />
}
