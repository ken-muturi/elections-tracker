import {
  Box, Heading, Text, VStack, HStack, SimpleGrid,
  Flex, Badge,
} from "@chakra-ui/react"
import Link from "next/link"
import { getElections } from "@/services/Elections"
import { FiCalendar, FiUsers, FiArrowRight, FiPlusCircle } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import { ElectionActions } from "@/components/Elections"

const statusCfg = {
  true:  { label: "Active",   bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  false: { label: "Inactive", bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
}

export default async function ElectionsPage() {
  const elections = await getElections().catch(() => [])

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Header */}
      <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
        <VStack alignItems="flex-start" gap={0.5}>
          <Heading fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} color="gray.900" lineHeight="1.2">
            Elections
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Each election is independent — candidates and results are scoped per year
          </Text>
        </VStack>
        <Link href="/elections/new">
          <HStack
            gap={2} px={4} py={2} bg="#0f172a" color="white"
            borderRadius="lg" fontSize="sm" fontWeight="600"
            _hover={{ bg: "#1e293b" }} transition="background 0.15s" cursor="pointer"
          >
            <FiPlusCircle fontSize="1rem" color="#C9D927" />
            <Text>New Election</Text>
          </HStack>
        </Link>
      </HStack>

      {elections.length === 0 ? (
        <Box
          bg="white" borderRadius="xl" p={12} textAlign="center"
          borderWidth="2px" borderStyle="dashed" borderColor="gray.200"
        >
          <Flex w={16} h={16} borderRadius="2xl" bg="#eff9d1" align="center" justify="center" mx="auto" mb={4}>
            <MdHowToVote fontSize="2rem" color="#798217" />
          </Flex>
          <Text fontWeight="700" fontSize="lg" color="gray.700" mb={1}>No elections yet</Text>
          <Text fontSize="sm" color="gray.400" mb={5}>
            Create your first election to start tracking results
          </Text>
          <Link href="/elections/new">
            <Box as="span" display="inline-block" px={5} py={2.5} bg="#C9D927" color="#0f172a"
              borderRadius="lg" fontWeight="700" fontSize="sm" cursor="pointer">
              Create Election
            </Box>
          </Link>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
          {elections.map((election) => {
            const cfg = statusCfg[String(election.isActive) as "true" | "false"]
            const totalCandidates = election.positions.reduce((s, p) => s + p.candidates.length, 0)
            return (
              <Box
                key={election.id}
                bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
                boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" h="full" overflow="hidden"
                transition="all 0.2s ease"
                _hover={{ boxShadow: "0 8px 25px -5px rgba(0,0,0,0.12)", transform: "translateY(-2px)", borderColor: "#C9D927" }}
              >
                <Link href={`/elections/${election.id}`}>
                  <Box p={5} pb={0} cursor="pointer">
                    <HStack justify="space-between" mb={3}>
                      <Flex w={10} h={10} borderRadius="lg" bg="#eff9d1" align="center" justify="center">
                        <MdHowToVote fontSize="1.2rem" color="#798217" />
                      </Flex>
                      <Badge
                        px={2.5} py={1} borderRadius="full" bg={cfg.bg} color={cfg.color}
                        fontSize="xs" fontWeight="700" display="flex" alignItems="center" gap={1.5}
                      >
                        <Box w="6px" h="6px" borderRadius="full" bg={cfg.dot} display="inline-block" />
                        {cfg.label}
                      </Badge>
                    </HStack>

                    <VStack alignItems="flex-start" gap={1} mb={3}>
                      <Text fontWeight="700" fontSize="sm" color="gray.900" lineHeight="1.4">
                        {election.title}
                      </Text>
                      <HStack gap={1}>
                        <Box
                          px={2} py={0.5} bg="#eff9d1" color="#798217"
                          borderRadius="md" fontSize="xs" fontWeight="700"
                          display="inline-block"
                        >
                          {election.year}
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>
                </Link>

                <HStack px={5} pt={3} pb={4} borderTopWidth="1px" borderTopColor="gray.100" justify="space-between">
                  <HStack gap={3}>
                    <HStack gap={1.5}>
                      <FiCalendar fontSize="0.75rem" color="#9ca3af" />
                      <Text fontSize="xs" color="gray.500">
                        {new Date(election.electionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </Text>
                    </HStack>
                    <HStack gap={1.5}>
                      <FiUsers fontSize="0.75rem" color="#9ca3af" />
                      <Text fontSize="xs" color="gray.500">
                        {totalCandidates} candidates · {election.positions.length} positions
                      </Text>
                    </HStack>
                  </HStack>
                  <ElectionActions election={election} variant="card" />
                </HStack>
              </Box>
            )
          })}
        </SimpleGrid>
      )}
    </VStack>
  )
}
