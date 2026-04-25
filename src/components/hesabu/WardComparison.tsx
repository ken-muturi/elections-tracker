import { Box, Text, SimpleGrid } from "@chakra-ui/react"
import { CountyFull } from "@/services/Hesabu"
import { WardCard } from "./WardCard"
import { EquityAlert } from "./EquityAlert"

type Props = { county: CountyFull }

export const WardComparison = ({ county }: Props) => {
  return (
    <Box>
      <Text fontWeight="bold" color="gray.700" fontSize="md" mb={4}>
        Ward-by-Ward Project Delivery
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} mb={6}>
        {county.wards.map((ward) => (
          <WardCard key={ward.id} ward={ward} />
        ))}
      </SimpleGrid>

      <EquityAlert wards={county.wards} />
    </Box>
  )
}
