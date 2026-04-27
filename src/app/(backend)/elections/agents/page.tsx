import {
  Box, Heading, Text, VStack, HStack, SimpleGrid,
} from "@chakra-ui/react"
import prisma from "@/db"
import AgentAssignmentImportWrapper from "@/components/AgentAssignmentImport/PageWrapper";
import AssignAgentForm from "@/components/AgentAssignment/AssignAgentForm";
import AssignmentList from "@/components/AgentAssignment/AssignmentList";


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
  const agentData = await getAgentCounts();

  const totalAssignments = Object.values(agentData).reduce(
    (s, e) => s + e.assignments.length,
    0,
  );
  const activeAssignments = Object.values(agentData)
    .filter((e) => e.election.isActive)
    .reduce((s, e) => s + e.assignments.length, 0);

  // Unique agents across all elections
  const uniqueAgentIds = new Set(
    Object.values(agentData).flatMap((e) =>
      e.assignments.map((a) => a.agentId),
    ),
  );

  // Get list of all elections for the import wrapper
  const elections = Object.values(agentData).map((e) => e.election);

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Header */}
      <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
        <VStack alignItems="flex-start" gap={0.5}>
          <Heading
            fontWeight="800"
            fontSize={{ base: "xl", md: "2xl" }}
            color="gray.900"
            lineHeight="1.2"
          >
            Agent Assignments
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Manage agent-to-stream assignments for each election
          </Text>
        </VStack>
        <AgentAssignmentImportWrapper elections={elections} />
      </HStack>

      {/* Manual assign */}
      <AssignAgentForm />

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <Box
          bg="white"
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        >
          <Text
            fontSize="xs"
            color="gray.500"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={1}
          >
            Total Assignments
          </Text>
          <Text
            fontSize="3xl"
            fontWeight="800"
            color="gray.900"
            lineHeight="1.1"
          >
            {totalAssignments}
          </Text>
        </Box>
        <Box
          bg="white"
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        >
          <Text
            fontSize="xs"
            color="gray.500"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={1}
          >
            Active Assignments
          </Text>
          <Text
            fontSize="3xl"
            fontWeight="800"
            color="#065f46"
            lineHeight="1.1"
          >
            {activeAssignments}
          </Text>
        </Box>
        <Box
          bg="white"
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        >
          <Text
            fontSize="xs"
            color="gray.500"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={1}
          >
            Unique Agents
          </Text>
          <Text
            fontSize="3xl"
            fontWeight="800"
            color="gray.900"
            lineHeight="1.1"
          >
            {uniqueAgentIds.size}
          </Text>
        </Box>
        <Box
          bg="white"
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        >
          <Text
            fontSize="xs"
            color="gray.500"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={1}
          >
            Elections
          </Text>
          <Text
            fontSize="3xl"
            fontWeight="800"
            color="gray.900"
            lineHeight="1.1"
          >
            {Object.keys(agentData).length}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Per-election breakdown */}
      <AssignmentList data={agentData} />
    </VStack>
  );
}
