import { Box, Text } from "@chakra-ui/react"
import { ProjectCardSummary, projectLine } from "./project-format"

type Props = { summary?: ProjectCardSummary; onOpen: () => void }

export const CountyWideCard = ({ summary, onOpen }: Props) => (
  <Box
    bg="gray.50"
    border="1px dashed"
    borderColor="gray.300"
    borderRadius="xl"
    p={5}
    boxShadow="sm"
    display="flex"
    flexDirection="column"
    justifyContent="space-between"
  >
    <Box>
      <Text fontWeight="bold" color="gray.900" fontSize="md" mb={0.5}>
        County-wide / location not stated
      </Text>
      <Text fontSize="xs" color="gray.500" mb={4}>
        Projects that cover the whole county, or whose documents don&apos;t name a ward or constituency.
      </Text>
    </Box>
    <Box
      as={summary?.count ? "button" : "div"}
      textAlign="left"
      cursor={summary?.count ? "pointer" : "default"}
      onClick={summary?.count ? onOpen : undefined}
    >
      <Text fontSize="xs" fontWeight="semibold" color={summary?.count ? "teal.600" : "gray.400"}>
        {projectLine(summary)}
        {summary?.count ? " →" : ""}
      </Text>
    </Box>
  </Box>
)
