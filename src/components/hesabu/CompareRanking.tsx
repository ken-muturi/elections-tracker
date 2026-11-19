"use client"

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Box, Text, VStack } from "@chakra-ui/react"
import { formatValue, summarizeRanking, type ComparisonCounty, type MetricDef } from "./compare-metrics"

type Props = {
  metric: MetricDef
  counties: ComparisonCounty[]
  highlighted: string[]
  countyOptions: { code: string; name: string }[]
  year: string
}

export function CompareRanking({ metric, counties, highlighted, countyOptions, year }: Props) {
  const s = summarizeRanking(metric, counties, highlighted, countyOptions, year)
  const data = s.ranked.map((r) => ({ ...r, label: `${r.rank}. ${r.name}` }))

  return (
    <VStack align="stretch" gap={3} bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={4}>
      <Text fontWeight="700">{metric.label}</Text>
      <Text fontSize="sm" color="gray.600">Ranked among the {s.withData} counties with data for FY {year}</Text>
      {s.rankLines.length > 0 && !s.uniform && !s.projectsUnavailable && (
        <VStack align="start" gap={0}>
          {s.rankLines.map((l) => (
            <Text key={l.code} fontSize="sm" fontWeight="600" color="cyan.800">
              {l.name}: {l.text}
            </Text>
          ))}
        </VStack>
      )}
      {s.projectsUnavailable ? (
        <Box bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
          <Text fontSize="sm" color="gray.700">Project data is unavailable right now. Please try again later.</Text>
        </Box>
      ) : s.uniform ? (
        <Box bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="md" p={4}>
          <Text fontSize="sm" color="orange.900">
            All {s.withData} counties have the same value ({formatValue(metric.unit, s.ranked[0]?.value ?? null)}). In our data this
            figure is an estimate, so it can&apos;t be ranked yet.
          </Text>
        </Box>
      ) : (
        <Box w="100%" h={`${Math.max(160, data.length * 34 + 30)}px`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 8 }}>
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatValue(metric.unit, Number(v))} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {data.map((d) => <Cell key={d.code} fill={d.highlighted ? "#0e7490" : "#cbd5e1"} />)}
                <LabelList dataKey="value" position="right" fill="#334155"
                  formatter={(v) => formatValue(metric.unit, Number(v))} style={{ fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
      {!s.projectsUnavailable && s.notScraped.length > 0 && (
        <Text fontSize="sm" color="gray.600">Not yet scraped: {s.notScraped.join(", ")}</Text>
      )}
      {s.noData.length > 0 && <Text fontSize="sm" color="gray.600">No data: {s.noData.join(", ")}</Text>}
    </VStack>
  )
}
