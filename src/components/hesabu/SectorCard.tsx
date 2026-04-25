import { Box, Text, HStack } from "@chakra-ui/react"
import { SectorData } from "@/services/Hesabu"

type Props = { sector: SectorData; totalBudget: bigint }

const fmtM = (n: bigint) => {
  const v = Number(n)
  return v >= 1_000_000_000
    ? `KSh ${(v / 1_000_000_000).toFixed(2)}B`
    : `KSh ${(v / 1_000_000).toFixed(0)}M`
}

const getAbsorptionColor = (rate: number) =>
  rate >= 75 ? "#2A9D8F" : rate >= 55 ? "#E9C46A" : "#E63946"

export const SectorCard = ({ sector, totalBudget }: Props) => {
  const absorption =
    Number(sector.allocatedAmount) > 0
      ? (Number(sector.spentAmount) / Number(sector.allocatedAmount)) * 100
      : 0
  const pctOfTotal =
    Number(totalBudget) > 0
      ? ((Number(sector.allocatedAmount) / Number(totalBudget)) * 100).toFixed(1)
      : "0"
  const color = getAbsorptionColor(absorption)
  const isLowAbsorption = absorption < 55
  const unspent = sector.allocatedAmount - sector.spentAmount

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderLeft="4px solid"
      borderLeftColor={color}
      borderRadius="lg"
      p={4}
      mb={2}
      boxShadow="sm"
    >
      <HStack justify="space-between" align="flex-start" mb={2}>
        {/* Left: icon + name + meta */}
        <HStack gap={3} flex={1}>
          <Box
            w="36px"
            h="36px"
            bg="gray.100"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="lg"
            flexShrink={0}
          >
            {sector.icon ?? "📋"}
          </Box>
          <Box>
            <Text fontWeight="bold" color="gray.800" fontSize="sm">
              {sector.name}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {fmtM(sector.spentAmount)} of {fmtM(sector.allocatedAmount)} &bull; {pctOfTotal}% of total
            </Text>
          </Box>
        </HStack>
        {/* Right: absorption rate */}
        <Text
          fontWeight="bold"
          fontSize="xl"
          color={color}
          flexShrink={0}
        >
          {absorption.toFixed(0)}%
        </Text>
      </HStack>

      {/* Progress bar */}
      <Box bg="gray.100" borderRadius="full" h="6px" mb={2}>
        <Box
          h="full"
          bg={color}
          borderRadius="full"
          style={{ width: `${Math.min(absorption, 100)}%`, transition: "width 0.6s ease" }}
        />
      </Box>

      {/* Description */}
      {sector.description && (
        <Text fontSize="xs" color="gray.400" mb={isLowAbsorption ? 2 : 0}>
          {sector.description}
        </Text>
      )}

      {/* Low absorption alert */}
      {isLowAbsorption && (
        <HStack gap={2} mt={1}>
          <Text fontSize="xs">⚠️</Text>
          <Text fontSize="xs" color="red.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
            Low Absorption
          </Text>
          <Text fontSize="xs" color="red.400">
            &mdash; {fmtM(unspent)} unspent
          </Text>
        </HStack>
      )}
    </Box>
  )
}
