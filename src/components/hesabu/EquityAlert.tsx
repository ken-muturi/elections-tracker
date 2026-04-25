import { Box, Text, HStack } from "@chakra-ui/react"
import { WardData } from "@/services/Hesabu"

type Props = { wards: WardData[] }

const LOW_SATISFACTION_THRESHOLD = 50

export const EquityAlert = ({ wards }: Props) => {
  const flagged = wards.filter((w) => w.citizenSatisfactionScore < LOW_SATISFACTION_THRESHOLD)
  if (flagged.length === 0) return null

  const combinedPopulation = flagged.reduce((sum, w) => sum + w.population, 0)
  const names = flagged.map((w) => w.name).join(" and ")
  const minCompletion = Math.min(
    ...flagged.map((w) =>
      w.totalProjects > 0 ? Math.round((w.completedProjects / w.totalProjects) * 100) : 0
    )
  )
  const maxCompletion = Math.max(
    ...flagged.map((w) =>
      w.totalProjects > 0 ? Math.round((w.completedProjects / w.totalProjects) * 100) : 0
    )
  )
  const minSat = Math.min(...flagged.map((w) => w.citizenSatisfactionScore))
  const maxSat = Math.max(...flagged.map((w) => w.citizenSatisfactionScore))

  return (
    <Box
      bg="red.50"
      border="1px solid"
      borderColor="red.200"
      borderRadius="lg"
      p={4}
    >
      <HStack gap={2} mb={2} align="flex-start">
        <Text fontSize="xl" flexShrink={0}>⚖️</Text>
        <Text fontWeight="bold" color="red.600" fontSize="sm">
          Equity Alert &mdash; Article 201 of the Constitution
        </Text>
      </HStack>
      <Text fontSize="sm" color="red.700" pl={8}>
        {names} show the lowest project completion rates ({minCompletion}&ndash;{maxCompletion}%) and
        citizen satisfaction ({minSat}&ndash;{maxSat}%). With a combined population of
        ~{combinedPopulation.toLocaleString()} and among the highest poverty rates in{" "}
        {wards[0] ? "Baringo" : "the county"}, equitable resource distribution requires targeted
        attention.
      </Text>
    </Box>
  )
}

