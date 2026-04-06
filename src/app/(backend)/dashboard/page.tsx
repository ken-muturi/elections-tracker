import {
  Box, Heading, Text, VStack, HStack, SimpleGrid, Flex,
} from "@chakra-ui/react"
import Link from "next/link"
import { getElections } from "@/services/Elections"
import { FiArrowRight, FiCalendar, FiUsers, FiBarChart2, FiPlusCircle } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"


export default async function DashboardPage() {
  const elections = await getElections().catch(() => [])

  const active = elections.filter((e) => e.isActive)
  const totalCandidates = elections.reduce(
    (s, e) => s + e.positions.reduce((ps, p) => ps + p.candidates.length, 0),
    0
  )
  const totalPositions = elections.reduce((s, e) => s + e.positions.length, 0)

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Header */}
      <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
        <VStack alignItems="flex-start" gap={0.5}>
          <Heading fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} color="gray.900" lineHeight="1.2">
            Overview
          </Heading>
          <Text fontSize="sm" color="gray.500">Election management dashboard</Text>
        </VStack>
        <Link href="/elections/new">
          <HStack gap={2} px={4} py={2} bg="#0f172a" color="white" borderRadius="lg"
            fontSize="sm" fontWeight="600" _hover={{ bg: "#1e293b" }} transition="background 0.15s" cursor="pointer">
            <FiPlusCircle fontSize="1rem" color="#C9D927" />
            <Text>New Election</Text>
          </HStack>
        </Link>
      </HStack>

      {/* Stat cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Total Elections
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">{elections.length}</Text>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Active
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="#065f46" lineHeight="1.1">{active.length}</Text>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Positions
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">{totalPositions}</Text>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Candidates
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">{totalCandidates}</Text>
        </Box>
      </SimpleGrid>

      {/* Recent elections */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading fontWeight="700" fontSize="lg" color="gray.800">Elections</Heading>
          <Link href="/elections">
            <HStack gap={1} fontSize="sm" color="gray.400" _hover={{ color: "gray.700" }} transition="color 0.15s">
              <Text>View all</Text>
              <FiArrowRight />
            </HStack>
          </Link>
        </HStack>

        {elections.length === 0 ? (
          <Box bg="white" borderRadius="xl" p={10} textAlign="center"
            borderWidth="2px" borderStyle="dashed" borderColor="gray.200">
            <Flex w={14} h={14} borderRadius="2xl" bg="#eff9d1" align="center" justify="center" mx="auto" mb={3}>
              <MdHowToVote fontSize="1.8rem" color="#798217" />
            </Flex>
            <Text fontWeight="700" fontSize="md" color="gray.700" mb={1}>No elections yet</Text>
            <Text fontSize="sm" color="gray.400" mb={4}>
              Create your first election to start tracking results.
            </Text>
            <Link href="/elections/new">
              <Box as="span" display="inline-block" px={4} py={2} bg="#C9D927" color="#0f172a"
                borderRadius="lg" fontWeight="700" fontSize="sm" cursor="pointer">
                Create Election
              </Box>
            </Link>
          </Box>
        ) : (
          <VStack gap={3} alignItems="stretch">
            {elections.slice(0, 5).map((election) => {
              const totalC = election.positions.reduce((s, p) => s + p.candidates.length, 0)
              return (
                <Link key={election.id} href={`/elections/${election.id}`}>
                  <Box bg="white" px={5} py={4} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
                    boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" cursor="pointer"
                    _hover={{ borderColor: "#C9D927", boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)" }}
                    transition="all 0.2s ease">
                    <HStack justify="space-between" flexWrap="wrap" gap={2}>
                      <HStack gap={3}>
                        <Flex w={9} h={9} borderRadius="lg" bg="#eff9d1" align="center" justify="center" flexShrink={0}>
                          <MdHowToVote fontSize="1.1rem" color="#798217" />
                        </Flex>
                        <VStack alignItems="flex-start" gap={0}>
                          <HStack gap={2}>
                            <Text fontWeight="700" fontSize="sm" color="gray.900">{election.title}</Text>
                            <Box px={1.5} py={0.5} bg="#eff9d1" color="#798217" borderRadius="md" fontSize="xs" fontWeight="700">
                              {election.year}
                            </Box>
                            {election.isActive && (
                              <Box px={1.5} py={0.5} bg="#d1fae5" color="#065f46" borderRadius="md" fontSize="xs" fontWeight="700">
                                Active
                              </Box>
                            )}
                          </HStack>
                          <HStack gap={3}>
                            <HStack gap={1}>
                              <FiCalendar fontSize="0.7rem" color="#9ca3af" />
                              <Text fontSize="xs" color="gray.400">
                                {new Date(election.electionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </Text>
                            </HStack>
                            <HStack gap={1}>
                              <FiUsers fontSize="0.7rem" color="#9ca3af" />
                              <Text fontSize="xs" color="gray.400">
                                {totalC} candidates · {election.positions.length} positions
                              </Text>
                            </HStack>
                          </HStack>
                        </VStack>
                      </HStack>
                      <HStack gap={2}>
                        <Link href={`/elections/${election.id}/results`}>
                          <HStack gap={1.5} px={3} py={1.5} borderRadius="lg" bg="#eff9d1" color="#798217"
                            fontSize="xs" fontWeight="600" cursor="pointer" _hover={{ bg: "#e5f0a0" }} transition="all 0.15s">
                            <FiBarChart2 />
                            <Text>Results</Text>
                          </HStack>
                        </Link>
                        <FiArrowRight fontSize="0.85rem" color="#9ca3af" />
                      </HStack>
                    </HStack>
                  </Box>
                </Link>
              )
            })}
          </VStack>
        )}
      </Box>
    </VStack>
  )
}
