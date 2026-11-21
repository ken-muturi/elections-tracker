"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Box, Text, VStack } from "@chakra-ui/react"
import { buildMetrics, pickMetric, selectedColumns, type ComparisonCounty } from "./compare-metrics"
import type { CompareParams } from "./compare-params"
import { CompareControls } from "./CompareControls"
import { CompareTable } from "./CompareTable"
import { CompareRanking } from "./CompareRanking"

const DATA_NOTE =
  "County figures are compiled estimates from budget documents and the Division of Revenue Act, not audited actuals. " +
  "Figures marked 'same for all counties' cannot be compared yet. Project counts cover only counties whose public documents have been scraped."

type Props = {
  params: CompareParams
  years: string[]
  countyOptions: { code: string; name: string }[]
  counties: ComparisonCounty[]
}

export function CompareView({ params, years, countyOptions, counties }: Props) {
  const metrics = useMemo(() => buildMetrics(counties), [counties])
  const metric = pickMetric(metrics, params.metric)
  const effective: CompareParams = { ...params, metric: metric.key }
  const back = params.counties[0]
    ? `/hesabu?county=${params.counties[0]}&year=${encodeURIComponent(params.year)}`
    : "/hesabu"

  return (
    <Box bg="#f8fafc" minH="100vh" color="#0f172a" data-hesabu-root="">
      <Box bg="linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #155e75 100%)" px={{ base: 4, md: 8 }} py={6}>
        <Box maxW="1200px" mx="auto">
          <Link href={back} style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>← Back to county dashboard</Link>
          <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color="white" mt={2}>Compare counties</Text>
          <Text fontSize="xs" color="rgba(255,255,255,0.6)" textTransform="uppercase" letterSpacing="widest">
            {counties.length} counties with data for FY {params.year}
          </Text>
        </Box>
      </Box>
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={6}>
        <VStack align="stretch" gap={5}>
          <CompareControls params={effective} years={years} countyOptions={countyOptions}
            metricOptions={metrics.map((m) => ({ key: m.key, label: m.label }))} />
          {params.view === "side" ? (
            <CompareTable metrics={metrics} columns={selectedColumns(params.counties, counties, countyOptions)}
              allCounties={counties} year={params.year} />
          ) : (
            <CompareRanking metric={metric} counties={counties} highlighted={params.counties} countyOptions={countyOptions} year={params.year} />
          )}
          <Text fontSize="xs" color="gray.500">{DATA_NOTE}</Text>
        </VStack>
      </Box>
    </Box>
  )
}
