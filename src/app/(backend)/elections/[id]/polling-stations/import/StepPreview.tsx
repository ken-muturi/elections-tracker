"use client"

import { useState } from "react"
import { Text, VStack, HStack, Box } from "@chakra-ui/react"
import { FiChevronDown, FiChevronUp, FiMapPin, FiGrid } from "react-icons/fi"
import type { PreviewResult, PreviewWard } from "./types"

interface Props {
  preview: PreviewResult
}

export default function StepPreview({ preview }: Props) {
  const [detailOpen, setDetailOpen] = useState(true)
  const [expandedWards, setExpandedWards] = useState<Set<string>>(
    () => new Set(preview.detail.map((w) => w.code))
  )

  const toggleWard = (key: string) =>
    setExpandedWards((prev) => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })

  // Group wards by county
  const byCounty: Record<string, PreviewWard[]> = {}
  for (const w of preview.detail) {
    if (!byCounty[w.countyName]) byCounty[w.countyName] = []
    byCounty[w.countyName].push(w)
  }

  return (
    <VStack gap={3} alignItems="stretch">
      {/* Aggregate counts */}
      <Box bg="#f0fdf4" borderWidth="1px" borderColor="#86efac" borderRadius="xl" p={4}>
        <HStack justify="space-between" mb={3}>
          <Text fontSize="sm" fontWeight="700" color="#166534">Import Preview</Text>
          <Text fontSize="xs" color="#4ade80">Duplicates (same code) skipped automatically</Text>
        </HStack>
        <HStack gap={4} flexWrap="wrap">
          {[
            { label: "New Wards", value: preview.wards, total: preview.totalWards },
            { label: "Polling Stations", value: preview.stations },
            { label: "Streams", value: preview.streams },
          ].map((stat) => (
            <Box key={stat.label} flex={1} minW="80px">
              <Text fontSize="2xl" fontWeight="800" color="#166534" lineHeight="1.1">
                {stat.value}
                {stat.total !== undefined && stat.total !== stat.value && (
                  <Text as="span" fontSize="sm" color="#4ade80" fontWeight="400" ml={1}>
                    /{stat.total}
                  </Text>
                )}
              </Text>
              <Text fontSize="xs" color="#4ade80" fontWeight="600">{stat.label}</Text>
            </Box>
          ))}
        </HStack>
      </Box>

      {/* Detail tree */}
      <Box borderWidth="1px" borderColor="gray.100" borderRadius="xl" overflow="hidden" bg="white">
        {/* Toggle header */}
        <HStack
          px={4} py={3} justify="space-between"
          cursor="pointer" _hover={{ bg: "gray.50" }}
          onClick={() => setDetailOpen((v) => !v)}
          borderBottomWidth={detailOpen ? "1px" : "0"}
          borderBottomColor="gray.100"
        >
          <HStack gap={2}>
            <Text fontSize="sm" fontWeight="600" color="gray.700">Full Breakdown</Text>
            <Box px={1.5} py={0.5} bg="gray.100" borderRadius="sm" fontSize="10px" fontWeight="700" color="gray.500">
              {preview.totalWards} ward{preview.totalWards !== 1 ? "s" : ""}
            </Box>
          </HStack>
          {detailOpen
            ? <FiChevronUp fontSize="0.85rem" color="#9ca3af" />
            : <FiChevronDown fontSize="0.85rem" color="#9ca3af" />}
        </HStack>

        {detailOpen && (
          <Box
            maxH="320px" overflowY="auto"
            css={{ "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { background: "#e5e7eb", borderRadius: "4px" } }}
          >
            {Object.entries(byCounty).sort(([a], [b]) => a.localeCompare(b)).map(([county, wards], ci) => (
              <Box key={county} borderTopWidth={ci > 0 ? "1px" : "0"} borderTopColor="gray.50">
                {/* County header */}
                <HStack px={4} py={2} bg="#f8fafc" gap={2}>
                  <Box w={1.5} h={1.5} borderRadius="full" bg="#6366f1" flexShrink={0} />
                  <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="wide">
                    {county}
                  </Text>
                  <Text fontSize="10px" color="gray.400">{wards.length} ward{wards.length !== 1 ? "s" : ""}</Text>
                </HStack>

                {wards.map((ward, wi) => {
                  const isOpen = expandedWards.has(ward.code)
                  const totalStreams = ward.pollingStations.reduce((s, ps) => s + ps.streams.length, 0)
                  return (
                    <Box key={ward.code} borderTopWidth={wi > 0 ? "1px" : "0"} borderTopColor="gray.50">
                      {/* Ward row */}
                      <HStack
                        px={5} py={2} gap={2} bg="white"
                        cursor={ward.pollingStations.length > 0 ? "pointer" : "default"}
                        _hover={ward.pollingStations.length > 0 ? { bg: "gray.50" } : {}}
                        onClick={() => ward.pollingStations.length > 0 && toggleWard(ward.code)}
                      >
                        {ward.pollingStations.length > 0 && (
                          isOpen
                            ? <FiChevronDown fontSize="0.65rem" color="#9ca3af" />
                            : <FiChevronDown fontSize="0.65rem" color="#d1d5db" style={{ transform: "rotate(-90deg)" }} />
                        )}
                        <Box w={1} h={3} bg="#c7d2fe" borderRadius="full" flexShrink={0} />
                        <Text fontSize="xs" fontWeight="600" color="gray.700" flex={1}>
                          {ward.name}
                          <Text as="span" fontSize="10px" color="gray.400" fontWeight="400" ml={1.5}>
                            {ward.constituencyName}
                          </Text>
                        </Text>
                        <HStack gap={1.5}>
                          {ward.isNew && (
                            <Box px={1.5} py={0.5} bg="#eff6ff" color="#1d4ed8" borderRadius="sm" fontSize="9px" fontWeight="700">
                              NEW
                            </Box>
                          )}
                          <Text fontSize="10px" color="gray.400">
                            {ward.pollingStations.length} stn · {totalStreams} str
                          </Text>
                        </HStack>
                      </HStack>

                      {/* Polling stations */}
                      {isOpen && ward.pollingStations.map((ps, psi) => (
                        <Box
                          key={ps.code}
                          borderTopWidth="1px" borderTopColor="gray.50"
                          bg={psi % 2 === 0 ? "#fafafa" : "white"}
                        >
                          <HStack px={8} py={1.5} gap={2}>
                            <FiMapPin fontSize="0.65rem" color="#9ca3af" />
                            <Text fontSize="xs" color="gray.600" flex={1}>
                              {ps.name}
                              <Text as="span" fontSize="10px" color="gray.400" ml={1}>{ps.code}</Text>
                            </Text>
                            <HStack gap={1} flexWrap="wrap">
                              {ps.streams.length === 0 ? (
                                <Text fontSize="10px" color="gray.300">no streams</Text>
                              ) : ps.streams.map((s) => (
                                <HStack key={s.code} gap={0.5} px={1.5} py={0.5} bg="#f3f4f6" borderRadius="sm">
                                  <FiGrid fontSize="0.5rem" color="#9ca3af" />
                                  <Text fontSize="10px" color="gray.500" fontWeight="600">{s.name || s.code}</Text>
                                </HStack>
                              ))}
                            </HStack>
                          </HStack>
                        </Box>
                      ))}
                    </Box>
                  )
                })}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </VStack>
  )
}
