"use client"

import { Box, Text, HStack, VStack } from "@chakra-ui/react"
import { ReportData } from "@/services/Hesabu"
import { StatusBadge } from "./StatusBadge"

type Props = {
  report: ReportData
  onVote?: (reportId: string) => void
  hasVoted?: boolean
}

export const ReportCard = ({ report, onVote, hasVoted }: Props) => {
  const date = new Date(report.createdAt).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      p={4}
      _hover={{ borderColor: "gray.300", boxShadow: "sm" }}
      transition="all 0.2s"
    >
      <HStack gap={4} align="center">
        {/* Vote column */}
        <VStack
          gap={0}
          align="center"
          minW="48px"
          cursor={hasVoted ? "default" : "pointer"}
          onClick={() => !hasVoted && onVote?.(report.id)}
          opacity={hasVoted ? 0.4 : 1}
          _hover={!hasVoted ? { opacity: 0.7 } : {}}
          transition="opacity 0.2s"
        >
          <Text fontSize="lg" color={hasVoted ? "gray.300" : "#0f172a"} lineHeight={1}>
            ▲
          </Text>
          <Text
            fontWeight="bold"
            fontSize="xl"
            color={hasVoted ? "gray.300" : "#0f172a"}
            lineHeight={1}
          >
            {report.votes}
          </Text>
        </VStack>

        {/* Content */}
        <Box flex={1}>
          <HStack gap={2} mb={1} flexWrap="wrap">
            <StatusBadge status={report.status} />
            <Text fontSize="xs" color="gray.400">
              {report.ward.name} &bull; {report.sector.name}
            </Text>
          </HStack>
          <Text fontWeight="semibold" color="gray.800" fontSize="sm" mb={1}>
            {report.title}
          </Text>
          <Text fontSize="xs" color="gray.400">
            Reported: {date}
          </Text>
        </Box>
      </HStack>
    </Box>
  )
}
