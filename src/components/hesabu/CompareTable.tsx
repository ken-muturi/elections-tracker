"use client"

import { Fragment } from "react"
import Link from "next/link"
import { Badge, Box, Grid, Text } from "@chakra-ui/react"
import { MAX_COMPARE, compareRows, type Column, type ComparisonCounty, type MetricDef } from "./compare-metrics"

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
  const groups = compareRows(metrics, columns, allCounties, year)
  const cols = `repeat(${columns.length}, minmax(0, 1fr))`
  return (
    <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" overflow={{ base: "visible", md: "hidden" }}>
      <Box display={{ base: "block", md: "none" }}>
        <Grid templateColumns={cols} gap={2} px={3} py={1} position="sticky" top={0} zIndex={1} bg="white"
          borderTopRadius="lg" borderBottom="1px solid" borderColor="gray.200">
          {columns.map((c) => (
            <Box key={c.code} data-compare-col="" textAlign="center" minW={0}>
              <Link href={`/hesabu?county=${c.code}&year=${encodeURIComponent(year)}`}
                style={{ color: "#0e7490", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center",
                  justifyContent: "center", minHeight: 40, overflowWrap: "anywhere" }}>
                {c.name}
              </Link>
            </Box>
          ))}
        </Grid>
        {groups.map(({ group, rows }) => (
          <Box key={group}>
            <Text bg="gray.50" px={3} py={2} fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em" color="gray.600">
              {group}
            </Text>
            {rows.map((row) => (
              <Box key={row.key} px={3} py={2} borderBottom="1px solid" borderColor="gray.100">
                <Text fontSize="sm" fontWeight="500">{row.label}</Text>
                {row.uniform && <Text fontSize="11px" color="orange.700">same for all counties</Text>}
                {row.note && <Text fontSize="11px" color="gray.500">{row.note}</Text>}
                <Grid templateColumns={cols} gap={2} mt={1}>
                  {row.cells.map((cell) => (
                    <Box key={cell.code} data-compare-cell="" textAlign="center" minW={0} overflowWrap="anywhere" fontSize="sm"
                      fontWeight={cell.isBest ? "700" : "400"} color={cell.missing ? "gray.500" : "inherit"}>
                      {cell.text}
                      {cell.isBest && <Text fontSize="11px" fontWeight="600" color="green.700">Highest</Text>}
                    </Box>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
      <Box display={{ base: "none", md: "block" }}>
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
              {groups.map(({ group, rows }) => (
                <Fragment key={group}>
                  <tr>
                    <td colSpan={columns.length + 1} style={{ background: "#f9fafb", padding: "8px 12px", fontSize: 12, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563" }}>
                      {group}
                    </td>
                  </tr>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <Box as="th" {...stickyCell} textAlign="left" fontWeight="500" px={3} py={2} borderBottom="1px solid" borderColor="gray.100">
                        {row.label}
                        {row.uniform && <Text fontSize="2xs" color="orange.700">same for all counties</Text>}
                        {row.note && <Text fontSize="2xs" color="gray.500">{row.note}</Text>}
                      </Box>
                      {row.cells.map((cell) => (
                        <Box as="td" key={cell.code} textAlign="right" px={3} py={2} borderBottom="1px solid" borderColor="gray.100"
                          fontWeight={cell.isBest ? "700" : "400"} color={cell.missing ? "gray.500" : "inherit"} whiteSpace="nowrap">
                          {cell.text}
                          {cell.isBest && <Badge ml={2} colorPalette="green" size="xs">Highest</Badge>}
                        </Box>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </Box>
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
