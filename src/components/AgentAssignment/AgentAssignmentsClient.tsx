"use client"

import { useRef } from "react"
import { VStack } from "@chakra-ui/react"
import AssignAgentForm from "./AssignAgentForm"
import AssignmentList from "./AssignmentList"

type Assignment = {
  id: string
  agentId: string
  electionId: string
  agent: { id: string; firstname: string; othernames: string; email: string }
  stream: {
    name: string
    code: string
    pollingStation: { name: string; ward: string; constituency: string; county: string }
  }
}

type ElectionGroup = {
  election: { id: string; title: string; year: number; isActive: boolean }
  assignments: Assignment[]
}

export default function AgentAssignmentsClient({
  data,
}: {
  data: Record<string, ElectionGroup>
}) {
  const formRef = useRef<{ prefill: (electionId: string, agentId: string) => void } | null>(null)

  const handleReassign = (electionId: string, agentId: string) => {
    formRef.current?.prefill(electionId, agentId)
    // Scroll to the form at top
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <VStack gap={4} alignItems="stretch">
      <AssignAgentForm formRef={formRef} />
      <AssignmentList data={data} onReassign={handleReassign} />
    </VStack>
  )
}
