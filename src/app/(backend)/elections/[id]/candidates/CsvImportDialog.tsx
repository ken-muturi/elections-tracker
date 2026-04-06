"use client"

import { useRef, useState, useTransition } from "react"
import {
  Box, Text, VStack, HStack, Flex, Badge, Separator, Dialog, Portal,
} from "@chakra-ui/react"
import {
  FiUpload, FiDownload, FiFileText, FiCheck, FiX,
  FiAlertCircle, FiCheckCircle, FiInfo,
} from "react-icons/fi"
import { createCandidatesBulk } from "@/services/Elections"
import type { Candidate } from "@prisma/client"
import { parseCsvFile, downloadTemplate, getRequiredColumns } from "./helpers"
import type { CsvRow, ColumnDef } from "./types"
import { ENTITY_LABEL } from "./constants"

type CsvImportDialogProps = {
  open: boolean
  onClose: () => void
  positionId: string
  aggregationLevel: string
  needsEntityId: boolean
  existingCount: number
  onImported: (candidates: Candidate[]) => void
}

export default function CsvImportDialog({
  open,
  onClose,
  positionId,
  aggregationLevel,
  needsEntityId,
  existingCount,
  onImported,
}: CsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [csvStep, setCsvStep] = useState<"instructions" | "preview">("instructions")
  const [csvPreview, setCsvPreview] = useState<CsvRow[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])

  const requiredColumns = getRequiredColumns(
    needsEntityId,
    aggregationLevel,
    ENTITY_LABEL[aggregationLevel] || "",
  )

  const reset = () => {
    setCsvStep("instructions")
    setCsvPreview([])
    setCsvErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleCsvFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) {
        setCsvErrors(["Could not read the file."])
        return
      }
      const { rows, errors } = parseCsvFile(text, needsEntityId, aggregationLevel)
      if (rows.length === 0 && errors.length > 0) {
        setCsvErrors(errors)
        return
      }
      setCsvErrors(errors)
      setCsvPreview(rows)
      setCsvStep("preview")
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (csvPreview.length === 0) return
    startTransition(async () => {
      try {
        const inputs = csvPreview.map((row, i) => ({
          positionId,
          name: row.name,
          party: row.party || undefined,
          entityId: needsEntityId && row.entityId ? row.entityId : undefined,
          sortOrder: existingCount + i,
        }))
        const created = await createCandidatesBulk(inputs)
        onImported(created)
        handleClose()
      } catch (e: unknown) {
        setCsvErrors([
          e instanceof Error ? e.message : "Failed to import candidates.",
        ])
      }
    })
  }

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={(e) => {
          if (!e.open) handleClose()
        }}
        size="lg"
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content
              borderRadius="2xl"
              overflow="hidden"
              maxH="90vh"
            >
              {/* Header */}
              <Dialog.Header
                bg="#f8fafc"
                px={6}
                py={4}
                borderBottomWidth="1px"
                borderBottomColor="gray.100"
              >
                <HStack justify="space-between" w="full">
                  <HStack gap={2}>
                    <Flex
                      w={8}
                      h={8}
                      borderRadius="lg"
                      bg="#dbeafe"
                      align="center"
                      justify="center"
                    >
                      <FiUpload fontSize="0.9rem" color="#1e40af" />
                    </Flex>
                    <VStack gap={0} alignItems="flex-start">
                      <Text fontWeight="700" fontSize="md" color="gray.900">
                        Import Candidates
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {csvStep === "instructions"
                          ? "Upload a CSV file"
                          : `${csvPreview.length} candidates ready`}
                      </Text>
                    </VStack>
                  </HStack>
                  <Dialog.CloseTrigger asChild>
                    <Flex
                      w={8}
                      h={8}
                      borderRadius="lg"
                      bg="gray.100"
                      align="center"
                      justify="center"
                      cursor="pointer"
                      _hover={{ bg: "gray.200" }}
                      transition="all 0.15s"
                    >
                      <FiX fontSize="0.9rem" color="#6b7280" />
                    </Flex>
                  </Dialog.CloseTrigger>
                </HStack>
              </Dialog.Header>

              <Dialog.Body px={6} py={5} overflowY="auto">
                {csvStep === "instructions" ? (
                  <InstructionsStep
                    requiredColumns={requiredColumns}
                    needsEntityId={needsEntityId}
                    csvErrors={csvErrors}
                  />
                ) : (
                  <PreviewStep
                    csvPreview={csvPreview}
                    csvErrors={csvErrors}
                    needsEntityId={needsEntityId}
                  />
                )}
              </Dialog.Body>

              {/* Footer */}
              <Box
                px={6}
                py={4}
                borderTopWidth="1px"
                borderTopColor="gray.100"
                bg="#f8fafc"
              >
                {csvStep === "instructions" ? (
                  <HStack justify="space-between">
                    <Box
                      as="button"
                      onClick={() => downloadTemplate(requiredColumns, needsEntityId)}
                      display="inline-flex"
                      alignItems="center"
                      gap={1.5}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor="gray.200"
                      bg="white"
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.600"
                      cursor="pointer"
                      _hover={{ borderColor: "gray.300", bg: "gray.50" }}
                      transition="all 0.15s"
                    >
                      <FiDownload fontSize="0.8rem" />
                      <Text>Download Template</Text>
                    </Box>

                    <HStack gap={2}>
                      <Dialog.CloseTrigger asChild>
                        <Box
                          as="button"
                          px={4}
                          py={2}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor="gray.200"
                          fontSize="sm"
                          fontWeight="600"
                          color="gray.500"
                          cursor="pointer"
                          _hover={{ bg: "gray.50" }}
                          transition="all 0.15s"
                        >
                          Cancel
                        </Box>
                      </Dialog.CloseTrigger>
                      <Box
                        as="button"
                        onClick={() => fileInputRef.current?.click()}
                        px={4}
                        py={2}
                        borderRadius="lg"
                        bg="#0f172a"
                        color="white"
                        fontSize="sm"
                        fontWeight="700"
                        cursor="pointer"
                        _hover={{ bg: "#1e293b" }}
                        transition="all 0.15s"
                      >
                        <HStack gap={1.5}>
                          <FiUpload fontSize="0.85rem" />
                          <Text>Select CSV File</Text>
                        </HStack>
                      </Box>
                    </HStack>
                  </HStack>
                ) : (
                  <HStack justify="space-between">
                    <Box
                      as="button"
                      onClick={() => {
                        setCsvStep("instructions")
                        setCsvPreview([])
                        setCsvErrors([])
                      }}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor="gray.200"
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.500"
                      cursor="pointer"
                      _hover={{ bg: "gray.50" }}
                      transition="all 0.15s"
                    >
                      <HStack gap={1}>
                        <FiX fontSize="0.7rem" />
                        <Text>Choose different file</Text>
                      </HStack>
                    </Box>

                    <HStack gap={2}>
                      <Dialog.CloseTrigger asChild>
                        <Box
                          as="button"
                          px={4}
                          py={2}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor="gray.200"
                          fontSize="sm"
                          fontWeight="600"
                          color="gray.500"
                          cursor="pointer"
                          _hover={{ bg: "gray.50" }}
                          transition="all 0.15s"
                        >
                          Cancel
                        </Box>
                      </Dialog.CloseTrigger>
                      <Box
                        as="button"
                        onClick={handleImport}
                        px={4}
                        py={2}
                        borderRadius="lg"
                        bg="#0f172a"
                        color="white"
                        fontSize="sm"
                        fontWeight="700"
                        cursor="pointer"
                        _hover={{ bg: "#1e293b" }}
                        transition="all 0.15s"
                        opacity={isPending ? 0.6 : 1}
                      >
                        <HStack gap={1.5}>
                          <FiCheck fontSize="0.85rem" />
                          <Text>
                            Import {csvPreview.length} Candidate
                            {csvPreview.length !== 1 ? "s" : ""}
                          </Text>
                        </HStack>
                      </Box>
                    </HStack>
                  </HStack>
                )}
              </Box>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleCsvFile(file)
          e.target.value = ""
        }}
      />
    </>
  )
}

/* ── Instructions sub-view ─────────────────────────────────── */

function InstructionsStep({
  requiredColumns,
  needsEntityId,
  csvErrors,
}: {
  requiredColumns: ColumnDef[]
  needsEntityId: boolean
  csvErrors: string[]
}) {
  return (
    <VStack gap={5} alignItems="stretch">
      {/* Format requirements */}
      <Box>
        <HStack gap={1.5} mb={3}>
          <FiInfo fontSize="0.85rem" color="#0369a1" />
          <Text fontSize="sm" fontWeight="700" color="gray.800">
            File Requirements
          </Text>
        </HStack>
        <VStack gap={2} alignItems="stretch" pl={1}>
          {[
            <>File format: <strong>.csv</strong> (comma-separated values)</>,
            <>Encoding: <strong>UTF-8</strong></>,
            <>First row must be the <strong>header row</strong> with column names</>,
            <>Values with commas should be <strong>wrapped in quotes</strong></>,
          ].map((text, i) => (
            <HStack key={i} gap={2} align="flex-start">
              <Box
                w="5px"
                h="5px"
                borderRadius="full"
                bg="#94a3b8"
                mt={1.5}
                flexShrink={0}
              />
              <Text fontSize="sm" color="gray.600">
                {text}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>

      <Separator borderColor="gray.100" />

      {/* Column definitions */}
      <Box>
        <HStack gap={1.5} mb={3}>
          <FiFileText fontSize="0.85rem" color="#0369a1" />
          <Text fontSize="sm" fontWeight="700" color="gray.800">
            Column Definitions
          </Text>
        </HStack>
        <Box
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          overflow="hidden"
        >
          <HStack
            px={4}
            py={2.5}
            bg="#f8fafc"
            borderBottomWidth="1px"
            borderBottomColor="gray.200"
            gap={3}
          >
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="120px">Column</Text>
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" flex={1}>Description</Text>
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="70px" textAlign="center">Required</Text>
          </HStack>
          {requiredColumns.map((col, i) => (
            <HStack
              key={col.header}
              px={4}
              py={3}
              gap={3}
              bg="white"
              borderBottomWidth={i < requiredColumns.length - 1 ? "1px" : "0"}
              borderBottomColor="gray.100"
            >
              <HStack w="120px" gap={1.5}>
                <Box px={2} py={0.5} bg="#f1f5f9" borderRadius="md">
                  <Text fontSize="xs" fontWeight="700" color="#334155" fontFamily="mono">
                    {col.header}
                  </Text>
                </Box>
              </HStack>
              <Text fontSize="sm" color="gray.600" flex={1}>
                {col.description}
              </Text>
              <Box w="70px" textAlign="center">
                {col.required ? (
                  <Badge px={2} py={0.5} borderRadius="full" bg="#fef2f2" color="#dc2626" fontSize="9px" fontWeight="700">Required</Badge>
                ) : (
                  <Badge px={2} py={0.5} borderRadius="full" bg="#f0fdf4" color="#16a34a" fontSize="9px" fontWeight="700">Optional</Badge>
                )}
              </Box>
            </HStack>
          ))}
        </Box>
      </Box>

      {/* Accepted header alternatives */}
      <Box bg="#f8fafc" borderRadius="xl" px={4} py={3}>
        <Text fontSize="xs" color="gray.500" mb={1.5} fontWeight="600">
          Accepted header alternatives
        </Text>
        <VStack gap={1} alignItems="stretch">
          <Text fontSize="xs" color="gray.400"><strong>name:</strong> name, fullname, full_name, candidate</Text>
          <Text fontSize="xs" color="gray.400"><strong>party:</strong> party, party_name</Text>
          {needsEntityId && (
            <Text fontSize="xs" color="gray.400"><strong>entityId:</strong> entityId, entity_id, entity, ward, constituency, county</Text>
          )}
        </VStack>
      </Box>

      <Separator borderColor="gray.100" />

      {/* Example CSV */}
      <Box>
        <Text fontSize="sm" fontWeight="700" color="gray.800" mb={2}>
          Example CSV
        </Text>
        <Box
          bg="#1e293b"
          borderRadius="xl"
          px={4}
          py={3}
          fontFamily="mono"
          fontSize="xs"
          color="#e2e8f0"
          lineHeight="1.8"
          overflowX="auto"
        >
          <Text>{requiredColumns.map((c) => c.header).join(",")}</Text>
          {needsEntityId ? (
            <>
              <Text>John Doe,Party A,ward-001</Text>
              <Text>Jane Smith,Independent,ward-002</Text>
            </>
          ) : (
            <>
              <Text>John Doe,Party A</Text>
              <Text>Jane Smith,Independent</Text>
            </>
          )}
        </Box>
      </Box>

      {/* Errors from file parse attempt */}
      {csvErrors.length > 0 && (
        <Box bg="#fef2f2" borderRadius="xl" px={4} py={3}>
          <HStack gap={1.5} mb={2}>
            <FiAlertCircle fontSize="0.8rem" color="#dc2626" />
            <Text fontSize="sm" fontWeight="700" color="#dc2626">
              Validation Errors
            </Text>
          </HStack>
          <VStack gap={1} alignItems="stretch">
            {csvErrors.map((err, i) => (
              <Text key={i} fontSize="xs" color="#dc2626">
                • {err}
              </Text>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  )
}

/* ── Preview sub-view ──────────────────────────────────────── */

function PreviewStep({
  csvPreview,
  csvErrors,
  needsEntityId,
}: {
  csvPreview: CsvRow[]
  csvErrors: string[]
  needsEntityId: boolean
}) {
  return (
    <VStack gap={4} alignItems="stretch">
      <HStack gap={2}>
        <FiCheckCircle fontSize="0.85rem" color="#16a34a" />
        <Text fontSize="sm" fontWeight="700" color="gray.800">
          {csvPreview.length} candidate{csvPreview.length !== 1 ? "s" : ""}{" "}
          parsed successfully
        </Text>
      </HStack>

      {csvErrors.length > 0 && (
        <Box bg="#fffbeb" borderRadius="xl" px={4} py={3}>
          <HStack gap={1.5} mb={1}>
            <FiAlertCircle fontSize="0.75rem" color="#d97706" />
            <Text fontSize="xs" fontWeight="600" color="#d97706">
              {csvErrors.length} warning{csvErrors.length !== 1 ? "s" : ""}
            </Text>
          </HStack>
          <VStack gap={0.5} alignItems="stretch">
            {csvErrors.slice(0, 5).map((err, i) => (
              <Text key={i} fontSize="xs" color="#92400e">
                • {err}
              </Text>
            ))}
            {csvErrors.length > 5 && (
              <Text fontSize="xs" color="#92400e" fontStyle="italic">
                …and {csvErrors.length - 5} more
              </Text>
            )}
          </VStack>
        </Box>
      )}

      {/* Preview table */}
      <Box
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
        overflow="hidden"
      >
        <HStack
          px={4}
          py={2.5}
          bg="#f8fafc"
          borderBottomWidth="1px"
          borderBottomColor="gray.200"
          gap={4}
        >
          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="30px">#</Text>
          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" flex={1}>Name</Text>
          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="140px">Party</Text>
          {needsEntityId && (
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="120px">Entity ID</Text>
          )}
        </HStack>
        <Box maxH="300px" overflowY="auto">
          {csvPreview.map((row, i) => (
            <HStack
              key={i}
              px={4}
              py={2.5}
              gap={4}
              bg="white"
              borderBottomWidth={i < csvPreview.length - 1 ? "1px" : "0"}
              borderBottomColor="gray.50"
            >
              <Text fontSize="xs" color="gray.400" fontWeight="600" w="30px">{i + 1}</Text>
              <Text fontSize="sm" fontWeight="600" color="gray.900" flex={1}>{row.name}</Text>
              <Text fontSize="sm" color="gray.500" w="140px">{row.party || "—"}</Text>
              {needsEntityId && (
                <Text fontSize="xs" color="gray.400" fontFamily="mono" w="120px">{row.entityId || "—"}</Text>
              )}
            </HStack>
          ))}
        </Box>
      </Box>
    </VStack>
  )
}
