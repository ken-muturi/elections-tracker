import { Box, Text } from "@chakra-ui/react"
import { getComparisonYears, getCountyComparison, getUniqueCounties } from "@/services/Hesabu"
import { CompareView } from "@/components/hesabu/CompareView"
import { parseCompareParams, type RawSearchParams } from "@/components/hesabu/compare-params"

export const metadata = {
  title: "Compare counties — Hesabu",
  description: "Compare Kenya counties side by side or ranked on budget and delivery figures.",
}

type Props = { searchParams: Promise<RawSearchParams> }

export default async function ComparePage({ searchParams }: Props) {
  const raw = await searchParams
  const [years, countyOptions] = await Promise.all([getComparisonYears(), getUniqueCounties()])

  if (years.length === 0) {
    return (
      <Box p={8}>
        <Text fontWeight="700">No county data yet</Text>
      </Box>
    )
  }

  const params = parseCompareParams(raw, { years, countyCodes: countyOptions.map((c) => c.code) })
  const counties = await getCountyComparison(params.year)

  return <CompareView params={params} years={years} countyOptions={countyOptions} counties={counties} />
}
