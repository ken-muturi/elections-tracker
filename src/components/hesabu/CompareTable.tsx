"use client"

import { Fragment } from "react"
import Link from "next/link"
import { Badge, Box, Text } from "@chakra-ui/react"
import {
  METRIC_GROUPS, MAX_COMPARE, bestOf, cellText, isUniform,
  type Column, type ComparisonCounty, type MetricDef,
} from "./compare-metrics"

type Props = { metrics: MetricDef[]; columns: Column[]; allCounties: ComparisonCounty[]; year: string }

const stickyCell = { position: "sticky" as const, left: 0, bg: "white", zIndex: 1 }

export function CompareTable({ metrics, columns, allCounties, year }: Props) {
  if (columns.length === 0) {
    return (
      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={6}>
        <Text color="gray.600">Pick up to {MAX_COMPARE} counties above to compare them side by side.</Text>
      </Box>
    )
  }
  const remaining = MAX_COMPARE - columns.length
  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" overflow="hidden">
      <Box overflowX="auto">
        <Box as="table" w="100%" fontSize="sm" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 200 + columns.length * 150 }}>
          <thead>
            <tr>
              <Box as="th" {...stickyCell} textAlign="left" p={3} borderBottom="1px solid" borderColor="gray.200" minW="200px" />
              {columns.map((c) => (
                <Box as="th" key={c.code} textAlign="right" p={3} borderBottom="1px solid" borderColor="gray.200" minW="150px">
                  <Link href={`/hesabu?county=${c.code}&year=${encodeURIComponent(year)}`} style={{ color: "#0e7490", fontWeight: 700 }}>
                    {c.name}
                  </Link>
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_GROUPS.map((group) => {
              const rows = metrics.filter((m) => m.group === group)
              if (rows.length === 0) return null
              return (
                <Fragment key={group}>
                  <tr>
                    <td colSpan={columns.length + 1} style={{ background: "#f9fafb", padding: "8px 12px", fontSize: 12, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563" }}>
                      {group}
                    </td>
                  </tr>
                  {rows.map((m) => {
                    const uniform = isUniform(allCounties.map((c) => m.value(c)), m.unit)
                    const best = bestOf(m, columns.map((c) => ({ code: c.code, value: c.county ? m.value(c.county) : null })), uniform)
                    return (
                      <tr key={m.key}>
                        <Box as="th" {...stickyCell} textAlign="left" fontWeight="500" px={3} py={2} borderBottom="1px solid" borderColor="gray.100">
                          {m.label}
                          {uniform && <Text fontSize="2xs" color="orange.700">same for all counties</Text>}
                          {m.note && <Text fontSize="2xs" color="gray.500">{m.note}</Text>}
                        </Box>
                        {columns.map((c) => {
                          const isBest = best.includes(c.code)
                          return (
                            <Box as="td" key={c.code} textAlign="right" px={3} py={2} borderBottom="1px solid" borderColor="gray.100"
                              fontWeight={isBest ? "700" : "400"} color={c.county ? "inherit" : "gray.500"} whiteSpace="nowrap">
                              {cellText(m, c.county, year)}
                              {isBest && <Badge ml={2} colorPalette="green" size="xs">Highest</Badge>}
                            </Box>
                          )
                        })}
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
        </Box>
      </Box>
      {columns.length < 2 && (
        <Text px={3} py={3} fontSize="sm" color="gray.600" borderTop="1px solid" borderColor="gray.100">
          Add up to {remaining} more {remaining === 1 ? "county" : "counties"} to compare.
        </Text>
      )}
    </Box>
  )
}
