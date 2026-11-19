"use client"

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Box, Text, VStack } from "@chakra-ui/react"
import { formatValue, isUniform, ordinal, rankRows, type ComparisonCounty, type MetricDef } from "./compare-metrics"

type Props = { metric: MetricDef; counties: ComparisonCounty[]; highlighted: string[]; year: string }

export function CompareRanking({ metric, counties, highlighted, year }: Props) {
  const rows = counties.map((c) => ({ code: c.code, value: metric.value(c) }))
  const nameOf = (code: string) => counties.find((c) => c.code === code)?.name ?? code
  const n = counties.length
  const uniform = isUniform(rows.map((r) => r.value), metric.unit)
  const { ranked, missing } = rankRows(rows)
  const data = ranked.map((r) => ({ ...r, label: `${r.rank}. ${nameOf(r.code)}`, highlighted: highlighted.includes(r.code) }))

  return (
    <VStack align="stretch" gap={3} bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={4}>
      <Text fontWeight="700">{metric.label}</Text>
      <Text fontSize="sm" color="gray.600">Ranked among the {n} counties with data for FY {year}</Text>
      {highlighted.length > 0 && !uniform && (
        <VStack align="start" gap={0}>
          {highlighted.map((code) => {
            const r = ranked.find((x) => x.code === code)
            return (
              <Text key={code} fontSize="sm" fontWeight="600" color="cyan.800">
                {nameOf(code)}: {r ? `${ordinal(r.rank)} of ${n}` : "no data"}
              </Text>
            )
          })}
        </VStack>
      )}
      {uniform ? (
        <Box bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="md" p={4}>
          <Text fontSize="sm" color="orange.900">
            All {ranked.length} counties have the same value ({formatValue(metric.unit, ranked[0]?.value ?? null)}). In our data this
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
                <LabelList dataKey="value" position="right" formatter={(v) => formatValue(metric.unit, Number(v))} style={{ fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
      {missing.length > 0 && (
        <Text fontSize="sm" color="gray.600">No data: {missing.map(nameOf).join(", ")}</Text>
      )}
    </VStack>
  )
}
