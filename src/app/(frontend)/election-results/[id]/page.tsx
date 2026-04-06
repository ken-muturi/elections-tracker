import { Box, Heading, Text, VStack, HStack, Flex } from "@chakra-ui/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicElectionById } from "@/services/Elections";
import { getElectionResults } from "@/services/LevelResults";
import { ResultsSummary, PositionResults } from "@/components/Elections";
import { FiArrowLeft } from "react-icons/fi";
import { MdHowToVote } from "react-icons/md";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const election = await getPublicElectionById(id).catch(() => null);
  return {
    title: election ? `${election.title} — Results` : "Election Results",
    description: election
      ? `Live results for ${election.title} (${election.year})`
      : "Election results",
  };
}

export default async function PublicElectionResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [election, results] = await Promise.all([
    getPublicElectionById(id).catch(() => null),
    getElectionResults(id).catch(() => []),
  ]);

  if (!election) notFound();

  return (
    <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
      <VStack gap={6} alignItems="stretch" w="full">
        {/* ── Back + header ──────────────────────────────────── */}
        <VStack alignItems="flex-start" gap={3}>
          <Link href="/election-results">
            <HStack
              gap={1.5}
              color="gray.500"
              fontSize="sm"
              _hover={{ color: "gray.800" }}
              transition="color 0.15s"
            >
              <FiArrowLeft />
              <Text>All Elections</Text>
            </HStack>
          </Link>

          <HStack
            justify="space-between"
            align="flex-end"
            w="full"
            flexWrap="wrap"
            gap={3}
          >
            <VStack alignItems="flex-start" gap={0.5}>
              <HStack gap={2}>
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg="#eff9d1"
                  align="center"
                  justify="center"
                >
                  <MdHowToVote fontSize="1.2rem" color="#798217" />
                </Flex>
                <Heading
                  fontWeight="800"
                  fontSize={{ base: "xl", md: "2xl" }}
                  color="gray.900"
                  lineHeight="1.2"
                >
                  {election.title}
                </Heading>
                <Box
                  px={2}
                  py={0.5}
                  bg="#eff9d1"
                  color="#798217"
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight="700"
                >
                  {election.year}
                </Box>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                {new Date(election.electionDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </VStack>
          </HStack>
        </VStack>

        {/* ── Summary stats ──────────────────────────────────── */}
        <ResultsSummary results={results} />

        {/* ── Position-level results ─────────────────────────── */}
        <PositionResults results={results} />

        {/* ── Disclaimer ─────────────────────────────────────── */}
        <Box textAlign="center" pt={4}>
          <Text fontSize="xs" color="gray.400">
            Results are unofficial and updated in real-time as data is submitted
            from polling stations.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
