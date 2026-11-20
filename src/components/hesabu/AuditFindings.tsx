"use client"

import { useEffect, useState } from "react"
import { Badge, Box, Button, HStack, Spinner, Text, VStack } from "@chakra-ui/react"
import { getAuditFindings, type AuditFindingRow, type AuditInfo } from "@/services/Hesabu"
import { AUDIT_NOTE, countByCategory, fmtAmountCited, shortFiscalYear } from "./audit-format"

type Props = { countyCode: string; fiscalYear: string; onReport: (f: AuditFindingRow) => void }
type Loaded = { audit: AuditInfo | null; findings: AuditFindingRow[] }

const KNOWN = new Set(["opinion_basis", "lawfulness", "governance", "emphasis_matter", "other_matter"])

export function AuditFindings({ countyCode, fiscalYear, onReport }: Props) {
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [category, setCategory] = useState("all")

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(false)
    getAuditFindings(countyCode, fiscalYear)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [countyCode, fiscalYear, attempt])

  const counts = data ? countByCategory(data.findings) : []
  const shown = (data?.findings ?? []).filter((f) =>
    category === "all" || (category === "other" ? !KNOWN.has(f.category) : f.category === category))

  return (
    <Box id="audit-findings" mt={8} pt={6} borderTop="1px solid" borderColor="gray.200">
      <Text fontWeight="bold" color="gray.700" fontSize="md">
        From the Auditor-General{data?.audit ? ` (FY ${shortFiscalYear(data.audit.fiscalYear)})` : ""}
      </Text>
      {data?.audit && (
        <Text fontSize="xs" color="gray.600" mb={2}>
          {data.audit.entity} · {data.audit.opinion} opinion · {data.audit.totalFindings} findings. These are audit queries, not citizen reports.
        </Text>
      )}
      <Text fontSize="xs" color="gray.500" mb={3}>{AUDIT_NOTE}</Text>

      {error ? (
        <HStack gap={3}>
          <Text fontSize="sm" color="red.600">Couldn&apos;t load the audit findings.</Text>
          <Button size="xs" variant="outline" onClick={() => setAttempt((n) => n + 1)}>Retry</Button>
        </HStack>
      ) : !data ? (
        <Spinner size="sm" />
      ) : !data.audit ? (
        <Text fontSize="sm" color="gray.600">No audit loaded for FY {fiscalYear}</Text>
      ) : (
        <VStack align="stretch" gap={3}>
          <HStack gap={2} flexWrap="wrap">
            {[{ key: "all", label: "All", count: data.findings.length }, ...counts].map((c) => {
              const active = category === c.key
              return (
                <Box key={c.key} as="button" px={3} py={1.5} borderRadius="full" fontSize="xs"
                  fontWeight={active ? "bold" : "normal"} bg={active ? "#0f172a" : "gray.100"}
                  color={active ? "white" : "gray.600"} cursor="pointer" onClick={() => setCategory(c.key)}>
                  {c.label} ({c.count})
                </Box>
              )
            })}
          </HStack>
          {shown.map((f) => (
            <Box key={f.id} bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={4}>
              <Text fontSize="sm" fontWeight="600">#{f.number} {f.title}</Text>
              <HStack gap={2} flexWrap="wrap" mt={1}>
                <Badge size="sm" colorPalette="gray">{f.categoryLabel}</Badge>
                {fmtAmountCited(f.amountCited) && <Text fontSize="xs" color="gray.600">{fmtAmountCited(f.amountCited)}</Text>}
                {f.linkedReports > 0 && (
                  <Text fontSize="xs" color="teal.700">{f.linkedReports} citizen {f.linkedReports === 1 ? "report" : "reports"}</Text>
                )}
              </HStack>
              {f.summary && <Text fontSize="xs" color="gray.600" mt={1} lineClamp={3}>{f.summary}</Text>}
              <Button size="xs" mt={2} variant="outline" onClick={() => onReport(f)}>Have you seen this?</Button>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  )
}
