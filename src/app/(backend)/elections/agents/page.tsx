import {
  Box, Heading, Text, VStack, HStack, SimpleGrid, Flex, Badge,
} from "@chakra-ui/react"
import { FiUsers } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import prisma from "@/db"

async function getAgentCounts() {
  try {
    const assignments = await prisma.agentStream.findMany({
      include: {
        election: { select: { id: true, title: true, year: true, isActive: true } },
        stream: {
          select: {
            name: true,
            code: true,
            pollingStation: {
              select: {
                name: true,
                ward: true,
                constituency: true,
                county: true,
              },
            },
          },
        },
        agent: { select: { id: true, firstname: true, othernames: true, email: true } },
      },
      orderBy: { election: { year: "desc" } },
    })

    // Group by election
    const byElection: Record<string, {
      election: { id: string; title: string; year: number; isActive: boolean }
      assignments: typeof assignments
    }> = {}

    for (const a of assignments) {
      if (!byElection[a.electionId]) {
        byElection[a.electionId] = { election: a.election, assignments: [] }
      }
      byElection[a.electionId].assignments.push(a)
    }

    return byElection
  } catch {
    return {}
  }
}

export default async function AgentAssignmentsPage() {
  const agentData = await getAgentCounts()

  const totalAssignments = Object.values(agentData).reduce((s, e) => s + e.assignments.length, 0)
  const activeAssignments = Object.values(agentData)
    .filter((e) => e.election.isActive)
    .reduce((s, e) => s + e.assignments.length, 0)

  // Unique agents across all elections
  const uniqueAgentIds = new Set(
    Object.values(agentData).flatMap((e) => e.assignments.map((a) => a.agentId))
  )

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Header */}
      <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
        <VStack alignItems="flex-start" gap={0.5}>
          <Heading fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} color="gray.900" lineHeight="1.2">
            Agent Assignments
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Manage agent-to-stream assignments for each election
          </Text>
        </VStack>
      </HStack>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Total Assignments
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">{totalAssignments}</Text>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Active Assignments
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="#065f46" lineHeight="1.1">{activeAssignments}</Text>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Unique Agents
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">{uniqueAgentIds.size}</Text>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)">
          <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase" letterSpacing="wide" mb={1}>
            Elections
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">{Object.keys(agentData).length}</Text>
        </Box>
      </SimpleGrid>

      {/* Per-election breakdown */}
      {Object.keys(agentData).length === 0 ? (
        <Box bg="white" borderRadius="xl" p={12} textAlign="center"
          borderWidth="2px" borderStyle="dashed" borderColor="gray.200">
          <Flex w={16} h={16} borderRadius="2xl" bg="#eff9d1" align="center" justify="center" mx="auto" mb={4}>
            <FiUsers fontSize="2rem" color="#798217" />
          </Flex>
          <Text fontWeight="700" fontSize="lg" color="gray.700" mb={1}>No agent assignments yet</Text>
          <Text fontSize="sm" color="gray.400">
            Assign agents to streams within each election to enable results data entry.
          </Text>
        </Box>
      ) : (
        <VStack gap={4} alignItems="stretch">
          {Object.values(agentData).map(({ election, assignments }) => {
            // unique agents in this election
            const agentsInElection = new Map<string, { name: string; email: string; streamCount: number }>()
            for (const a of assignments) {
              const existing = agentsInElection.get(a.agentId)
              if (existing) {
                existing.streamCount++
              } else {
                agentsInElection.set(a.agentId, {
                  name: `${a.agent.firstname} ${a.agent.othernames}`,
                  email: a.agent.email,
                  streamCount: 1,
                })
              }
            }

            return (
              <Box key={election.id} bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
                boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden">
                {/* Election header */}
                <HStack px={5} py={4} bg="#f8fafc" borderBottomWidth="1px" borderBottomColor="gray.100"
                  justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack gap={3}>
                    <Flex w={10} h={10} borderRadius="lg" bg="#eff9d1" align="center" justify="center" flexShrink={0}>
                      <MdHowToVote fontSize="1.2rem" color="#798217" />
                    </Flex>
                    <VStack gap={0} alignItems="flex-start">
                      <Text fontWeight="700" fontSize="sm" color="gray.900">{election.title}</Text>
                      <HStack gap={2}>
                        <Badge px={2} py={0.5} borderRadius="full" bg="#eff9d1" color="#798217"
                          fontSize="xs" fontWeight="700">{election.year}</Badge>
                        <Badge
                          px={2} py={0.5} borderRadius="full" fontSize="xs" fontWeight="700"
                          bg={election.isActive ? "#d1fae5" : "#f3f4f6"}
                          color={election.isActive ? "#065f46" : "#6b7280"}
                        >
                          {election.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" fontWeight="600">
                    {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} · {agentsInElection.size} agent{agentsInElection.size !== 1 ? "s" : ""}
                  </Text>
                </HStack>

                {/* Agents in this election */}
                <VStack px={5} py={4} gap={2} alignItems="stretch">
                  {Array.from(agentsInElection.entries()).map(([agentId, agent]) => (
                    <HStack key={agentId} gap={3} py={2} px={3} borderRadius="lg"
                      _hover={{ bg: "#f8fafc" }} transition="background 0.15s">
                      <Flex w={8} h={8} borderRadius="full" bg="#e0e7ff" align="center" justify="center" flexShrink={0}>
                        <FiUsers fontSize="0.85rem" color="#4f46e5" />
                      </Flex>
                      <VStack gap={0} alignItems="flex-start" flex={1}>
                        <Text fontSize="sm" fontWeight="600" color="gray.900">{agent.name}</Text>
                        <Text fontSize="xs" color="gray.400">{agent.email}</Text>
                      </VStack>
                      <Badge px={2} py={0.5} borderRadius="full" bg="#f1f5f9" color="#475569"
                        fontSize="xs" fontWeight="600">
                        {agent.streamCount} stream{agent.streamCount !== 1 ? "s" : ""}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )
          })}
        </VStack>
      )}
    </VStack>
  )
}
