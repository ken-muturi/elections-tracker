import { getMyAssignments, getElectionPositionsWithCandidates, getStreamResultsForStream, getActiveElections } from "@/services/AgentAssignments"
import { VStack, Heading, Text, HStack, Box, Avatar, Badge, Flex } from "@chakra-ui/react"
import { MdHowToVote } from "react-icons/md"
import EnterResultsClient from "./EnterResultsClient"
import { getServerSession } from "next-auth"
import { AuthOptions } from "@/app/auth"


export default async function EnterResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ electionId?: string }>;
}) {
  const { electionId: initialElectionId } = await searchParams;
  const session = await getServerSession(AuthOptions);
  const user = session?.user;
  const role = user?.role?.toLowerCase() || "";
  const isAdmin = ["admin", "super admin"].includes(role);

  // ── Admin flow: lightweight load — elections only, streams fetched lazily ──
  if (isAdmin) {
    const activeElections = await getActiveElections();

    // Build minimal election data (no streams prefetched)
    const electionData = await Promise.all(
      activeElections.map(async (election) => {
        const positions = await getElectionPositionsWithCandidates(election.id);
        return {
          election,
          streams: [] as never[],
          positions,
          streamResultsMap: {} as Record<string, never[]>,
        };
      }),
    );

    return (
      <VStack gap={6} alignItems="stretch" w="full">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <VStack alignItems="flex-start" gap={0.5}>
            <Heading
              fontWeight="800"
              fontSize={{ base: "xl", md: "2xl" }}
              color="gray.900"
              lineHeight="1.2"
            >
              Enter Results
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Search for a stream and enter vote counts for each position
            </Text>
          </VStack>

          <HStack
            gap={2.5}
            px={3}
            py={2}
            borderRadius="xl"
            bg="white"
            borderWidth="1px"
            borderColor="gray.100"
            boxShadow="0 1px 3px rgba(0,0,0,0.04)"
          >
            <Avatar.Root bg="#0f172a" size="sm">
              <Avatar.Fallback color="#C9D927" fontWeight="700" fontSize="xs">
                {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
              </Avatar.Fallback>
            </Avatar.Root>
            <Box>
              <Text
                fontSize="sm"
                fontWeight="600"
                color="gray.900"
                lineHeight="1.3"
              >
                {user?.name ?? "Admin"}
              </Text>
              <Badge
                size="xs"
                colorPalette="purple"
                variant="subtle"
                fontSize="9px"
                fontWeight="700"
              >
                {user?.role ?? "Admin"}
              </Badge>
            </Box>
          </HStack>
        </Flex>

        <EnterResultsClient
          electionData={JSON.parse(JSON.stringify(electionData))}
          isAdmin
          initialElectionId={initialElectionId}
        />
      </VStack>
    );
  }

  // ── Agent flow: assignment-based (unchanged) ──
  const assignments = await getMyAssignments();

  // Group by election
  const electionMap = new Map<
    string,
    {
      election: (typeof assignments)[0]["election"];
      streams: typeof assignments;
    }
  >();

  for (const a of assignments) {
    if (!a.election.isActive) continue;
    const existing = electionMap.get(a.election.id);
    if (existing) {
      existing.streams.push(a);
    } else {
      electionMap.set(a.election.id, { election: a.election, streams: [a] });
    }
  }

  const elections = Array.from(electionMap.values());

  // Prefetch positions + existing results for all elections
  const electionData = await Promise.all(
    elections.map(async (e) => {
      const positions = await getElectionPositionsWithCandidates(e.election.id);
      const streamResultsMap: Record<
        string,
        Awaited<ReturnType<typeof getStreamResultsForStream>>
      > = {};
      for (const a of e.streams) {
        streamResultsMap[a.streamId] = await getStreamResultsForStream(
          a.streamId,
        );
      }
      return {
        election: e.election,
        streams: e.streams,
        positions,
        streamResultsMap,
      };
    }),
  );

  if (electionData.length === 0) {
    return (
      <VStack gap={6} alignItems="center" justifyContent="center" minH="60vh">
        <MdHowToVote fontSize="3rem" color="#94a3b8" />
        <VStack gap={1}>
          <Heading fontSize="xl" fontWeight="700" color="gray.700">
            No Active Assignments
          </Heading>
          <Text fontSize="sm" color="gray.500" textAlign="center" maxW="400px">
            You have no active stream assignments for any current election.
            Please contact your supervisor if you believe this is an error.
          </Text>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
        <VStack alignItems="flex-start" gap={0.5}>
          <Heading
            fontWeight="800"
            fontSize={{ base: "xl", md: "2xl" }}
            color="gray.900"
            lineHeight="1.2"
          >
            Enter Results
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Select a stream and enter vote counts for each position
          </Text>
        </VStack>

        {/* Logged-in user */}
        <HStack
          gap={2.5}
          px={3}
          py={2}
          borderRadius="xl"
          bg="white"
          borderWidth="1px"
          borderColor="gray.100"
          boxShadow="0 1px 3px rgba(0,0,0,0.04)"
        >
          <Avatar.Root bg="#0f172a" size="sm">
            <Avatar.Fallback color="#C9D927" fontWeight="700" fontSize="xs">
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </Avatar.Fallback>
          </Avatar.Root>
          <Box>
            <Text
              fontSize="sm"
              fontWeight="600"
              color="gray.900"
              lineHeight="1.3"
            >
              {user?.name ?? "Agent"}
            </Text>
            <Badge
              size="xs"
              colorPalette="blue"
              variant="subtle"
              fontSize="9px"
              fontWeight="700"
            >
              {user?.role ?? "Agent"}
            </Badge>
          </Box>
        </HStack>
      </Flex>

      <EnterResultsClient
        electionData={JSON.parse(JSON.stringify(electionData))}
        initialElectionId={initialElectionId}
      />
    </VStack>
  );
}
