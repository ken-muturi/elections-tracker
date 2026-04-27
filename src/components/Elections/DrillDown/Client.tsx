"use client"

import { Box, Flex, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import {
  getDrillDownNational,
  getDrillDownCounty,
  getDrillDownConstituency,
  getDrillDownWard,
  getDrillDownStation,
  type DrillDownResult,
} from "@/services/PublicResults"
import DrillDown from "./index"
import DrillDownSkeleton from "./Skeleton"
import FullPageLoader from "@/components/Generic/FullPageLoader"

const ENTITY_DRILL_FN: Record<
  string,
  (electionId: string, positionId: string, entityId: string) => Promise<DrillDownResult>
> = {
  COUNTY: getDrillDownCounty,
  CONSTITUENCY: getDrillDownConstituency,
  WARD: getDrillDownWard,
  STATION: getDrillDownStation,
}

export default function DrillDownClient({
  electionId,
  positionId,
  initialEntityId,
  initialEntityLevel,
}: {
  electionId: string
  positionId: string
  initialEntityId?: string
  initialEntityLevel?: string
}) {
  const drillFn = initialEntityId && initialEntityLevel && ENTITY_DRILL_FN[initialEntityLevel]
    ? () => ENTITY_DRILL_FN[initialEntityLevel](electionId, positionId, initialEntityId)
    : () => getDrillDownNational(electionId, positionId)

  const { data: initial, isLoading, isError } = useQuery({
    queryKey: ["public-results", electionId, positionId, initialEntityId ?? "national"],
    queryFn: drillFn,
  })

  if (isLoading) return (
    <>
      <DrillDownSkeleton />
      <FullPageLoader />
    </>
  )

  if (isError || !initial) {
    return (
      <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100" p={12} textAlign="center">
        <Flex direction="column" align="center" gap={3} color="gray.400">
          <Text fontSize="sm">Failed to load results. Please refresh the page.</Text>
        </Flex>
      </Box>
    )
  }

  return <DrillDown initial={initial} electionId={electionId} />
}
