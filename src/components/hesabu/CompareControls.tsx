"use client"

import { useRouter } from "next/navigation"
import { Box, HStack, Text, VStack, chakra } from "@chakra-ui/react"
import { MAX_COMPARE } from "./compare-metrics"
import { buildCompareHref, type CompareParams } from "./compare-params"

type Props = {
  params: CompareParams
  years: string[]
  countyOptions: { code: string; name: string }[]
  metricOptions: { key: string; label: string }[]
}

const selectStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, fontWeight: 600,
  padding: "6px 10px", background: "white", color: "#0f172a", maxWidth: "100%",
}

const toggleStyle = (active: boolean): React.CSSProperties => ({
  border: "1px solid", borderColor: active ? "#0e7490" : "#cbd5e1", borderRadius: 8,
  background: active ? "#0e7490" : "white", color: active ? "white" : "#0f172a",
  fontSize: 13, fontWeight: 600, padding: "6px 12px", cursor: "pointer",
})

export function CompareControls({ params, years, countyOptions, metricOptions }: Props) {
  const router = useRouter()
  const go = (changes: Partial<CompareParams>) =>
    router.replace(buildCompareHref({ ...params, ...changes }), { scroll: false })
  const nameOf = (code: string) => countyOptions.find((o) => o.code === code)?.name ?? code
  const full = params.counties.length >= MAX_COMPARE
  const addable = countyOptions.filter((o) => !params.counties.includes(o.code))

  return (
    <VStack align="stretch" gap={3} bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={4}>
      <HStack gap={2} flexWrap="wrap">
        {(["side", "rank"] as const).map((v) => (
          <chakra.button minH={{ base: "40px", md: "auto" }} key={v} type="button" aria-pressed={params.view === v} onClick={() => go({ view: v })} style={toggleStyle(params.view === v)}>
            {v === "side" ? "Side by side" : "Ranking"}
          </chakra.button>
        ))}
        <chakra.select minH={{ base: "40px", md: "auto" }} aria-label="Fiscal year" value={params.year} onChange={(e) => go({ year: e.target.value })} style={selectStyle}>
          {years.map((y) => <option key={y} value={y}>FY {y}</option>)}
        </chakra.select>
        {params.view === "rank" && (
          <chakra.select minH={{ base: "40px", md: "auto" }} aria-label="Figure to rank by" value={params.metric} onChange={(e) => go({ metric: e.target.value })} style={selectStyle}>
            {metricOptions.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </chakra.select>
        )}
      </HStack>
      <HStack gap={2} flexWrap="wrap">
        <Text fontSize="sm" color="gray.600">{params.view === "rank" ? "Highlight:" : "Counties:"}</Text>
        {params.counties.map((code) => (
          <HStack key={code} gap={1} bg="cyan.50" border="1px solid" borderColor="cyan.200" borderRadius="full" pl={3} pr={1} py={0.5}>
            <Text fontSize="sm" fontWeight="600" color="cyan.900">{nameOf(code)}</Text>
            <Box as="button" aria-label={`Remove ${nameOf(code)}`} onClick={() => go({ counties: params.counties.filter((c) => c !== code) })}
              display="inline-flex" alignItems="center" justifyContent="center"
              minW={{ base: "40px", md: "auto" }} minH={{ base: "40px", md: "auto" }}
              px={1.5} borderRadius="full" color="cyan.900" cursor="pointer" _hover={{ bg: "cyan.100" }}>
              ×
            </Box>
          </HStack>
        ))}
        <chakra.select minH={{ base: "40px", md: "auto" }} aria-label="Add county" value="" disabled={full} style={selectStyle}
          onChange={(e) => e.target.value && go({ counties: [...params.counties, e.target.value] })}>
          <option value="">{full ? `Up to ${MAX_COMPARE} counties` : "+ Add county"}</option>
          {addable.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
        </chakra.select>
      </HStack>
    </VStack>
  )
}
