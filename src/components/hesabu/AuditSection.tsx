"use client"

import { Badge, Box, Button, Grid, HStack, Link, Text, VStack } from "@chakra-ui/react"
import type { AuditSummary } from "@/services/Hesabu"
import { AUDIT_NOTE, opinionPalette, shortFiscalYear } from "./audit-format"

type Props = { summary: AuditSummary; fiscalYear: string; onSeeAll: () => void }

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Box bg="gray.50" borderRadius="md" p={3}>
      <Text fontSize="2xl" fontWeight="800" color="gray.800">{value}</Text>
      <Text fontSize="xs" color="gray.600">{label}</Text>
    </Box>
  )
}

export function AuditSection({ summary, fiscalYear, onSeeAll }: Props) {
  const { audit, counts, stalledProjects, unavailable } = summary
  const countOf = (key: string) => counts.find((c) => c.key === key)?.count ?? 0
  const stalledStat = <Stat value={stalledProjects === null ? "—" : String(stalledProjects)}
    label={stalledProjects === null ? "stalled projects: not yet scraped" : "documented stalled projects"} />

  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={5} mb={4}>
      <Text fontWeight="bold" color="gray.700" fontSize="md" mb={2}>Audit &amp; accountability</Text>
      {unavailable ? (
        <Text fontSize="sm" color="gray.600">Audit data unavailable right now.</Text>
      ) : !audit ? (
        <VStack align="stretch" gap={3}>
          <Text fontSize="sm" color="gray.600">No audit loaded for FY {fiscalYear}</Text>
          <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={3}>{stalledStat}</Grid>
        </VStack>
      ) : (
        <VStack align="stretch" gap={4}>
          <HStack gap={2} flexWrap="wrap" fontSize="sm" color="gray.700">
            <Text>Latest audit: FY {shortFiscalYear(audit.fiscalYear)} · {audit.entity}</Text>
            <Badge colorPalette={opinionPalette(audit.opinion)}>{audit.opinion} opinion</Badge>
            <Link href={audit.sourceUrl} target="_blank" rel="noopener noreferrer" color="teal.700" fontSize="xs"
              display="inline-flex" alignItems="center" minH={{ base: "40px", md: "auto" }}>Source</Link>
          </HStack>
          <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={3}>
            <Stat value={String(audit.totalFindings)} label="findings raised by the Auditor-General" />
            <Stat value={String(countOf("opinion_basis"))} label="reasons for the opinion" />
            <Stat value={String(countOf("lawfulness"))} label="on lawful use of public money" />
            {stalledStat}
          </Grid>
          <Button size="sm" variant="outline" alignSelf="flex-start" minH={{ base: "40px", md: "auto" }} onClick={onSeeAll}>
            See all {audit.totalFindings} findings →
          </Button>
        </VStack>
      )}
      <Text fontSize="xs" color="gray.500" mt={4}>{AUDIT_NOTE}</Text>
    </Box>
  )
}
