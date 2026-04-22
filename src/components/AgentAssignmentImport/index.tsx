"use client"

import { useState } from "react"
import {
  Box, Text, VStack, HStack, Button, Textarea,
} from "@chakra-ui/react"
import { FiUpload, FiDownload, FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi"
import { importAgentAssignments, type ImportResult } from "@/services/AgentAssignmentImport"
import { parseCSV } from "@/services/AgentAssignmentImportUtils"

type Props = {
  electionId: string
  electionTitle: string
  onSuccess: () => void
  onClose: () => void
}

export default function AgentAssignmentImportModal({
  electionId,
  electionTitle,
  onSuccess,
  onClose,
}: Props) {
  const [csvText, setCsvText] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleImport = async () => {
    if (!csvText.trim()) return

    setIsImporting(true)
    setResult(null)

    try {
      const rows = parseCSV(csvText)
      if (rows.length === 0) {
        setResult({
          success: false,
          imported: 0,
          skipped: 0,
          errors: [{ row: 0, email: "", streamCode: "", error: "No valid rows found in CSV" }],
        })
        setIsImporting(false)
        return
      }

      const importResult = await importAgentAssignments(electionId, rows)
      setResult(importResult)

      if (importResult.imported > 0) {
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, email: "", streamCode: "", error: error instanceof Error ? error.message : "Import failed" }],
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = `agentEmail,streamCode,pollingStationCode
agent1@example.com,STREAM_A,PS_001
agent2@example.com,STREAM_B,PS_002
agent3@example.com,STREAM_C,PS_003`

    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "agent_assignment_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0,0,0,0.5)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      onClick={onClose}
    >
      <Box
        bg="white"
        borderRadius="2xl"
        maxW="700px"
        w="90%"
        maxH="90vh"
        overflow="auto"
        onClick={(e) => e.stopPropagation()}
        boxShadow="0 20px 60px rgba(0,0,0,0.3)"
      >
        {/* Header */}
        <HStack
          px={6}
          py={4}
          borderBottomWidth="1px"
          borderBottomColor="gray.100"
          justify="space-between"
        >
          <VStack alignItems="flex-start" gap={0}>
            <Text fontSize="lg" fontWeight="700" color="gray.900">
              Import Agent Assignments
            </Text>
            <Text fontSize="sm" color="gray.500">
              {electionTitle}
            </Text>
          </VStack>
          <Box
            as="button"
            onClick={onClose}
            p={2}
            borderRadius="lg"
            cursor="pointer"
            _hover={{ bg: "gray.100" }}
            transition="all 0.15s"
          >
            <FiX fontSize="1.2rem" color="#6b7280" />
          </Box>
        </HStack>

        {/* Body */}
        <VStack gap={4} p={6} alignItems="stretch">
          {/* Instructions */}
          <Box bg="#f0f9ff" borderRadius="lg" p={4} borderWidth="1px" borderColor="#bae6fd">
            <Text fontSize="sm" fontWeight="600" color="#0369a1" mb={2}>
              CSV Format
            </Text>
            <Text fontSize="xs" color="#0284c7" mb={2}>
              Each row should contain: <strong>agentEmail, streamCode, pollingStationCode</strong> (optional)
            </Text>
            <Text fontSize="xs" color="#0284c7">
              • Agent email must match an existing user
              <br />
              • Stream code must match an existing stream in this election
              <br />
              • Polling station code is optional (helps identify stream if codes are duplicated)
            </Text>
          </Box>

          {/* Download template */}
          <Button
            onClick={downloadTemplate}
            size="sm"
            variant="outline"
            colorPalette="blue"
            alignSelf="flex-start"
          >
            <HStack gap={1.5}>
              <FiDownload fontSize="0.85rem" />
              <Text>Download CSV Template</Text>
            </HStack>
          </Button>

          {/* CSV input */}
          <Box>
            <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
              Paste CSV Data
            </Text>
            <Textarea
              placeholder="agentEmail,streamCode,pollingStationCode&#10;agent1@example.com,STREAM_A,PS_001&#10;agent2@example.com,STREAM_B,PS_002"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={10}
              fontFamily="monospace"
              fontSize="xs"
              borderColor="gray.300"
              _focus={{ borderColor: "#0ea5e9", boxShadow: "0 0 0 1px #0ea5e9" }}
            />
          </Box>

          {/* Result message */}
          {result && (
            <Box>
              {result.imported > 0 && (
                <Box px={4} py={3} bg="#d1fae5" borderRadius="lg" mb={3}>
                  <HStack gap={1.5}>
                    <FiCheckCircle fontSize="0.9rem" color="#065f46" />
                    <Text fontSize="sm" color="#065f46" fontWeight="600">
                      Successfully imported {result.imported} assignment{result.imported !== 1 ? "s" : ""}
                    </Text>
                  </HStack>
                </Box>
              )}

              {result.errors.length > 0 && (
                <Box px={4} py={3} bg="#fef2f2" borderRadius="lg">
                  <HStack gap={1.5} mb={2}>
                    <FiAlertCircle fontSize="0.9rem" color="#dc2626" />
                    <Text fontSize="sm" color="#dc2626" fontWeight="600">
                      {result.skipped} row{result.skipped !== 1 ? "s" : ""} skipped
                    </Text>
                  </HStack>
                  <VStack gap={1} alignItems="stretch" maxH="150px" overflow="auto">
                    {result.errors.slice(0, 10).map((err, i) => (
                      <Text key={i} fontSize="xs" color="#991b1b" fontFamily="monospace">
                        Row {err.row}: {err.error}
                      </Text>
                    ))}
                    {result.errors.length > 10 && (
                      <Text fontSize="xs" color="#991b1b" fontStyle="italic">
                        ... and {result.errors.length - 10} more errors
                      </Text>
                    )}
                  </VStack>
                </Box>
              )}
            </Box>
          )}

          {/* Actions */}
          <HStack gap={3} justify="flex-end" pt={2}>
            <Button onClick={onClose} variant="outline" colorPalette="gray">
              {result && result.imported > 0 ? "Close" : "Cancel"}
            </Button>
            <Button
              onClick={handleImport}
              colorPalette="blue"
              disabled={!csvText.trim() || isImporting}
              loading={isImporting}
            >
              <HStack gap={1.5}>
                <FiUpload fontSize="0.85rem" />
                <Text>Import Assignments</Text>
              </HStack>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  )
}
