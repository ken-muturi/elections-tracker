/**
 * Reusable election card component — used in both the admin
 * elections list and the public election-results list.
 */
import {
  Box, Text, HStack, Flex, Badge,
} from "@chakra-ui/react"
import Link from "next/link"
import { FiCalendar, FiUsers, FiArrowRight } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"

type ElectionCardProps = {
  election: {
    id: string
    title: string
    year: number
    isActive: boolean
    electionDate: Date | string
    positions: { candidates: unknown[] }[]
  }
  /** Base path for the card link, e.g. "/elections" or "/election-results" */
  basePath: string
}

const statusCfg = {
  true:  { label: "Active",   bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  false: { label: "Inactive", bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
}

export default function ElectionCard({ election, basePath }: ElectionCardProps) {
  const cfg = statusCfg[String(election.isActive) as "true" | "false"]
  const totalCandidates = election.positions.reduce(
    (s, p) => s + p.candidates.length,
    0,
  )

  return (
    <Link href={`${basePath}/${election.id}`}>
      <Box
        bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100"
        boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" cursor="pointer" h="full"
        transition="all 0.2s ease"
        _hover={{
          boxShadow: "0 8px 25px -5px rgba(0,0,0,0.12)",
          transform: "translateY(-2px)",
          borderColor: "#C9D927",
        }}
      >
        <HStack justify="space-between" mb={3}>
          <Flex w={10} h={10} borderRadius="lg" bg="#eff9d1" align="center" justify="center">
            <MdHowToVote fontSize="1.2rem" color="#798217" />
          </Flex>
          <HStack gap={2}>
            <Badge
              px={2.5} py={1} borderRadius="full" bg={cfg.bg} color={cfg.color}
              fontSize="xs" fontWeight="700" display="flex" alignItems="center" gap={1.5}
            >
              <Box w="6px" h="6px" borderRadius="full" bg={cfg.dot} display="inline-block" />
              {cfg.label}
            </Badge>
            <Flex w={7} h={7} borderRadius="md" bg="gray.50" align="center" justify="center">
              <FiArrowRight fontSize="0.85rem" color="#9ca3af" />
            </Flex>
          </HStack>
        </HStack>

        <Box mb={3}>
          <Text fontWeight="700" fontSize="sm" color="gray.900" lineHeight="1.4" mb={1}>
            {election.title}
          </Text>
          <Box
            px={2} py={0.5} bg="#eff9d1" color="#798217"
            borderRadius="md" fontSize="xs" fontWeight="700"
            display="inline-block"
          >
            {election.year}
          </Box>
        </Box>

        <HStack pt={3} borderTopWidth="1px" borderTopColor="gray.100" justify="space-between">
          <HStack gap={1.5}>
            <FiCalendar fontSize="0.75rem" color="#9ca3af" />
            <Text fontSize="xs" color="gray.500">
              {new Date(election.electionDate).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </Text>
          </HStack>
          <HStack gap={1.5}>
            <FiUsers fontSize="0.75rem" color="#9ca3af" />
            <Text fontSize="xs" color="gray.500">
              {totalCandidates} candidates · {election.positions.length} positions
            </Text>
          </HStack>
        </HStack>
      </Box>
    </Link>
  )
}
