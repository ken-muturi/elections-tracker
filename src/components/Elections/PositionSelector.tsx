"use client";

import { useState, useEffect, useRef } from "react";
import { Box, HStack, Flex, Spinner, Text } from "@chakra-ui/react";
import { getElectionResultsByPosition } from "@/services/LevelResults";
import { POSITION_ORDER } from "./constants";
import PositionResults from "./PositionResults";
import type { PositionSummary, ResultStat } from "./ResultsSummary";

type PositionSelectorProps = {
  summaries: PositionSummary[];
  electionId: string;
  /** Optional server-prefetched results, keyed by positionId, to avoid the initial loading spinner. */
  prefetchedResults?: Record<string, ResultStat>;
};

export default function PositionSelector({
  summaries,
  electionId,
  prefetchedResults,
}: PositionSelectorProps) {
  const sorted = [...summaries].sort(
    (a, b) =>
      POSITION_ORDER.indexOf(a.positionType) -
      POSITION_ORDER.indexOf(b.positionType),
  );

  const [selectedId, setSelectedId] = useState(sorted[0]?.positionId ?? "");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Seed the cache with any server-prefetched results to avoid the initial spinner
  const cacheRef = useRef<Record<string, ResultStat>>(prefetchedResults ?? {});
  const [cachedIds, setCachedIds] = useState<Set<string>>(
    new Set(Object.keys(prefetchedResults ?? {})),
  );
  const inFlightRef = useRef<Set<string>>(new Set());
  const bgPrefetchFired = useRef(false);

  const addToCache = (id: string, result: ResultStat) => {
    cacheRef.current[id] = result;
    setCachedIds((prev) => new Set([...prev, id]));
  };

  const fetchPosition = async (positionId: string, background = false) => {
    if (
      !electionId ||
      cacheRef.current[positionId] ||
      inFlightRef.current.has(positionId)
    )
      return;
    inFlightRef.current.add(positionId);
    if (!background) setLoadingId(positionId);
    try {
      const result = await getElectionResultsByPosition(electionId, positionId);
      if (result) addToCache(positionId, result);
    } catch {
      // silent for background fetches
    } finally {
      inFlightRef.current.delete(positionId);
      if (!background) setLoadingId(null);
    }
  };

  // Load the first position on mount
  useEffect(() => {
    if (sorted[0]) fetchPosition(sorted[0].positionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background-prefetch remaining positions after the first one loads
  useEffect(() => {
    if (cachedIds.size >= 1 && !bgPrefetchFired.current) {
      bgPrefetchFired.current = true;
      sorted
        .filter((p) => !cacheRef.current[p.positionId])
        .forEach((p) => fetchPosition(p.positionId, true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedIds.size]);

  const handleSelect = (positionId: string) => {
    setSelectedId(positionId);
    fetchPosition(positionId);
  };

  const selectedResult = cacheRef.current[selectedId];
  const isLoading = loadingId === selectedId && !selectedResult;

  return (
    <Box>
      {/* Position tab strip */}
      <Box
        overflowX="auto"
        pb={1}
        mb={5}
        css={{ "&::-webkit-scrollbar": { display: "none" } }}
      >
        <HStack gap={2} w="max-content">
          {sorted.map((position) => {
            const isActive = position.positionId === selectedId;
            const isCached = cachedIds.has(position.positionId);
            const isLoadingThis =
              inFlightRef.current.has(position.positionId) && !isCached;

            return (
              <Flex
                key={position.positionId}
                as="button"
                onClick={() => handleSelect(position.positionId)}
                align="center"
                gap={1.5}
                px={4}
                py={2}
                borderRadius="full"
                fontSize="sm"
                fontWeight="700"
                cursor="pointer"
                transition="all 0.15s"
                bg={isActive ? "#C9D927" : "white"}
                color={isActive ? "#0f172a" : "gray.500"}
                borderWidth="1px"
                borderColor={isActive ? "#C9D927" : "gray.200"}
                _hover={
                  isActive
                    ? {}
                    : { bg: "#eff9d1", borderColor: "#C9D927", color: "gray.800" }
                }
                whiteSpace="nowrap"
              >
                {position.positionTitle}

                {isLoadingThis && (
                  <Spinner
                    size="xs"
                    color={isActive ? "rgba(0,0,0,0.4)" : "gray.400"}
                  />
                )}

                {position.streamStats.totalVotes > 0 && !isLoadingThis && (
                  <Box
                    as="span"
                    px={1.5}
                    py={0.5}
                    borderRadius="full"
                    fontSize="10px"
                    fontWeight="800"
                    bg={isActive ? "rgba(0,0,0,0.12)" : "#eff9d1"}
                    color={isActive ? "#0f172a" : "#798217"}
                  >
                    {position.streamStats.totalVotes.toLocaleString()}
                  </Box>
                )}
              </Flex>
            );
          })}
        </HStack>
      </Box>

      {/* Results panel */}
      {isLoading ? (
        <Box
          bg="white"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="gray.100"
          p={16}
          textAlign="center"
        >
          <Flex direction="column" align="center" gap={3} color="gray.400">
            <Spinner size="md" />
            <Text fontSize="sm">Loading results…</Text>
          </Flex>
        </Box>
      ) : (
        <PositionResults
          results={selectedResult ? [selectedResult] : []}
          electionId={electionId}
        />
      )}
    </Box>
  );
}
