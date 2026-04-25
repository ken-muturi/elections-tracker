import { Box, Text, HStack, SimpleGrid } from "@chakra-ui/react"
import { WardData } from "@/services/Hesabu"

type Props = { ward: WardData }

const Dot = ({ color }: { color: string }) => (
  <Box w="8px" h="8px" borderRadius="full" bg={color} flexShrink={0} />
)

const DotBar = ({ value, color }: { value: number; color: string }) => {
  const total = 10
  const filled = Math.round((value / 100) * total)
  return (
    <HStack gap="3px">
      {Array.from({ length: total }).map((_, i) => (
        <Box
          key={i}
          w="16px"
          h="6px"
          borderRadius="sm"
          bg={i < filled ? color : "whiteAlpha.100"}
        />
      ))}
    </HStack>
  )
}

export const WardCard = ({ ward }: Props) => {
  const completionRate =
    ward.totalProjects > 0
      ? (ward.completedProjects / ward.totalProjects) * 100
      : 0

  const completionColor =
    completionRate >= 70 ? "#0d9488" : completionRate >= 50 ? "#f59e0b" : "#ef4444"
  const satisfactionColor =
    ward.citizenSatisfactionScore >= 70
      ? "#0d9488"
      : ward.citizenSatisfactionScore >= 50
      ? "#f59e0b"
      : "#ef4444"

  const isLowSatisfaction = ward.citizenSatisfactionScore < 50

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={isLowSatisfaction ? "red.200" : "gray.200"}
      borderRadius="xl"
      p={5}
      boxShadow="sm"
    >
      {/* Header */}
      <Text fontWeight="bold" color="gray.900" fontSize="md" mb={0.5}>
        {ward.name}
      </Text>
      <Text fontSize="xs" color="gray.400" mb={4}>
        {ward.subCounty} Sub-County &bull; Pop: {ward.population.toLocaleString()}
      </Text>

      {/* Stats grid */}
      <SimpleGrid columns={2} gap={1} mb={4}>
        <HStack gap={2}>
          <Dot color="#3b82f6" />
          <Text fontSize="xs" color="gray.600">Total: <b>{ward.totalProjects}</b></Text>
        </HStack>
        <HStack gap={2}>
          <Dot color="#0d9488" />
          <Text fontSize="xs" color="gray.600">Done: <b>{ward.completedProjects}</b></Text>
        </HStack>
        <HStack gap={2}>
          <Dot color="#f59e0b" />
          <Text fontSize="xs" color="gray.600">Pending: <b>{ward.pendingProjects}</b></Text>
        </HStack>
        <HStack gap={2}>
          <Dot color="#ef4444" />
          <Text fontSize="xs" color="gray.600">Stalled: <b>{ward.stalledProjects}</b></Text>
        </HStack>
      </SimpleGrid>

      {/* Completion bar */}
      <Box mb={3}>
        <HStack justify="space-between" mb={1}>
          <Text fontSize="xs" color="gray.400">Completion</Text>
          <Text fontSize="xs" fontWeight="bold" color={completionColor}>
            {completionRate.toFixed(0)}%
          </Text>
        </HStack>
        <Box bg="gray.100" borderRadius="full" h="6px">
          <Box
            h="full"
            bg={completionColor}
            borderRadius="full"
            style={{ width: `${completionRate}%`, transition: "width 0.6s ease" }}
          />
        </Box>
      </Box>

      {/* Satisfaction dots */}
      <HStack justify="space-between">
        <HStack gap={2}>
          <Text fontSize="xs" color="gray.400">Satisfaction:</Text>
          <DotBar value={ward.citizenSatisfactionScore} color={satisfactionColor} />
        </HStack>
        <Text fontSize="xs" fontWeight="bold" color={satisfactionColor}>
          {ward.citizenSatisfactionScore}%
        </Text>
      </HStack>
    </Box>
  )
}
