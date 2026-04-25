"use client";

import { useState } from "react";
import { Box, VStack, HStack, Text, SimpleGrid } from "@chakra-ui/react"
import { FiChevronDown } from "react-icons/fi"
import type { CountyGroup, LcColors } from "./types"
import CollapsibleConstituency from "./CollapsibleConstituency"
import EntityCard from "./EntityCard"

type ExploreProps = { electionId: string; positionId: string; aggregationLevel: string }

export default function CollapsibleCounty({
  countyGroup,
  lc,
  exploreProps,
}: {
  countyGroup: CountyGroup;
  lc: LcColors;
  exploreProps?: ExploreProps;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const entityCount = countyGroup.constituencies.reduce(
    (s, c) => s + c.entities.length, 0,
  );

  return (
    <Box borderWidth="1px" borderColor="gray.100" borderRadius="xl" overflow="hidden">
      <HStack
        px={4} py={2.5}
        bg="gray.100"
        cursor="pointer"
        userSelect="none"
        onClick={() => setIsOpen((o) => !o)}
        justify="space-between"
        _hover={{ bg: "gray.200" }}
        transition="background 0.1s"
      >
        <HStack gap={2}>
          <Box w={2} h={4} bg="gray.400" borderRadius="full" />
          <Text fontSize="9px" fontWeight="800" color="gray.500"
            textTransform="uppercase" letterSpacing="widest">
            {countyGroup.countyName}
          </Text>
          <Box
            px={1.5} py={0.5} borderRadius="full"
            bg="gray.200" fontSize="9px" fontWeight="700" color="gray.500"
          >
            {entityCount}
          </Box>
        </HStack>
        <Box
          color="gray.400"
          transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
          transition="transform 0.2s"
        >
          <FiChevronDown fontSize="0.85rem" />
        </Box>
      </HStack>

      {isOpen && (
        <Box p={4}>
          <VStack gap={3} alignItems="stretch">
            {countyGroup.constituencies.map((constGroup) =>
              constGroup.constituencyName ? (
                <CollapsibleConstituency
                  key={constGroup.constituencyName}
                  constGroup={constGroup}
                  lc={lc}
                  exploreProps={exploreProps}
                />
              ) : (
                <SimpleGrid key="direct" columns={{ base: 1, md: 2 }} gap={3}>
                  {constGroup.entities.map((entity) => (
                    <EntityCard
                      key={entity.entityId} entity={entity} lc={lc}
                      exploreHref={exploreProps
                        ? `/election-results/${exploreProps.electionId}/drill/${exploreProps.positionId}?entityId=${entity.entityId}&entityLevel=${exploreProps.aggregationLevel}`
                        : undefined}
                    />
                  ))}
                </SimpleGrid>
              ),
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
