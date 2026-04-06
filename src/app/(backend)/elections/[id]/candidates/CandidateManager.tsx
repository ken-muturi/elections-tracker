"use client"

import {
  Box, Text, VStack, HStack, Flex, Input, Dialog, Portal, Separator, Badge,
} from "@chakra-ui/react"
import { useRef, useState, useTransition } from "react"
import { createCandidate, createCandidatesBulk, deleteCandidate, updateCandidate } from "@/services/Elections"
import type { Candidate } from "@prisma/client"
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiUpload, FiDownload, FiFileText, FiAlertCircle, FiCheckCircle, FiInfo } from "react-icons/fi"

type Props = {
  positionId: string
  positionType: string
  aggregationLevel: string
  initialCandidates: Candidate[]
}

const ENTITY_LABEL: Record<string, string> = {
  WARD: "Ward ID",
  CONSTITUENCY: "Constituency ID",
  COUNTY: "County ID",
  NATIONAL: "",
}

export default function CandidateManager({
  positionId,
  positionType,
  aggregationLevel,
  initialCandidates,
}: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates)
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState("")

  // Add form state
  const [addName, setAddName] = useState("")
  const [addParty, setAddParty] = useState("")
  const [addEntityId, setAddEntityId] = useState("")

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editParty, setEditParty] = useState("")
  const [editEntityId, setEditEntityId] = useState("")

  const needsEntityId = aggregationLevel !== "NATIONAL"
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [csvStep, setCsvStep] = useState<"instructions" | "preview">("instructions")
  const [csvPreview, setCsvPreview] = useState<{ name: string; party: string; entityId: string }[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [importCount, setImportCount] = useState(0)

  const requiredColumns = needsEntityId
    ? [
        { header: "name", description: "Candidate full name", required: true },
        { header: "party", description: "Political party or Independent", required: false },
        { header: "entityId", description: ENTITY_LABEL[aggregationLevel] || "Geographic entity ID", required: true },
      ]
    : [
        { header: "name", description: "Candidate full name", required: true },
        { header: "party", description: "Political party or Independent", required: false },
      ]

  /* ── CSV helpers ─────────────────────────────────────── */
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue }
      current += ch
    }
    result.push(current.trim())
    return result
  }

  const handleCsvFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) { setCsvErrors(["Could not read the file."]); return }

      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) { setCsvErrors(["CSV must have a header row and at least one data row."]); return }

      const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z_]/g, ""))
      const nameIdx = header.findIndex((h) => ["name", "fullname", "full_name", "candidate"].includes(h))
      const partyIdx = header.findIndex((h) => ["party", "party_name"].includes(h))
      const entityIdx = header.findIndex((h) => ["entityid", "entity_id", "entity", "ward", "constituency", "county"].includes(h))

      const errors: string[] = []
      if (nameIdx === -1) errors.push("Missing required 'name' column in header row.")
      if (needsEntityId && entityIdx === -1) errors.push(`Missing required 'entityId' column (needed for ${aggregationLevel}-level positions).`)

      if (errors.length) { setCsvErrors(errors); return }

      const rows: { name: string; party: string; entityId: string }[] = []
      const rowErrors: string[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i])
        const name = cols[nameIdx]?.trim()
        if (!name) { rowErrors.push(`Row ${i + 1}: Empty name — skipped.`); continue }
        if (needsEntityId && entityIdx >= 0 && !cols[entityIdx]?.trim()) {
          rowErrors.push(`Row ${i + 1}: Missing entityId for "${name}" — skipped.`)
          continue
        }
        rows.push({
          name,
          party: partyIdx >= 0 ? cols[partyIdx]?.trim() || "" : "",
          entityId: entityIdx >= 0 ? cols[entityIdx]?.trim() || "" : "",
        })
      }

      if (rows.length === 0) { setCsvErrors(["No valid data rows found in CSV.", ...rowErrors]); return }

      setCsvErrors(rowErrors)
      setCsvPreview(rows)
      setCsvStep("preview")
    }
    reader.readAsText(file)
  }

  const handleCsvImport = () => {
    if (csvPreview.length === 0) return
    startTransition(async () => {
      try {
        const inputs = csvPreview.map((row, i) => ({
          positionId,
          name: row.name,
          party: row.party || undefined,
          entityId: needsEntityId && row.entityId ? row.entityId : undefined,
          sortOrder: candidates.length + i,
        }))
        const created = await createCandidatesBulk(inputs)
        setCandidates((prev) => [...prev, ...created])
        setImportCount(created.length)
        closeCsvModal()
        setTimeout(() => setImportCount(0), 5000)
      } catch (e: unknown) {
        setCsvErrors([e instanceof Error ? e.message : "Failed to import candidates."])
      }
    })
  }

  const openCsvModal = () => {
    setCsvModalOpen(true)
    setCsvStep("instructions")
    setCsvPreview([])
    setCsvErrors([])
  }

  const closeCsvModal = () => {
    setCsvModalOpen(false)
    setCsvStep("instructions")
    setCsvPreview([])
    setCsvErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const downloadTemplate = () => {
    const cols = requiredColumns.map((c) => c.header).join(",")
    const sample = needsEntityId
      ? "John Doe,Party A,ward-001\nJane Smith,Independent,ward-002"
      : "John Doe,Party A\nJane Smith,Independent"
    const csv = cols + "\n" + sample
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "candidates-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAdd = () => {
    if (!addName.trim()) { setError("Name is required."); return }
    if (needsEntityId && !addEntityId.trim()) { setError(`${ENTITY_LABEL[aggregationLevel]} is required.`); return }
    setError("")
    startTransition(async () => {
      try {
        const created = await createCandidate({
          positionId,
          name: addName.trim(),
          party: addParty.trim() || undefined,
          entityId: needsEntityId ? addEntityId.trim() : undefined,
          sortOrder: candidates.length,
        })
        setCandidates((prev) => [...prev, created])
        setAddName(""); setAddParty(""); setAddEntityId("")
        setShowAdd(false)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to add candidate.")
      }
    })
  }

  const startEdit = (c: Candidate) => {
    setEditId(c.id)
    setEditName(c.name)
    setEditParty(c.party ?? "")
    setEditEntityId(c.entityId ?? "")
  }

  const handleEdit = (id: string) => {
    if (!editName.trim()) { setError("Name is required."); return }
    setError("")
    startTransition(async () => {
      try {
        const updated = await updateCandidate(id, {
          name: editName.trim(),
          party: editParty.trim() || undefined,
          entityId: needsEntityId ? editEntityId.trim() || undefined : undefined,
        })
        setCandidates((prev) => prev.map((c) => (c.id === id ? updated : c)))
        setEditId(null)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to update candidate.")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteCandidate(id)
        setCandidates((prev) => prev.filter((c) => c.id !== id))
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to delete candidate.")
      }
    })
  }

  return (
    <Box>
      {/* Candidate list */}
      <VStack gap={0} alignItems="stretch">
        {candidates.map((candidate, idx) => (
          <Box key={candidate.id}
            px={6} py={3.5}
            borderBottomWidth="1px" borderBottomColor="gray.50"
            bg={editId === candidate.id ? "#fafff0" : "white"}>

            {editId === candidate.id ? (
              // Edit row
              <VStack gap={3} alignItems="stretch">
                <HStack gap={3} flexWrap="wrap">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Full name"
                    size="sm" bg="white" borderColor="gray.200" borderRadius="lg" flex={1}
                    _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                  />
                  <Input
                    value={editParty}
                    onChange={(e) => setEditParty(e.target.value)}
                    placeholder="Party / Independent"
                    size="sm" bg="white" borderColor="gray.200" borderRadius="lg" w="160px"
                    _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                  />
                  {needsEntityId && (
                    <Input
                      value={editEntityId}
                      onChange={(e) => setEditEntityId(e.target.value)}
                      placeholder={ENTITY_LABEL[aggregationLevel]}
                      size="sm" bg="white" borderColor="gray.200" borderRadius="lg" w="160px"
                      _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                    />
                  )}
                </HStack>
                <HStack gap={2}>
                  <Box
                    as="button" onClick={() => handleEdit(candidate.id)}
                    px={3} py={1.5} borderRadius="lg" bg="#C9D927" color="#0f172a"
                    fontSize="xs" fontWeight="700" cursor="pointer"
                    _hover={{ bg: "#b5c220" }} transition="all 0.15s"
                    opacity={isPending ? 0.6 : 1}
                  >
                    <HStack gap={1}><FiCheck /><Text>Save</Text></HStack>
                  </Box>
                  <Box
                    as="button" onClick={() => setEditId(null)}
                    px={3} py={1.5} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
                    fontSize="xs" fontWeight="600" color="gray.500" cursor="pointer"
                    _hover={{ bg: "gray.50" }} transition="all 0.15s"
                  >
                    <HStack gap={1}><FiX /><Text>Cancel</Text></HStack>
                  </Box>
                </HStack>
              </VStack>
            ) : (
              // Display row
              <HStack justify="space-between" gap={2}>
                <HStack gap={3} minW={0}>
                  <Flex
                    w={7} h={7} borderRadius="full" bg="gray.100"
                    align="center" justify="center" flexShrink={0}
                    fontSize="xs" fontWeight="700" color="gray.500"
                  >
                    {idx + 1}
                  </Flex>
                  <VStack alignItems="flex-start" gap={0} minW={0}>
                    <Text fontSize="sm" fontWeight="600" color="gray.900"
                      style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {candidate.name}
                    </Text>
                    <HStack gap={2}>
                      {candidate.party && (
                        <Text fontSize="xs" color="gray.400">{candidate.party}</Text>
                      )}
                      {candidate.entityId && (
                        <Text fontSize="xs" color="gray.300">· {candidate.entityId}</Text>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
                <HStack gap={1} flexShrink={0}>
                  <Box
                    as="button" onClick={() => startEdit(candidate)}
                    w={7} h={7} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
                    display="flex" alignItems="center" justifyContent="center"
                    color="gray.400" cursor="pointer"
                    _hover={{ borderColor: "gray.300", color: "gray.600" }} transition="all 0.15s"
                  >
                    <FiEdit2 fontSize="0.75rem" />
                  </Box>
                  <Box
                    as="button" onClick={() => handleDelete(candidate.id)}
                    w={7} h={7} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
                    display="flex" alignItems="center" justifyContent="center"
                    color="gray.400" cursor="pointer"
                    _hover={{ borderColor: "#fca5a5", color: "#ef4444" }} transition="all 0.15s"
                    opacity={isPending ? 0.5 : 1}
                  >
                    <FiTrash2 fontSize="0.75rem" />
                  </Box>
                </HStack>
              </HStack>
            )}
          </Box>
        ))}

        {candidates.length === 0 && !showAdd && (
          <Box px={6} py={5} textAlign="center">
            <Text fontSize="sm" color="gray.400">No candidates yet. Add the first one below.</Text>
          </Box>
        )}

        {/* Add form */}
        {showAdd && (
          <Box px={6} py={4} bg="#fafff0" borderTopWidth="1px" borderTopColor="gray.100">
            <VStack gap={3} alignItems="stretch">
              <HStack gap={3} flexWrap="wrap">
                <Input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Full name *"
                  size="sm" bg="white" borderColor="gray.200" borderRadius="lg" flex={1}
                  _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  autoFocus
                />
                <Input
                  value={addParty}
                  onChange={(e) => setAddParty(e.target.value)}
                  placeholder="Party / Independent"
                  size="sm" bg="white" borderColor="gray.200" borderRadius="lg" w="160px"
                  _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                {needsEntityId && (
                  <Input
                    value={addEntityId}
                    onChange={(e) => setAddEntityId(e.target.value)}
                    placeholder={`${ENTITY_LABEL[aggregationLevel]} *`}
                    size="sm" bg="white" borderColor="gray.200" borderRadius="lg" w="160px"
                    _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  />
                )}
              </HStack>
              <HStack gap={2}>
                <Box
                  as="button" onClick={handleAdd}
                  px={3} py={1.5} borderRadius="lg" bg="#C9D927" color="#0f172a"
                  fontSize="xs" fontWeight="700" cursor="pointer"
                  _hover={{ bg: "#b5c220" }} transition="all 0.15s"
                  opacity={isPending ? 0.6 : 1}
                >
                  <HStack gap={1}><FiCheck /><Text>Add Candidate</Text></HStack>
                </Box>
                <Box
                  as="button" onClick={() => { setShowAdd(false); setAddName(""); setAddParty(""); setAddEntityId(""); setError("") }}
                  px={3} py={1.5} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
                  fontSize="xs" fontWeight="600" color="gray.500" cursor="pointer"
                  _hover={{ bg: "gray.50" }} transition="all 0.15s"
                >
                  Cancel
                </Box>
              </HStack>
            </VStack>
          </Box>
        )}
      </VStack>

      {/* Success message */}
      {importCount > 0 && (
        <Box px={6} py={2} bg="#d1fae5">
          <HStack gap={1.5}>
            <FiCheckCircle fontSize="0.8rem" color="#065f46" />
            <Text fontSize="xs" fontWeight="600" color="#065f46">
              Successfully imported {importCount} candidate{importCount !== 1 ? "s" : ""}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Box px={6} py={2} bg="#fef2f2">
          <Text fontSize="xs" color="#dc2626">{error}</Text>
        </Box>
      )}

      {/* Footer buttons */}
      {!showAdd && (
        <Box px={6} py={3} borderTopWidth="1px" borderTopColor="gray.50">
          <HStack gap={4}>
            <Box
              as="button"
              onClick={() => { setShowAdd(true); setError("") }}
              display="inline-flex" alignItems="center" gap={1.5}
              fontSize="xs" fontWeight="600" color="gray.500" cursor="pointer"
              _hover={{ color: "gray.800" }} transition="color 0.15s"
            >
              <FiPlus />
              <Text>Add candidate</Text>
            </Box>

            <Box w="1px" h={4} bg="gray.200" />

            <Box
              as="button"
              onClick={openCsvModal}
              display="inline-flex" alignItems="center" gap={1.5}
              fontSize="xs" fontWeight="600" color="gray.500" cursor="pointer"
              _hover={{ color: "#0369a1" }} transition="color 0.15s"
            >
              <FiUpload />
              <Text>Import CSV</Text>
            </Box>
          </HStack>
        </Box>
      )}

      {/* ── CSV Import Modal ───────────────────────────────────────── */}
      <Dialog.Root open={csvModalOpen} onOpenChange={(e) => { if (!e.open) closeCsvModal() }} size="lg">
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl" overflow="hidden" maxH="90vh">
              {/* Header */}
              <Dialog.Header bg="#f8fafc" px={6} py={4} borderBottomWidth="1px" borderBottomColor="gray.100">
                <HStack justify="space-between" w="full">
                  <HStack gap={2}>
                    <Flex w={8} h={8} borderRadius="lg" bg="#dbeafe" align="center" justify="center">
                      <FiUpload fontSize="0.9rem" color="#1e40af" />
                    </Flex>
                    <VStack gap={0} alignItems="flex-start">
                      <Text fontWeight="700" fontSize="md" color="gray.900">Import Candidates</Text>
                      <Text fontSize="xs" color="gray.500">
                        {csvStep === "instructions" ? "Upload a CSV file" : `${csvPreview.length} candidates ready`}
                      </Text>
                    </VStack>
                  </HStack>
                  <Dialog.CloseTrigger asChild>
                    <Flex w={8} h={8} borderRadius="lg" bg="gray.100" align="center" justify="center"
                      cursor="pointer" _hover={{ bg: "gray.200" }} transition="all 0.15s">
                      <FiX fontSize="0.9rem" color="#6b7280" />
                    </Flex>
                  </Dialog.CloseTrigger>
                </HStack>
              </Dialog.Header>

              <Dialog.Body px={6} py={5} overflowY="auto">
                {csvStep === "instructions" ? (
                  <VStack gap={5} alignItems="stretch">
                    {/* Format requirements */}
                    <Box>
                      <HStack gap={1.5} mb={3}>
                        <FiInfo fontSize="0.85rem" color="#0369a1" />
                        <Text fontSize="sm" fontWeight="700" color="gray.800">File Requirements</Text>
                      </HStack>
                      <VStack gap={2} alignItems="stretch" pl={1}>
                        <HStack gap={2} align="flex-start">
                          <Box w="5px" h="5px" borderRadius="full" bg="#94a3b8" mt={1.5} flexShrink={0} />
                          <Text fontSize="sm" color="gray.600">File format: <strong>.csv</strong> (comma-separated values)</Text>
                        </HStack>
                        <HStack gap={2} align="flex-start">
                          <Box w="5px" h="5px" borderRadius="full" bg="#94a3b8" mt={1.5} flexShrink={0} />
                          <Text fontSize="sm" color="gray.600">Encoding: <strong>UTF-8</strong></Text>
                        </HStack>
                        <HStack gap={2} align="flex-start">
                          <Box w="5px" h="5px" borderRadius="full" bg="#94a3b8" mt={1.5} flexShrink={0} />
                          <Text fontSize="sm" color="gray.600">First row must be the <strong>header row</strong> with column names</Text>
                        </HStack>
                        <HStack gap={2} align="flex-start">
                          <Box w="5px" h="5px" borderRadius="full" bg="#94a3b8" mt={1.5} flexShrink={0} />
                          <Text fontSize="sm" color="gray.600">Values with commas should be <strong>wrapped in quotes</strong></Text>
                        </HStack>
                      </VStack>
                    </Box>

                    <Separator borderColor="gray.100" />

                    {/* Column definitions */}
                    <Box>
                      <HStack gap={1.5} mb={3}>
                        <FiFileText fontSize="0.85rem" color="#0369a1" />
                        <Text fontSize="sm" fontWeight="700" color="gray.800">Column Definitions</Text>
                      </HStack>
                      <Box borderRadius="xl" borderWidth="1px" borderColor="gray.200" overflow="hidden">
                        {/* Table header */}
                        <HStack px={4} py={2.5} bg="#f8fafc" borderBottomWidth="1px" borderBottomColor="gray.200" gap={3}>
                          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="120px">Column</Text>
                          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" flex={1}>Description</Text>
                          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="70px" textAlign="center">Required</Text>
                        </HStack>
                        {requiredColumns.map((col, i) => (
                          <HStack key={col.header} px={4} py={3} gap={3} bg="white"
                            borderBottomWidth={i < requiredColumns.length - 1 ? "1px" : "0"} borderBottomColor="gray.100">
                            <HStack w="120px" gap={1.5}>
                              <Box px={2} py={0.5} bg="#f1f5f9" borderRadius="md">
                                <Text fontSize="xs" fontWeight="700" color="#334155" fontFamily="mono">{col.header}</Text>
                              </Box>
                            </HStack>
                            <Text fontSize="sm" color="gray.600" flex={1}>{col.description}</Text>
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

                    {/* Accepted name alternatives */}
                    <Box bg="#f8fafc" borderRadius="xl" px={4} py={3}>
                      <Text fontSize="xs" color="gray.500" mb={1.5} fontWeight="600">Accepted header alternatives</Text>
                      <VStack gap={1} alignItems="stretch">
                        <Text fontSize="xs" color="gray.400">
                          <strong>name:</strong> name, fullname, full_name, candidate
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          <strong>party:</strong> party, party_name
                        </Text>
                        {needsEntityId && (
                          <Text fontSize="xs" color="gray.400">
                            <strong>entityId:</strong> entityId, entity_id, entity, ward, constituency, county
                          </Text>
                        )}
                      </VStack>
                    </Box>

                    <Separator borderColor="gray.100" />

                    {/* Sample preview */}
                    <Box>
                      <Text fontSize="sm" fontWeight="700" color="gray.800" mb={2}>Example CSV</Text>
                      <Box bg="#1e293b" borderRadius="xl" px={4} py={3} fontFamily="mono" fontSize="xs" color="#e2e8f0" lineHeight="1.8" overflowX="auto">
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
                          <Text fontSize="sm" fontWeight="700" color="#dc2626">Validation Errors</Text>
                        </HStack>
                        <VStack gap={1} alignItems="stretch">
                          {csvErrors.map((err, i) => (
                            <Text key={i} fontSize="xs" color="#dc2626">• {err}</Text>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                ) : (
                  /* ── Preview step ────────────────────────────── */
                  <VStack gap={4} alignItems="stretch">
                    <HStack gap={2}>
                      <FiCheckCircle fontSize="0.85rem" color="#16a34a" />
                      <Text fontSize="sm" fontWeight="700" color="gray.800">
                        {csvPreview.length} candidate{csvPreview.length !== 1 ? "s" : ""} parsed successfully
                      </Text>
                    </HStack>

                    {csvErrors.length > 0 && (
                      <Box bg="#fffbeb" borderRadius="xl" px={4} py={3}>
                        <HStack gap={1.5} mb={1}>
                          <FiAlertCircle fontSize="0.75rem" color="#d97706" />
                          <Text fontSize="xs" fontWeight="600" color="#d97706">{csvErrors.length} warning{csvErrors.length !== 1 ? "s" : ""}</Text>
                        </HStack>
                        <VStack gap={0.5} alignItems="stretch">
                          {csvErrors.slice(0, 5).map((err, i) => (
                            <Text key={i} fontSize="xs" color="#92400e">• {err}</Text>
                          ))}
                          {csvErrors.length > 5 && (
                            <Text fontSize="xs" color="#92400e" fontStyle="italic">…and {csvErrors.length - 5} more</Text>
                          )}
                        </VStack>
                      </Box>
                    )}

                    {/* Preview table */}
                    <Box borderRadius="xl" borderWidth="1px" borderColor="gray.200" overflow="hidden">
                      <HStack px={4} py={2.5} bg="#f8fafc" borderBottomWidth="1px" borderBottomColor="gray.200" gap={4}>
                        <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="30px">#</Text>
                        <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" flex={1}>Name</Text>
                        <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="140px">Party</Text>
                        {needsEntityId && (
                          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="120px">Entity ID</Text>
                        )}
                      </HStack>
                      <Box maxH="300px" overflowY="auto">
                        {csvPreview.map((row, i) => (
                          <HStack key={i} px={4} py={2.5} gap={4} bg="white"
                            borderBottomWidth={i < csvPreview.length - 1 ? "1px" : "0"} borderBottomColor="gray.50">
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
                )}
              </Dialog.Body>

              {/* Footer */}
              <Box px={6} py={4} borderTopWidth="1px" borderTopColor="gray.100" bg="#f8fafc">
                {csvStep === "instructions" ? (
                  <HStack justify="space-between">
                    <Box
                      as="button" onClick={downloadTemplate}
                      display="inline-flex" alignItems="center" gap={1.5}
                      px={3} py={2} borderRadius="lg" borderWidth="1px" borderColor="gray.200" bg="white"
                      fontSize="xs" fontWeight="600" color="gray.600" cursor="pointer"
                      _hover={{ borderColor: "gray.300", bg: "gray.50" }} transition="all 0.15s"
                    >
                      <FiDownload fontSize="0.8rem" />
                      <Text>Download Template</Text>
                    </Box>

                    <HStack gap={2}>
                      <Dialog.CloseTrigger asChild>
                        <Box
                          as="button"
                          px={4} py={2} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
                          fontSize="sm" fontWeight="600" color="gray.500" cursor="pointer"
                          _hover={{ bg: "gray.50" }} transition="all 0.15s"
                        >
                          Cancel
                        </Box>
                      </Dialog.CloseTrigger>
                      <Box
                        as="button" onClick={() => fileInputRef.current?.click()}
                        px={4} py={2} borderRadius="lg" bg="#0f172a" color="white"
                        fontSize="sm" fontWeight="700" cursor="pointer"
                        _hover={{ bg: "#1e293b" }} transition="all 0.15s"
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
                      as="button" onClick={() => { setCsvStep("instructions"); setCsvPreview([]); setCsvErrors([]) }}
                      px={3} py={2} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
                      fontSize="xs" fontWeight="600" color="gray.500" cursor="pointer"
                      _hover={{ bg: "gray.50" }} transition="all 0.15s"
                    >
                      <HStack gap={1}><FiX fontSize="0.7rem" /><Text>Choose different file</Text></HStack>
                    </Box>

                    <HStack gap={2}>
                      <Dialog.CloseTrigger asChild>
                        <Box
                          as="button"
                          px={4} py={2} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
                          fontSize="sm" fontWeight="600" color="gray.500" cursor="pointer"
                          _hover={{ bg: "gray.50" }} transition="all 0.15s"
                        >
                          Cancel
                        </Box>
                      </Dialog.CloseTrigger>
                      <Box
                        as="button" onClick={handleCsvImport}
                        px={4} py={2} borderRadius="lg" bg="#0f172a" color="white"
                        fontSize="sm" fontWeight="700" cursor="pointer"
                        _hover={{ bg: "#1e293b" }} transition="all 0.15s"
                        opacity={isPending ? 0.6 : 1}
                      >
                        <HStack gap={1.5}>
                          <FiCheck fontSize="0.85rem" />
                          <Text>Import {csvPreview.length} Candidate{csvPreview.length !== 1 ? "s" : ""}</Text>
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
    </Box>
  )
}
