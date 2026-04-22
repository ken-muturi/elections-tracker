"use client"

import { useState } from "react"
import { Button, HStack } from "@chakra-ui/react"
import { FiUpload } from "react-icons/fi"
import AgentAssignmentImportModal from "./index"

type Props = {
  elections: Array<{ id: string; title: string; year: number; isActive: boolean }>
}

export default function AgentAssignmentImportWrapper({ elections }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedElectionId, setSelectedElectionId] = useState("")

  const handleOpenImport = () => {
    // Default to the first active election, or first election
    const defaultElection = elections.find((e) => e.isActive) || elections[0]
    if (defaultElection) {
      setSelectedElectionId(defaultElection.id)
      setIsOpen(true)
    }
  }

  const selectedElection = elections.find((e) => e.id === selectedElectionId)

  return (
    <>
      {elections.length > 0 && (
        <Button
          onClick={handleOpenImport}
          colorPalette="blue"
          size="sm"
        >
          <HStack gap={1.5}>
            <FiUpload fontSize="0.85rem" />
            <span>Import CSV</span>
          </HStack>
        </Button>
      )}

      {isOpen && selectedElection && (
        <AgentAssignmentImportModal
          electionId={selectedElection.id}
          electionTitle={`${selectedElection.title} (${selectedElection.year})`}
          onSuccess={() => {
            // Refresh the page to show new assignments
            window.location.reload()
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
