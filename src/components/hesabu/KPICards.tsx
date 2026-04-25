"use client"

import { Box, Text, Grid } from "@chakra-ui/react"
import { CountyFull, ReportData } from "@/services/Hesabu"

type Props = {
  county: CountyFull
  reports: ReportData[]
}

const fmtB = (n: bigint) => {
  const v = Number(n)
  return v >= 1_000_000_000
    ? `KSh ${(v / 1_000_000_000).toFixed(2)}B`
    : `KSh ${(v / 1_000_000).toFixed(0)}M`
}

export const KPICards = ({ county, reports }: Props) => {
  const unresolvedCount = reports.filter(
    (r) => r.status === "UNRESOLVED"
  ).length

  const revenueCollectionPct =
    county.revenueTarget > 0n
      ? Math.round((Number(county.revenueCollected) / Number(county.revenueTarget)) * 100)
      : 0

  const cards = [
    {
      label: "TOTAL BUDGET",
      value: fmtB(county.totalBudget),
      sub: `Approved FY ${county.fiscalYear}`,
      accent: "#457B9D",
    },
    {
      label: "DEVELOPMENT BUDGET",
      value: fmtB(county.developmentExpenditure),
      sub: `${county.devAbsorptionRate?.toFixed(0) ?? "N/A"}% absorbed (FY 24/25)`,
      accent: "#E63946",
    },
    {
      label: "EQUITABLE SHARE",
      value: fmtB(county.equitableShare),
      sub: "From national government",
      accent: "#2A9D8F",
    },
    {
      label: "REVENUE COLLECTION",
      value: `${revenueCollectionPct}%`,
      sub: `${fmtB(county.revenueCollected)} of ${fmtB(county.revenueTarget)} target`,
      accent: "#F4A261",
    },
    {
      label: "CITIZEN REPORTS",
      value: String(reports.length),
      sub: `${unresolvedCount} unresolved`,
      accent: "#E9C46A",
    },
  ]

  return (
    <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(5, 1fr)" }} gap={3}>
      {cards.map((c) => (
        <Box
          key={c.label}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderTop="3px solid"
          borderTopColor={c.accent}
          borderRadius="lg"
          p={4}
          boxShadow="sm"
        >
          <Text
            fontSize="10px"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="widest"
            mb={2}
          >
            {c.label}
          </Text>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color={c.accent}
            lineHeight={1}
            mb={2}
          >
            {c.value}
          </Text>
          <Text fontSize="xs" color="gray.500" lineHeight={1.4}>
            {c.sub}
          </Text>
        </Box>
      ))}
    </Grid>
  )
}
