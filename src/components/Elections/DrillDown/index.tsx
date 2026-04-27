"use client"

import React, { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import {
  Box, VStack, HStack, Text, Heading, SimpleGrid, Flex, Badge, Spinner,
} from "@chakra-ui/react"
import { FiChevronRight, FiMapPin, FiChevronLeft, FiMap, FiList } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"

// Leaflet uses browser-only APIs — load it client-side only
const DrillMap = dynamic(() => import("./DrillMap"), { ssr: false, loading: () => (
  <Flex h="420px" borderRadius="2xl" bg="gray.50" borderWidth="1px" borderColor="gray.100"
    align="center" justify="center">
    <Spinner size="md" color="#798217" />
  </Flex>
) })
import type { DrillDownResult } from "@/services/PublicResults"
import {
  getDrillDownNational,
  getDrillDownCounty,
  getDrillDownConstituency,
  getDrillDownWard,
  getDrillDownStation,
} from "@/services/PublicResults"
import { LEVEL_COLOR, NEXT_ACTION } from "../constants";
import useSyncMutation from "@/hooks/hooks/useSyncMutation"
import LeadersCard from "./LeadersCard"
import ChildCard from "./ChildCard"
import { buildColorMap } from "./candidateColors"
import FullPageLoader from "@/components/Generic/FullPageLoader"

const DRILL_FN: Record<
  string,
  (electionId: string, positionId: string, id: string) => Promise<DrillDownResult>
> = {
  COUNTY: getDrillDownCounty,
  CONSTITUENCY: getDrillDownConstituency,
  WARD: getDrillDownWard,
  STATION: getDrillDownStation,
}

type Crumb = DrillDownResult["breadcrumb"][number]

export default function DrillDown({
  initial,
  electionId,
}: {
  initial: DrillDownResult
  electionId: string
}) {
  const [data, setData] = useState<DrillDownResult>(initial)
  const [view, setView] = useState<"cards" | "map">("map");

  const navMutation = useSyncMutation(
    async (fn: () => Promise<DrillDownResult>) => fn(),
    { onSuccess: setData },
  )

  const drill = (childId: string) => {
    const nextAction = NEXT_ACTION[data.level]
    const fn = nextAction ? DRILL_FN[nextAction] : undefined
    if (!fn) return
    navMutation.mutate(() => fn(electionId, data.positionId, childId))
  }

  const navigateTo = (crumb: Crumb) => {
    if (crumb.level === "NATIONAL") {
      navMutation.mutate(() => getDrillDownNational(electionId, data.positionId))
    } else {
      const fn = DRILL_FN[crumb.level]
      if (fn) navMutation.mutate(() => fn(electionId, data.positionId, crumb.id))
    }
  }

  // Ancestors = all breadcrumb entries except the last (current), skipping the
  // synthetic "National" root since the position title already serves as the root.
  const ancestors = data.breadcrumb.slice(0, -1).filter((c) => c.level !== "NATIONAL")
  const parentCrumb = data.breadcrumb.length > 1
    ? data.breadcrumb[data.breadcrumb.length - 2]
    : null

  const canDrill = !!NEXT_ACTION[data.level]
  const lc = LEVEL_COLOR[data.level] ?? LEVEL_COLOR.NATIONAL
  const colorMap = useMemo(() => buildColorMap(data.candidates), [data.candidates])

  return (
    <VStack gap={5} align="stretch">
      {/* ── Breadcrumb ──────────────────────────────────── */}
      <HStack gap={1} flexWrap="wrap">
        {/* Position title — always first, clicking returns to national view */}
        <HStack gap={1}>
          <Text
            as="button"
            fontSize="sm"
            color="blue.600"
            fontWeight="600"
            cursor="pointer"
            _hover={{ textDecoration: "underline" }}
            _focus={{
              outline: "2px solid",
              outlineColor: "blue.500",
              outlineOffset: "2px",
              borderRadius: "2px",
            }}
            onClick={() =>
              navigateTo({
                id: "national",
                name: "National",
                level: "NATIONAL",
              })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigateTo({
                  id: "national",
                  name: "National",
                  level: "NATIONAL",
                });
              }
            }}
          >
            {data.positionTitle}
          </Text>
          <FiChevronRight
            fontSize="0.75rem"
            color="#9ca3af"
            aria-hidden="true"
          />
        </HStack>

        {/* Geographic ancestors (county → constituency → ward …) */}
        {ancestors.map((crumb) => (
          <HStack key={crumb.id} gap={1}>
            <Text
              as="button"
              fontSize="sm"
              color="blue.600"
              fontWeight="600"
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
              _focus={{
                outline: "2px solid",
                outlineColor: "blue.500",
                outlineOffset: "2px",
                borderRadius: "2px",
              }}
              onClick={() => navigateTo(crumb)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigateTo(crumb);
                }
              }}
            >
              {crumb.name}
            </Text>
            <FiChevronRight
              fontSize="0.75rem"
              color="#9ca3af"
              aria-hidden="true"
            />
          </HStack>
        ))}

        {/* Current level — not clickable */}
        <Text fontSize="sm" fontWeight="700" color="gray.800">
          {data.parentName ?? "All"}
        </Text>
      </HStack>

      {/* ── Header ──────────────────────────────────────── */}
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        <HStack gap={3}>
          <Flex
            w={10}
            h={10}
            borderRadius="lg"
            bg={lc.bg}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <MdHowToVote fontSize="1.2rem" color={lc.color} />
          </Flex>
          <VStack align="flex-start" gap={0}>
            <Heading fontSize="lg" fontWeight="800" color="gray.900">
              {data.positionTitle}
            </Heading>
            <Text fontSize="xs" color="gray.500">
              Showing {data.levelLabel.toLowerCase()} · {data.reportedStreams}/
              {data.totalStreams} streams reporting
            </Text>
          </VStack>
        </HStack>
        <Badge
          px={2.5}
          py={1}
          borderRadius="full"
          bg={lc.bg}
          color={lc.color}
          fontSize="9px"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="wide"
        >
          {data.levelLabel}
        </Badge>
      </HStack>

      {/* ── Overall leaders ─────────────────────────────── */}
      <LeadersCard data={data} lc={lc} colorMap={colorMap} />

      {/* ── Location context (clickable back) — only when drilled in ── */}
      {data.parentName && (
        <HStack
          px={4}
          py={2}
          bg={lc.bg}
          borderRadius="xl"
          gap={2}
          cursor={parentCrumb ? "pointer" : "default"}
          _hover={parentCrumb ? { opacity: 0.8 } : {}}
          transition="opacity 0.15s"
          onClick={parentCrumb ? () => navigateTo(parentCrumb) : undefined}
          role={parentCrumb ? "button" : undefined}
        >
          {parentCrumb && <FiChevronLeft fontSize="0.9rem" color={lc.color} />}
          <FiMapPin fontSize="0.8rem" color={lc.color} />
          <Text fontSize="sm" fontWeight="700" color={lc.color}>
            {data.parentName}
          </Text>
          <Text fontSize="xs" color={lc.color} opacity={0.7}>
            — {data.children.length} {data.levelLabel.toLowerCase()}
          </Text>
        </HStack>
      )}

      {/* ── Card: subtitle + toggle + children/map ─────── */}
      <Box
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.100"
        boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        bg="white"
        overflow="hidden"
      >
        {/* Subtitle + toggle row */}
        <HStack
          justify="space-between"
          align="center"
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor="gray.100"
        >
          <Text fontSize="xs" color="gray.500">
            {data.children.length} {data.levelLabel.toLowerCase()} ·{" "}
            {data.reportedStreams}/{data.totalStreams} streams reporting
          </Text>
          <HStack gap={1} p={1} bg="gray.100" borderRadius="full">
            {(["map", "cards"] as const).map((v) => (
              <HStack
                key={v}
                as="button"
                aria-pressed={view === v}
                aria-label={v === "cards" ? "Details view" : "Map view"}
                gap={1.5}
                px={3}
                py={1.5}
                borderRadius="full"
                bg={view === v ? "white" : "transparent"}
                color={view === v ? "gray.800" : "gray.400"}
                fontSize="xs"
                fontWeight="700"
                cursor="pointer"
                boxShadow={view === v ? "sm" : "none"}
                transition="all 0.15s"
                _focus={{
                  outline: "2px solid",
                  outlineColor: "blue.500",
                  outlineOffset: "2px",
                }}
                onClick={() => setView(v)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setView(v);
                  }
                }}
              >
                {v === "cards" ? (
                  <FiList fontSize="0.75rem" aria-hidden="true" />
                ) : (
                  <FiMap fontSize="0.75rem" aria-hidden="true" />
                )}
                <Text textTransform="capitalize">
                  {v === "cards" ? "Details" : "Map"}
                </Text>
              </HStack>
            ))}
          </HStack>
        </HStack>

        {/* ── Children — cards or map ─────────────────────── */}
        <Box position="relative">
          {navMutation.isPending && <FullPageLoader />}

          {view === "map" ? (
            <Box
              opacity={navMutation.isPending ? 0.4 : 1}
              transition="opacity 0.15s"
            >
              <DrillMap
                data={data}
                lc={lc}
                colorMap={colorMap}
                onDrill={drill}
              />
            </Box>
          ) : data.children.length === 0 ? (
            <Flex
              h="160px"
              bg="gray.50"
              align="center"
              justify="center"
              direction="column"
              gap={2}
              opacity={navMutation.isPending ? 0.4 : 1}
            >
              <Text fontSize="sm" color="gray.400" fontWeight="600">
                No results reported yet for this area
              </Text>
              <Text fontSize="xs" color="gray.300">
                Data will appear as polling stations submit results
              </Text>
            </Flex>
          ) : (
            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              gap={4}
              p={4}
              opacity={navMutation.isPending ? 0.4 : 1}
              transition="opacity 0.15s"
            >
              {data.children.map((child) => (
                <ChildCard
                  key={child.entityId}
                  child={child}
                  canDrill={canDrill}
                  lc={lc}
                  colorMap={colorMap}
                  childLevel={NEXT_ACTION[data.level] ?? data.level}
                  positionType={data.positionType}
                  onDrill={drill}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Box>

      {data.rejectedVotes > 0 && (
        <Box
          px={5}
          py={3}
          bg="#fef9f0"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="#fef3c7"
        >
          <Text fontSize="xs" color="#92400e">
            {data.rejectedVotes.toLocaleString()} rejected votes not counted
            above
          </Text>
        </Box>
      )}
    </VStack>
  );
}
