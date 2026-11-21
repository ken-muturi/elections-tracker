"use client"

import { useState } from "react"
import { Box, Text, HStack, Grid, Stack } from "@chakra-ui/react"
import { AuditSummary, CountyFull, TrendPoint } from "@/services/Hesabu"
import { AuditSection } from "./AuditSection"
import { absorptionAlertText } from "./budget-text"
import { SectorCard } from "./SectorCard"
import { TrendChart } from "./TrendChart"
import { ProjectDrawer } from "./ProjectDrawer"
import { ProjectCardSummary } from "./project-format"

type Props = {
  county: CountyFull
  trendData: TrendPoint[]
  currentYear: string
  countyCode: string
  sectorSummary: ProjectCardSummary[]
  auditSummary: AuditSummary
  onSeeAllFindings: () => void
}

const fmtB = (n: bigint) => {
  const v = Number(n)
  return `KSh ${(v / 1_000_000_000).toFixed(2)}B`
}

const pct = (a: bigint, b: bigint) =>
  b > 0n ? Math.round((Number(a) / Number(b)) * 100) : 0

export const BudgetOverview = ({ county, trendData, currentYear, countyCode, sectorSummary, auditSummary, onSeeAllFindings }: Props) => {
  const [openSector, setOpenSector] = useState<string | null>(null)
  const bySector = new Map(sectorSummary.map((s) => [s.key, s]))
  const recurrentPct = pct(county.recurrentExpenditure, county.totalBudget)
  const devPct = pct(county.developmentExpenditure, county.totalBudget)

  return (
    <Box>
      {/* 13-year budget trend */}
      {trendData.length > 1 && (
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={5}
          mb={4}
          boxShadow="sm"
        >
          <Stack direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={{ base: 2, md: 4 }} mb={4}>
            <Box>
              <Text fontWeight="bold" color="gray.800" fontSize="md">
                Budget Trend Since Devolution (2013 &rarr; 2026)
              </Text>
              <Text fontSize="xs" color="gray.400" mt={0.5}>
                KES values in billions &bull; dashed line = selected year &bull; amber = dev absorption rate
              </Text>
            </Box>
            <HStack gap={4} flexWrap="wrap">
              <HStack gap={1.5}>
                <Box w="10px" h="10px" bg="#1e3a5f" borderRadius="2px" />
                <Text fontSize="11px" color="gray.500">Recurrent</Text>
              </HStack>
              <HStack gap={1.5}>
                <Box w="10px" h="10px" bg="#0d9488" borderRadius="2px" />
                <Text fontSize="11px" color="gray.500">Development</Text>
              </HStack>
              <HStack gap={1.5}>
                <Box w="10px" h="10px" bg="#f59e0b" borderRadius="full" />
                <Text fontSize="11px" color="gray.500">Absorption %</Text>
              </HStack>
            </HStack>
          </Stack>
          <TrendChart data={trendData} currentYear={currentYear} />
        </Box>
      )}
      {/* Recurrent / Development split */}
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mb={4}>
        {/* Recurrent */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={5}
          boxShadow="sm"
        >
          <Text
            fontSize={{ base: "11px", md: "10px" }}
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="widest"
            mb={2}
          >
            Recurrent Expenditure
          </Text>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="#1e3a5f"
            mb={1}
          >
            {fmtB(county.recurrentExpenditure)}
          </Text>
          <Text fontSize="xs" color="gray.400" mb={3}>
            {recurrentPct}% of total budget
          </Text>
          <Box bg="gray.100" borderRadius="full" h="6px" mb={2}>
            <Box
              h="full"
              bg="#1e3a5f"
              borderRadius="full"
              style={{ width: `${recurrentPct}%` }}
            />
          </Box>
          <Text fontSize="xs" color="gray.400">
            Salaries, operations, maintenance
          </Text>
        </Box>

        {/* Development */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={5}
          boxShadow="sm"
        >
          <Text
            fontSize={{ base: "11px", md: "10px" }}
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="widest"
            mb={2}
          >
            Development Expenditure
          </Text>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="#0d9488"
            mb={1}
          >
            {fmtB(county.developmentExpenditure)}
          </Text>
          <Text fontSize="xs" color="gray.400" mb={3}>
            {devPct}% of total budget
          </Text>
          <Box bg="gray.100" borderRadius="full" h="6px" mb={2}>
            <Box
              h="full"
              bg="#0d9488"
              borderRadius="full"
              style={{ width: `${devPct}%` }}
            />
          </Box>
          <Text fontSize="xs" color="gray.400">
            New projects, capital investments
          </Text>
        </Box>
      </Grid>

      <AuditSection summary={auditSummary} fiscalYear={currentYear} onSeeAll={onSeeAllFindings} />

      {/* Absorption alert */}
      {(county.devAbsorptionRate ?? 100) < 70 && (
        <Box
          bg="orange.50"
          border="1px solid"
          borderColor="orange.200"
          borderRadius="lg"
          p={4}
          mb={4}
        >
          <HStack gap={2} mb={1}>
            <Text>⚠️</Text>
            <Text fontSize="sm" fontWeight="bold" color="orange.700">
              Development Budget Absorption Alert
            </Text>
          </HStack>
          <Text fontSize="sm" color="orange.800">
            {absorptionAlertText(county.fiscalYear, county.devAbsorptionRate ?? null, fmtB(county.developmentExpenditure))}
          </Text>
        </Box>
      )}

      {/* Sector breakdown */}
      <Text fontWeight="bold" color="gray.700" fontSize="md" mb={3}>
        Sector Budget Breakdown
      </Text>
      {county.sectors.map((s) => (
        <SectorCard
          key={s.id}
          sector={s}
          totalBudget={county.totalBudget}
          projects={bySector.get(s.name)}
          onOpenProjects={() => setOpenSector(s.name)}
        />
      ))}

      <ProjectDrawer
        open={openSector !== null}
        onClose={() => setOpenSector(null)}
        countyCode={countyCode}
        fiscalYear={currentYear}
        filter={{ sector: openSector ?? "" }}
        label={openSector ?? ""}
      />
    </Box>
  )
}
