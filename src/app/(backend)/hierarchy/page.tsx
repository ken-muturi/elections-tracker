import {
  Box, Heading, Text, VStack, HStack, SimpleGrid, Flex, Badge,
} from "@chakra-ui/react"
import { getPermanentHierarchy, getPermanentCounts } from "@/services/Hierarchy"
import { getElections } from "@/services/Elections"
import { getElectionHierarchyCounts } from "@/services/Hierarchy"
import { FiLayers, FiMapPin, FiMap, FiGrid } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"

export default async function HierarchyPage() {
  const [counties, counts, elections] = await Promise.all([
    getPermanentHierarchy(),
    getPermanentCounts(),
    getElections().catch(() => []),
  ])

  // Gather election-scoped hierarchy counts per election
  const electionCounts = await Promise.all(
    elections.map(async (e) => ({
      election: e,
      counts: await getElectionHierarchyCounts(e.id).catch(() => ({ wards: 0, stations: 0, streams: 0 })),
    }))
  )

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Header */}
      <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
        <VStack alignItems="flex-start" gap={0.5}>
          <Heading fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} color="gray.900" lineHeight="1.2">
            Geographic Hierarchy
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Permanent structure (Counties → Constituencies) and election-scoped units (Wards → Stations → Streams)
          </Text>
        </VStack>
      </HStack>

      {/* Permanent stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Counties
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">{counts.counties}</Text>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Constituencies
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">{counts.constituencies}</Text>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Elections
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">{elections.length}</Text>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Active Elections
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="#065f46" lineHeight="1.1">
            {elections.filter((e) => e.isActive).length}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Election-scoped hierarchy counts */}
      {electionCounts.length > 0 && (
        <Box>
          <HStack mb={4} gap={2}>
            <MdHowToVote fontSize="1.1rem" color="#798217" />
            <Heading fontWeight="700" fontSize="lg" color="gray.800">Election Hierarchies</Heading>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
            {electionCounts.map(({ election, counts: ec }) => (
              <Box key={election.id} bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
                boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden"
                transition="all 0.2s ease"
                _hover={{ boxShadow: "0 8px 25px -5px rgba(0,0,0,0.12)", transform: "translateY(-2px)", borderColor: "#C9D927" }}>
                <Box px={5} py={4} borderBottomWidth="1px" borderBottomColor="gray.100">
                  <HStack justify="space-between" mb={1}>
                    <Text fontWeight="700" fontSize="sm" color="gray.900">{election.title}</Text>
                    <Badge
                      px={2} py={0.5} borderRadius="full" fontSize="xs" fontWeight="700"
                      bg={election.isActive ? "#d1fae5" : "#f3f4f6"}
                      color={election.isActive ? "#065f46" : "#6b7280"}
                    >
                      {election.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.400">{election.year}</Text>
                </Box>
                <HStack px={5} py={4} gap={4}>
                  <VStack gap={0.5} alignItems="center" flex={1}>
                    <FiMapPin fontSize="1rem" color="#6366f1" />
                    <Text fontSize="xl" fontWeight="800" color="gray.900">{ec.wards}</Text>
                    <Text fontSize="xs" color="gray.400">Wards</Text>
                  </VStack>
                  <VStack gap={0.5} alignItems="center" flex={1}>
                    <FiMap fontSize="1rem" color="#0891b2" />
                    <Text fontSize="xl" fontWeight="800" color="gray.900">{ec.stations}</Text>
                    <Text fontSize="xs" color="gray.400">Stations</Text>
                  </VStack>
                  <VStack gap={0.5} alignItems="center" flex={1}>
                    <FiGrid fontSize="1rem" color="#d946ef" />
                    <Text fontSize="xl" fontWeight="800" color="gray.900">{ec.streams}</Text>
                    <Text fontSize="xs" color="gray.400">Streams</Text>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Counties → Constituencies tree */}
      <Box>
        <HStack mb={4} gap={2}>
          <FiLayers fontSize="1.1rem" color="#798217" />
          <Heading fontWeight="700" fontSize="lg" color="gray.800">Counties &amp; Constituencies</Heading>
        </HStack>

        {counties.length === 0 ? (
          <Box bg="white" borderRadius="xl" p={12} textAlign="center"
            borderWidth="2px" borderStyle="dashed" borderColor="gray.200">
            <Flex w={16} h={16} borderRadius="2xl" bg="#eff9d1" align="center" justify="center" mx="auto" mb={4}>
              <FiLayers fontSize="2rem" color="#798217" />
            </Flex>
            <Text fontWeight="700" fontSize="lg" color="gray.700" mb={1}>No counties configured</Text>
            <Text fontSize="sm" color="gray.400">
              Seed your database with counties and constituencies to get started.
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
            {counties.map((county) => (
              <Box key={county.id} bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
                boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden">
                <HStack px={5} py={3} bg="#f8fafc" borderBottomWidth="1px" borderBottomColor="gray.100"
                  justify="space-between">
                  <HStack gap={2}>
                    <Flex w={8} h={8} borderRadius="lg" bg="#eff9d1" align="center" justify="center" flexShrink={0}>
                      <FiMapPin fontSize="0.9rem" color="#798217" />
                    </Flex>
                    <VStack gap={0} alignItems="flex-start">
                      <Text fontWeight="700" fontSize="sm" color="gray.900">{county.name}</Text>
                      <Text fontSize="xs" color="gray.400">Code: {county.code}</Text>
                    </VStack>
                  </HStack>
                  <Badge px={2} py={0.5} borderRadius="full" bg="#eff9d1" color="#798217"
                    fontSize="xs" fontWeight="700">
                    {county.constituencies.length} constituencies
                  </Badge>
                </HStack>
                <VStack px={5} py={3} gap={1.5} alignItems="stretch">
                  {county.constituencies.length === 0 ? (
                    <Text fontSize="xs" color="gray.400" fontStyle="italic">No constituencies</Text>
                  ) : (
                    county.constituencies.map((c) => (
                      <HStack key={c.id} gap={2} py={1.5} px={2} borderRadius="md"
                        _hover={{ bg: "#f8fafc" }} transition="background 0.15s">
                        <Box w="6px" h="6px" borderRadius="full" bg="#94a3b8" flexShrink={0} />
                        <Text fontSize="sm" color="gray.700" flex={1}>{c.name}</Text>
                        <Text fontSize="xs" color="gray.400">{c.code}</Text>
                      </HStack>
                    ))
                  )}
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </VStack>
  )
}
