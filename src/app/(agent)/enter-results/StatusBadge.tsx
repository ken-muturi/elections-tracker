import { HStack, Text } from "@chakra-ui/react"
import { STATUS_STYLES } from "./constants"

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
  return (
    <HStack gap={1} px={2} py={0.5} borderRadius="full" bg={s.bg}>
      {s.icon}
      <Text fontSize="10px" fontWeight="700" color={s.color}>
        {s.label}
      </Text>
    </HStack>
  )
}
