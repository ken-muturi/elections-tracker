"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import DrillDown from "./DrillDown"
import { getDrillDownNational } from "@/services/PublicResults";

export default function DrillDownClient({ electionId, positionId }: { electionId: string; positionId: string }) {
  const { data: initial, isLoading } = useQuery({
    queryKey: ["public-results", electionId, positionId],
    queryFn: () => getDrillDownNational(electionId, positionId),
  });

  if (isLoading || !initial) return null
  return <DrillDown initial={initial} electionId={electionId} />
}
