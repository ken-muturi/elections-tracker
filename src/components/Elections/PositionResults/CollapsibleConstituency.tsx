"use client";

import { useState } from "react";
import { Box, SimpleGrid, HStack, Text } from "@chakra-ui/react"
import { FiChevronDown } from "react-icons/fi"
import type { ConstituencyGroup, LcColors } from "./types"
import EntityCard from "./EntityCard"

type ExploreProps = { electionId: string; positionId: string; aggregationLevel: string }

export default function CollapsibleConstituency({
  constGroup,
  lc,
  exploreProps,
}: {
  constGroup: ConstituencyGroup;
  lc: LcColors;
  exploreProps?: ExploreProps;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box borderWidth="1px" borderColor="gray.100" borderRadius="lg" overflow="hidden">
      <HStack
        px={4} py={2}
        bg="gray.50"
        cursor="pointer"
        userSelect="none"
        onClick={() => setIsOpen((o) => !o)}
        justify="space-between"
        _hover={{ bg: "gray.100" }}
        transition="background 0.1s"
      >
        <HStack gap={2}>
          <Box w={1.5} h={3} bg={lc.border} borderRadius="full" />
          <Text fontSize="9px" fontWeight="700" color="gray.500"
            textTransform="uppercase" letterSpacing="wide">
            {constGroup.constituencyName}
          </Text>
          <Box
            px={1.5} py={0.5} borderRadius="full"
            bg={lc.bg} fontSize="9px" fontWeight="700" color={lc.color}
          >
            {constGroup.entities.length}
          </Box>
        </HStack>
        <Box
          color="gray.400"
          transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
          transition="transform 0.2s"
        >
          <FiChevronDown fontSize="0.8rem" />
        </Box>
      </HStack>

      {isOpen && (
        <Box p={3}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
            {constGroup.entities.map((entity) => (
              <EntityCard
                key={entity.entityId} entity={entity} lc={lc}
                exploreHref={exploreProps
                  ? `/election-results/${exploreProps.electionId}/drill/${exploreProps.positionId}?entityId=${entity.entityId}&entityLevel=${exploreProps.aggregationLevel}`
                  : undefined}
              />
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
}
