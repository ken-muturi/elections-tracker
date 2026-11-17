import { Box, Text, HStack } from "@chakra-ui/react"
import { WardData } from "@/services/Hesabu"
import { joinNames, pickEquityFlags } from "./project-format"

type Props = { wards: WardData[]; countyName: string }

const completion = (w: WardData) =>
  w.totalProjects > 0 ? Math.round((w.completedProjects / w.totalProjects) * 100) : 0

export const EquityAlert = ({ wards, countyName }: Props) => {
  const flagged = pickEquityFlags(wards)
  if (flagged.length === 0) return null

  const combinedPopulation = flagged.reduce((sum, w) => sum + w.population, 0)
  const comps = flagged.map(completion)
  const sats = flagged.map((w) => w.citizenSatisfactionScore)
  const range = (xs: number[]) =>
    Math.min(...xs) === Math.max(...xs) ? `${xs[0]}%` : `${Math.min(...xs)}–${Math.max(...xs)}%`
  const verb = flagged.length === 1 ? "shows" : "show"

  return (
    <Box bg="red.50" border="1px solid" borderColor="red.200" borderRadius="lg" p={4}>
      <HStack gap={2} mb={2} align="flex-start">
        <Text fontSize="xl" flexShrink={0}>⚖️</Text>
        <Text fontWeight="bold" color="red.600" fontSize="sm">
          Equity Alert &mdash; Article 201 of the Constitution
        </Text>
      </HStack>
      <Text fontSize="sm" color="red.700" pl={8}>
        {joinNames(flagged.map((w) => w.name))} {verb} the lowest project completion ({range(comps)}) and
        citizen satisfaction ({range(sats)}) in {countyName}. With a combined population of
        ~{combinedPopulation.toLocaleString()}, equitable resource distribution requires targeted attention.
      </Text>
    </Box>
  )
}
