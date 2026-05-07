"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Text, VStack, HStack, Box, Flex, Portal, Dialog, Spinner,
} from "@chakra-ui/react"
import { FiUpload, FiX, FiFile, FiAlertCircle, FiDownload, FiCheck } from "react-icons/fi"
import { toaster } from "@/components/ui/toaster"
import { importPollingStationsFromCsv } from "@/services/Hierarchy"

interface Props {
  targetElectionId: string
  targetElectionTitle: string
}

const EXPECTED_COLUMNS = ["ward_name", "ward_code", "constituency_name", "station_name", "station_code", "stream_name", "stream_code"]
const REQUIRED_COLUMNS = ["ward_name", "ward_code", "constituency_name", "station_name", "station_code"]

type ParsedRow = {
  ward_name: string; ward_code: string; constituency_name: string
  station_name: string; station_code: string
  stream_name?: string; stream_code?: string
}

type ParseError = { row: number; message: string }

/** Splits a single CSV line respecting double-quoted fields that may contain commas */
function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ } // escaped quote
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim()); cur = ""
    } else {
      cur += ch
    }
  }
  result.push(cur.trim())
  return result
}

function parseCsv(text: string): { rows: ParsedRow[]; errors: ParseError[] } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { rows: [], errors: [{ row: 0, message: "File is empty or has no data rows." }] }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"))
  const missing = REQUIRED_COLUMNS.filter((r) => !headers.includes(r))
  if (missing.length) {
    return { rows: [], errors: [{ row: 0, message: `Missing required columns: ${missing.join(", ")}` }] }
  }

  const rows: ParsedRow[] = []
  const errors: ParseError[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cells = splitCsvLine(line)
    const get = (col: string) => cells[headers.indexOf(col)]?.trim() ?? ""

    const ward_name = get("ward_name")
    const ward_code = get("ward_code")
    const constituency_name = get("constituency_name")
    const station_name = get("station_name")
    const station_code = get("station_code")

    const missing_vals = ["ward_name", "ward_code", "constituency_name", "station_name", "station_code"].filter(
      (col) => !get(col)
    )
    if (missing_vals.length) {
      errors.push({ row: i + 1, message: `Row ${i + 1}: missing required fields: ${missing_vals.join(", ")}.` })
      continue
    }
    rows.push({
      ward_name, ward_code, constituency_name, station_name, station_code,
      stream_name: get("stream_name") || undefined,
      stream_code: get("stream_code") || undefined,
    })
  }

  return { rows, errors }
}

export default function ImportFromCsvDialog({ targetElectionId, targetElectionTitle }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null)
  const [parseErrors, setParseErrors] = useState<ParseError[]>([])
  const [dragOver, setDragOver] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setParsed(null)
    setParseErrors([])
  }

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".csv")) {
      toaster.error({ title: "Please upload a .csv file" })
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { rows, errors } = parseCsv(text)
      setParsed(rows)
      setParseErrors(errors)
    }
    reader.readAsText(f)
  }

  const handleImport = () => {
    if (!parsed || parsed.length === 0) return
    startTransition(async () => {
      try {
        const result = await importPollingStationsFromCsv(targetElectionId, parsed)
        toaster.success({
          title: "CSV Import complete",
          description: `${result.wardsCreated} wards, ${result.stationsCreated} stations, ${result.streamsCreated} streams added`,
        })
        setOpen(false)
        reset()
        router.refresh()
      } catch (e) {
        toaster.error({ title: "Import failed", description: e instanceof Error ? e.message : "Unknown error" })
      }
    })
  }

  // Unique ward/station/stream counts from parsed rows
  const uniqueWards = parsed ? new Set(parsed.map((r) => r.ward_code)).size : 0
  const uniqueStations = parsed ? new Set(parsed.map((r) => r.station_code)).size : 0
  const streamRows = parsed ? parsed.filter((r) => r.stream_code) : []

  const canImport = !!parsed && parsed.length > 0 && parseErrors.length === 0

  return (
    <>
      {/* Trigger */}
      <HStack
        as="button" gap={2} px={4} py={2} bg="white" color="gray.700"
        borderRadius="lg" borderWidth="1px" borderColor="gray.200"
        fontSize="sm" fontWeight="600" cursor="pointer"
        _hover={{ bg: "gray.50", borderColor: "gray.300" }} transition="all 0.15s"
        onClick={() => { reset(); setOpen(true) }}
      >
        <FiUpload fontSize="0.9rem" />
        <Text>Import from CSV</Text>
      </HStack>

      <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)} size="lg">
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl" overflow="hidden" maxW="600px">
              {/* Header */}
              <Dialog.Header bg="#f8fafc" px={6} py={4} borderBottomWidth="1px" borderBottomColor="gray.100">
                <HStack justify="space-between" w="full">
                  <VStack alignItems="flex-start" gap={0}>
                    <Text fontWeight="700" fontSize="lg" color="gray.900">Import from CSV</Text>
                    <Text fontSize="sm" color="gray.500">into <strong>{targetElectionTitle}</strong></Text>
                  </VStack>
                  <Dialog.CloseTrigger asChild>
                    <Flex w={8} h={8} borderRadius="full" bg="gray.100" align="center" justify="center" cursor="pointer" _hover={{ bg: "gray.200" }}>
                      <FiX fontSize="1rem" color="#6b7280" />
                    </Flex>
                  </Dialog.CloseTrigger>
                </HStack>
              </Dialog.Header>

              <Dialog.Body px={6} py={5}>
                <VStack gap={4} alignItems="stretch">
                  {/* Format guide */}
                  <Box bg="#f8fafc" borderWidth="1px" borderColor="gray.100" borderRadius="xl" p={4}>
                    <HStack gap={2} mb={2}>
                      <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="wide">
                        Expected CSV columns
                      </Text>
                    </HStack>
                    <HStack gap={1.5} flexWrap="wrap">
                      {EXPECTED_COLUMNS.map((col) => (
                        <Box
                          key={col}
                          px={2} py={0.5} bg="white" borderWidth="1px" borderColor="gray.200"
                          borderRadius="md" fontSize="11px" fontWeight="600" color="gray.600"
                          fontFamily="mono"
                        >
                          {col}
                          {!["stream_name", "stream_code"].includes(col) && (
                            <Text as="span" color="red.400" ml={0.5}>*</Text>
                          )}
                        </Box>
                      ))}
                    </HStack>
                    <Text fontSize="xs" color="gray.400" mt={2}>
                      <Text as="span" color="red.400">*</Text> required · stream columns are optional
                    </Text>
                  </Box>

                  {/* Drop zone */}
                  {!file ? (
                    <Box
                      borderWidth="2px" borderStyle="dashed"
                      borderColor={dragOver ? "#0f172a" : "gray.200"}
                      borderRadius="xl" p={8}
                      bg={dragOver ? "#f8fafc" : "white"}
                      textAlign="center" cursor="pointer"
                      transition="all 0.15s"
                      onClick={() => inputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDragOver(false)
                        const f = e.dataTransfer.files[0]
                        if (f) handleFile(f)
                      }}
                    >
                      <Flex
                        w={12} h={12} borderRadius="xl" bg="gray.100"
                        align="center" justify="center" mx="auto" mb={3}
                      >
                        <FiUpload fontSize="1.4rem" color="#9ca3af" />
                      </Flex>
                      <Text fontSize="sm" fontWeight="600" color="gray.700">
                        Drop your CSV here or click to browse
                      </Text>
                      <Text fontSize="xs" color="gray.400" mt={1}>.csv files only</Text>
                      <input
                        ref={inputRef} type="file" accept=".csv"
                        style={{ display: "none" }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                      />
                    </Box>
                  ) : (
                    /* File loaded — show summary */
                    <VStack gap={3} alignItems="stretch">
                      {/* File pill */}
                      <HStack
                        px={4} py={3} bg="white" borderWidth="1px" borderColor="gray.200"
                        borderRadius="xl" gap={3}
                      >
                        <Flex w={9} h={9} borderRadius="lg" bg="gray.100" align="center" justify="center" flexShrink={0}>
                          <FiFile fontSize="1rem" color="#6b7280" />
                        </Flex>
                        <VStack alignItems="flex-start" gap={0} flex={1}>
                          <Text fontSize="sm" fontWeight="600" color="gray.800">{file.name}</Text>
                          <Text fontSize="xs" color="gray.400">{(file.size / 1024).toFixed(1)} KB</Text>
                        </VStack>
                        <Flex
                          w={7} h={7} borderRadius="full" bg="gray.100"
                          align="center" justify="center" cursor="pointer"
                          _hover={{ bg: "gray.200" }} flexShrink={0}
                          onClick={reset}
                        >
                          <FiX fontSize="0.8rem" color="#6b7280" />
                        </Flex>
                      </HStack>

                      {/* Parse errors */}
                      {parseErrors.length > 0 && (
                        <Box bg="#fef2f2" borderWidth="1px" borderColor="#fca5a5" borderRadius="xl" p={4}>
                          <HStack gap={2} mb={2}>
                            <FiAlertCircle color="#ef4444" fontSize="0.9rem" />
                            <Text fontSize="sm" fontWeight="700" color="#dc2626">
                              {parseErrors.length} error{parseErrors.length !== 1 ? "s" : ""} found
                            </Text>
                          </HStack>
                          <VStack gap={1} alignItems="stretch" maxH="120px" overflowY="auto">
                            {parseErrors.map((err, i) => (
                              <Text key={i} fontSize="xs" color="#dc2626">{err.message}</Text>
                            ))}
                          </VStack>
                        </Box>
                      )}

                      {/* Preview stats (only if no blocking errors) */}
                      {parsed && parsed.length > 0 && parseErrors.length === 0 && (
                        <Box bg="#f0fdf4" borderWidth="1px" borderColor="#86efac" borderRadius="xl" p={4}>
                          <HStack justify="space-between" mb={3}>
                            <Text fontSize="sm" fontWeight="700" color="#166534">Ready to import</Text>
                            <HStack gap={1}>
                              <FiCheck fontSize="0.8rem" color="#16a34a" />
                              <Text fontSize="xs" color="#4ade80">{parsed.length} rows parsed</Text>
                            </HStack>
                          </HStack>
                          <HStack gap={4} flexWrap="wrap">
                            {[
                              { label: "Wards", value: uniqueWards },
                              { label: "Polling Stations", value: uniqueStations },
                              { label: "Stream rows", value: streamRows.length },
                            ].map((s) => (
                              <Box key={s.label} flex={1} minW="70px">
                                <Text fontSize="2xl" fontWeight="800" color="#166534" lineHeight="1.1">{s.value}</Text>
                                <Text fontSize="xs" color="#4ade80" fontWeight="600">{s.label}</Text>
                              </Box>
                            ))}
                          </HStack>
                        </Box>
                      )}
                    </VStack>
                  )}
                </VStack>
              </Dialog.Body>

              <Dialog.Footer px={6} pb={6} pt={0}>
                <HStack justify="space-between" w="full">
                  <Dialog.CloseTrigger asChild>
                    <HStack
                      gap={1.5} px={4} py={2} borderRadius="lg" cursor="pointer"
                      bg="white" borderWidth="1px" borderColor="gray.200"
                      _hover={{ bg: "gray.50" }} transition="all 0.15s"
                    >
                      <Text fontSize="sm" fontWeight="600" color="gray.600">Cancel</Text>
                    </HStack>
                  </Dialog.CloseTrigger>

                  <HStack gap={2}>
                    {/* Download template */}
                    <a
                      href={`data:text/csv;charset=utf-8,ward_name,ward_code,constituency_name,station_name,station_code,stream_name,stream_code%0AExample Ward,W001,Example Constituency,Example Station,PS001,Stream A,S001`}
                      download="polling-stations-template.csv"
                      style={{ textDecoration: "none" }}
                    >
                      <HStack
                        gap={1.5} px={4} py={2} borderRadius="lg" cursor="pointer"
                        bg="white" borderWidth="1px" borderColor="gray.200"
                        _hover={{ bg: "gray.50" }} transition="all 0.15s"
                      >
                        <FiDownload fontSize="0.85rem" color="#6b7280" />
                        <Text fontSize="sm" fontWeight="600" color="gray.600">Template</Text>
                      </HStack>
                    </a>

                    {/* Import */}
                    <HStack
                      gap={1.5} px={4} py={2} borderRadius="lg" cursor="pointer"
                      bg={canImport ? "#16a34a" : "gray.200"}
                      color={canImport ? "white" : "gray.400"}
                      _hover={canImport ? { bg: "#15803d" } : {}}
                      transition="all 0.15s"
                      pointerEvents={canImport && !isPending ? "auto" : "none"}
                      opacity={isPending ? 0.6 : 1}
                      onClick={handleImport}
                    >
                      {isPending ? (
                        <><Spinner size="xs" /><Text fontSize="sm" fontWeight="600">Importing…</Text></>
                      ) : (
                        <><FiUpload fontSize="0.9rem" /><Text fontSize="sm" fontWeight="600">Import</Text></>
                      )}
                    </HStack>
                  </HStack>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
