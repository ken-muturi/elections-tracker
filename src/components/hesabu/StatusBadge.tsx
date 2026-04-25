import { Badge } from "@chakra-ui/react"
import { HReportStatus } from "@/services/Hesabu"

const STATUS_MAP: Record<
  HReportStatus,
  { label: string; colorScheme: string; bg: string; color: string }
> = {
  UNRESOLVED: { label: "Unresolved", colorScheme: "red", bg: "#E63946", color: "#fff" },
  INVESTIGATING: { label: "Investigating", colorScheme: "yellow", bg: "#E9C46A", color: "#0B0F1A" },
  RESOLVED: { label: "Resolved", colorScheme: "teal", bg: "#2A9D8F", color: "#fff" },
}

export const StatusBadge = ({ status }: { status: HReportStatus }) => {
  const s = STATUS_MAP[status]
  return (
    <Badge
      px={2}
      py={0.5}
      borderRadius="full"
      fontSize="xs"
      fontWeight="bold"
      bg={s.bg}
      color={s.color}
      textTransform="uppercase"
      letterSpacing="wide"
    >
      {s.label}
    </Badge>
  )
}
