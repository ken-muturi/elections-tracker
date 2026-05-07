import {
  Box, Heading, Text, VStack, HStack, SimpleGrid, Flex,
} from "@chakra-ui/react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getElectionById } from "@/services/Elections"
import {
  getElectionHierarchy,
  getElectionHierarchyCounts,
  getAllConstituencies,
} from "@/services/Hierarchy"
import { FiArrowLeft, FiMapPin, FiGrid, FiMap } from "react-icons/fi"
import ImportFromElectionDialog from "./ImportFromElectionDialog"
import ImportFromCsvDialog from "./ImportFromCsvDialog"
import ElectionHierarchyManager, {
  type WardData,
  type ConstituencyOption,
} from "./ElectionHierarchyManager"

export default async function ElectionPollingStationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [election, hierarchy, counts, allConstituencies] = await Promise.all([
    getElectionById(id).catch(() => null),
    getElectionHierarchy(id).catch(() => []),
    getElectionHierarchyCounts(id).catch(() => ({ wards: 0, stations: 0, streams: 0 })),
    getAllConstituencies().catch(() => []),
  ])

  if (!election) notFound()

  // Normalise hierarchy into plain serialisable WardData[]
  const initialWards: WardData[] = hierarchy.map((w) => ({
    id: w.id,
    name: w.name,
    code: w.code,
    constituencyId: w.constituencyId,
    constituency: {
      name: w.constituency.name,
      county: { name: w.constituency.county.name },
    },
    pollingStations: w.pollingStations.map((ps) => ({
      id: ps.id,
      name: ps.name,
      code: ps.code,
      county: ps.county,
      constituency: ps.constituency,
      ward: ps.ward,
      registeredVoters: ps.registeredVoters,
      streams: ps.streams.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        registeredVoters: s.registeredVoters,
        isActive: s.isActive,
        pollingStationId: s.pollingStationId,
      })),
    })),
  }))

  const constituencies: ConstituencyOption[] = allConstituencies.map((c) => ({
    id: c.id,
    name: c.name,
    county: { name: c.county.name, code: c.county.code },
  }))

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Back + header */}
      <VStack alignItems="flex-start" gap={3}>
        <Link href={`/elections/${id}`}>
          <HStack
            gap={1.5} color="gray.500" fontSize="sm"
            _hover={{ color: "gray.800" }} transition="color 0.15s"
          >
            <FiArrowLeft />
            <Text>{election.title}</Text>
          </HStack>
        </Link>

        <HStack justify="space-between" align="flex-end" w="full" flexWrap="wrap" gap={3}>
          <VStack alignItems="flex-start" gap={0.5}>
            <HStack gap={2}>
              <Heading
                fontWeight="800"
                fontSize={{ base: "xl", md: "2xl" }}
                color="gray.900"
                lineHeight="1.2"
              >
                Manage Polling Stations
              </Heading>
              <Box
                px={2} py={0.5}
                bg="#eff9d1" color="#798217"
                borderRadius="md" fontSize="sm" fontWeight="700"
              >
                {election.year}
              </Box>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              {counts.wards} wards · {counts.stations} polling stations · {counts.streams} streams
            </Text>
          </VStack>

          <HStack gap={2} flexWrap="wrap">
            <ImportFromElectionDialog
              targetElectionId={id}
              targetElectionTitle={election.title}
            />
            <ImportFromCsvDialog
              targetElectionId={id}
              targetElectionTitle={election.title}
            />
          </HStack>
        </HStack>
      </VStack>

      {/* Stats */}
      <SimpleGrid columns={{ base: 3 }} gap={4}>
        {[
          { label: "Wards", value: counts.wards, icon: <FiMap />, color: "#6366f1" },
          { label: "Polling Stations", value: counts.stations, icon: <FiMapPin />, color: "#0891b2" },
          { label: "Streams", value: counts.streams, icon: <FiGrid />, color: "#16a34a" },
        ].map((stat) => (
          <Box
            key={stat.label}
            bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
            boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
          >
            <HStack gap={3} mb={2}>
              <Flex
                w={9} h={9} borderRadius="lg"
                bg={`${stat.color}15`}
                align="center" justify="center"
                color={stat.color}
                fontSize="1rem"
              >
                {stat.icon}
              </Flex>
              <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                {stat.label}
              </Text>
            </HStack>
            <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">
              {stat.value}
            </Text>
          </Box>
        ))}
      </SimpleGrid>

      {/* Interactive hierarchy manager (client component) */}
      <ElectionHierarchyManager
        electionId={id}
        initialWards={initialWards}
        constituencies={constituencies}
      />
    </VStack>
  )
}