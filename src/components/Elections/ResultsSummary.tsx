/**
 * Reusable summary stats row — shows position count, streams,
 * total votes and validations for an election.
 */
import { Box, Text, SimpleGrid } from "@chakra-ui/react"

export type ResultStat = {
  positionId: string
  positionType: string
  positionTitle: string
  aggregationLevel: string
  entities: {
    entityId: string
    entityName: string
    candidates: {
      id: string
      name: string
      party: string | null
      streamVotes: number
      levelVotes: number
    }[]
    totalVotes: number
    rejectedVotes: number
  }[]
  streamStats: {
    totalReported: number
    totalVotes: number
    rejectedVotes: number
  }
  levelValidations: number
}

type ResultsSummaryProps = {
  results: ResultStat[]
}

export default function ResultsSummary({ results }: ResultsSummaryProps) {
  const totalStreamsReported = results.reduce(
    (s, r) => s + r.streamStats.totalReported, 0,
  )
  const totalVotesAll = results.reduce(
    (s, r) => s + r.streamStats.totalVotes, 0,
  )
  const totalValidations = results.reduce(
    (s, r) => s + r.levelValidations, 0,
  )

  const items = [
    { label: "Positions",   value: results.length },
    { label: "Streams In",  value: totalStreamsReported.toLocaleString() },
    { label: "Total Votes", value: totalVotesAll.toLocaleString() },
    { label: "Validated",   value: totalValidations },
  ]

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
      {items.map(({ label, value }) => (
        <Box
          key={label} bg="white" p={4} borderRadius="xl"
          borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        >
          <Text
            fontSize="xs" color="gray.500" fontWeight="600"
            textTransform="uppercase" letterSpacing="wide" mb={1}
          >
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="800" color="gray.900" lineHeight="1.1">
            {value}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  )
}
