"use client"

import { useState, useMemo } from "react"
import {
  Box, Text, HStack, VStack, Badge, Input, Flex,
} from "@chakra-ui/react"
import { FiSearch, FiFilter } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import { LEVEL_COLOR } from "@/components/Elections/constants"
import {
  getFormTypeForLevel,
  POSITION_TALLY_LEVELS,
  AGGREGATION_LEVEL_LABEL,
} from "@/constants/elections"
import type { AggregationLevel, Candidate as PrismaCandidate } from "@prisma/client"
import CandidateManager from "./CandidateManager"
import type { Party } from "@/services/Parties"

type Candidate = PrismaCandidate


type Position = {
  id: string
  title: string
  type: string
  aggregationLevel: AggregationLevel
  candidates: Candidate[]
}

const TALLY_LEVELS: AggregationLevel[] = ["WARD", "CONSTITUENCY", "COUNTY", "NATIONAL"]

const LEVEL_BADGE_COLOR: Record<string, { bg: string; color: string }> = {
  WARD:         { bg: "#f0fdf4", color: "#166534" },
  CONSTITUENCY: { bg: "#dbeafe", color: "#1e40af" },
  COUNTY:       { bg: "#fce7f3", color: "#9d174d" },
  NATIONAL:     { bg: "#fef3c7", color: "#92400e" },
}

export default function CandidatesFilter({ positions, parties }: { positions: Position[]; parties: Party[] }) {
  const [search, setSearch]           = useState("")
  const [activeLevel, setActiveLevel] = useState<AggregationLevel | "ALL">("ALL")
  const [activeType, setActiveType]   = useState<string>("ALL")

  // Unique position type keys present in this election
  const positionTypes = useMemo(
    () => [
      "ALL",
      ...Array.from(new Set(positions.map((p) => p.type.toUpperCase().replace(/\s+/g, "_")))),
    ],
    [positions],
  )

  // Available tally levels for this election's positions
  const availableLevels = useMemo(
    () =>
      TALLY_LEVELS.filter((lvl) =>
        positions.some((p) => {
          const key = p.type.toUpperCase().replace(/\s+/g, "_")
          return (POSITION_TALLY_LEVELS[key] ?? []).includes(lvl)
        }),
      ),
    [positions],
  )

  const filtered = useMemo(
    () =>
      positions.filter((p) => {
        const typeKey    = p.type.toUpperCase().replace(/\s+/g, "_")
        const matchType  = activeType  === "ALL" || typeKey === activeType
        const matchLevel =
          activeLevel === "ALL" ||
          (POSITION_TALLY_LEVELS[typeKey] ?? []).includes(activeLevel as AggregationLevel)
        const matchSearch =
          !search ||
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.candidates.some((c) => c.name.toLowerCase().includes(search.toLowerCase()))
        return matchType && matchLevel && matchSearch
      }),
    [positions, activeType, activeLevel, search],
  )

  return (
    <VStack gap={4} alignItems="stretch">
      {/* ── Filter bar ──────────────────────────────────────────── */}
      <Box
        bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100"
        boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" p={4}
      >
        <VStack gap={3} alignItems="stretch">

          {/* Search */}
          <HStack
            bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.200"
            px={3} py={2} gap={2}
          >
            <FiSearch fontSize="0.9rem" color="#94a3b8" />
            <Input
              placeholder="Search positions or candidates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="outline"
              border="none"
              bg="transparent"
              fontSize="sm"
              p={0}
            />
          </HStack>

          {/* Tally-level filter */}
          <VStack alignItems="flex-start" gap={1.5}>
            <HStack gap={1.5}>
              <FiFilter fontSize="0.75rem" color="#94a3b8" />
              <Text fontSize="xs" color="gray.500" fontWeight="600">Filter by tally level</Text>
            </HStack>
            <HStack gap={2} flexWrap="wrap">
              {(["ALL", ...availableLevels] as (AggregationLevel | "ALL")[]).map((lvl) => {
                const active = activeLevel === lvl
                const lbc = lvl !== "ALL" ? LEVEL_BADGE_COLOR[lvl] : null
                return (
                  <Box
                    key={lvl}
                    as="button"
                    onClick={() => setActiveLevel(lvl)}
                    px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="600"
                    borderWidth="1px" transition="all 0.15s" cursor="pointer"
                    bg={active ? (lbc?.bg ?? "#0f172a") : "white"}
                    color={active ? (lbc?.color ?? "white") : "gray.600"}
                    borderColor={active ? (lbc?.color ?? "#0f172a") : "gray.200"}
                    _hover={{ borderColor: lbc?.color ?? "#0f172a" }}
                  >
                    {lvl === "ALL" ? "All Levels" : AGGREGATION_LEVEL_LABEL[lvl]}
                  </Box>
                )
              })}
            </HStack>
          </VStack>

          {/* Position type filter */}
          <VStack alignItems="flex-start" gap={1.5}>
            <HStack gap={1.5}>
              <MdHowToVote fontSize="0.75rem" color="#94a3b8" />
              <Text fontSize="xs" color="gray.500" fontWeight="600">Filter by position type</Text>
            </HStack>
            <HStack gap={2} flexWrap="wrap">
              {positionTypes.map((pt) => (
                <Box
                  key={pt}
                  as="button"
                  onClick={() => setActiveType(pt)}
                  px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="600"
                  borderWidth="1px" transition="all 0.15s" cursor="pointer"
                  bg={activeType === pt ? "#0f172a" : "white"}
                  color={activeType === pt ? "white" : "gray.600"}
                  borderColor={activeType === pt ? "#0f172a" : "gray.200"}
                  _hover={{ borderColor: "#0f172a" }}
                >
                  {pt === "ALL" ? "All Types" : pt.replace(/_/g, " ")}
                </Box>
              ))}
            </HStack>
          </VStack>

          {/* Result count */}
          <Text fontSize="xs" color="gray.400">
            Showing {filtered.length} of {positions.length} positions
            {" · "}
            {filtered.reduce((s, p) => s + p.candidates.length, 0)} candidates
          </Text>
        </VStack>
      </Box>

      {/* ── Position cards ─────────────────────────────────────── */}
      {filtered.map((position) => {
        const lc     = LEVEL_COLOR[position.aggregationLevel]
        const typeKey = position.type.toUpperCase().replace(/\s+/g, "_")
        const tallyLevels = POSITION_TALLY_LEVELS[typeKey] ?? []

        return (
          <Box
            key={position.id}
            bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100"
            boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden"
          >
            {/* Position header */}
            <Box px={6} py={4} borderBottomWidth="1px" borderBottomColor="gray.100">
              <HStack justify="space-between" flexWrap="wrap" gap={2}>
                <HStack gap={3}>
                  <Flex
                    w={9} h={9} borderRadius="lg" bg={lc.bg}
                    align="center" justify="center" flexShrink={0}
                  >
                    <MdHowToVote fontSize="1rem" color={lc.color} />
                  </Flex>
                  <VStack alignItems="flex-start" gap={0.5}>
                    <Text fontWeight="700" fontSize="sm" color="gray.900">
                      {position.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {position.candidates.length} candidates
                    </Text>
                  </VStack>
                </HStack>

                {/* All applicable form codes */}
                <HStack gap={1.5} flexWrap="wrap">
                  <Badge
                    px={2} py={0.5} borderRadius="full"
                    bg={lc.bg} color={lc.color}
                    fontSize="9px" fontWeight="700"
                    textTransform="uppercase" letterSpacing="wide"
                  >
                    {position.aggregationLevel}
                  </Badge>

                  {/* Form A — polling station */}
                  <Badge size="xs" variant="subtle" colorPalette="gray" fontSize="9px">
                    Form {getFormTypeForLevel(position.type, "POLLING_STATION")}
                  </Badge>

                  {/* Form B / C — tally levels */}
                  {tallyLevels.map((lvl) => (
                    <Badge
                      key={lvl} size="xs" variant="subtle" fontSize="9px"
                      colorPalette={
                        lvl === "WARD" || lvl === "CONSTITUENCY" ? "blue" : "pink"
                      }
                    >
                      Form {getFormTypeForLevel(position.type, lvl)}
                    </Badge>
                  ))}
                </HStack>
              </HStack>
            </Box>

            {/* Candidate list + add form */}
            <CandidateManager
              positionId={position.id}
              positionType={position.type}
              aggregationLevel={position.aggregationLevel}
              initialCandidates={position.candidates}
              parties={parties}
            />
          </Box>
        )
      })}

      {filtered.length === 0 && (
        <VStack py={12} gap={2}>
          <MdHowToVote fontSize="2rem" color="#94a3b8" />
          <Text fontSize="sm" color="gray.400">No positions match the current filters</Text>
        </VStack>
      )}
    </VStack>
  )
}
