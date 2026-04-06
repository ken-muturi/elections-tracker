"use client"

import React, { useEffect, useState } from "react"
import DrillDown from "./DrillDown"
import type { DrillDownResult } from "@/services/PublicResults"

export default function DrillDownClient({ electionId, positionId }: { electionId: string; positionId: string }) {
  const [initial, setInitial] = useState<DrillDownResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch(`/api/public-results?electionId=${encodeURIComponent(electionId)}&positionId=${encodeURIComponent(positionId)}`)
        const json = await res.json()
        if (mounted) setInitial(json)
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [electionId, positionId])

  if (loading || !initial) return null
  return <DrillDown initial={initial} electionId={electionId} />
}
