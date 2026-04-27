"use client"

import { useState, useMemo } from "react"
import {
  Box, Text, VStack, HStack, Input, Flex, SimpleGrid, Badge,
} from "@chakra-ui/react"
import {
  FiArrowLeft, FiSearch, FiMapPin, FiLoader,
} from "react-icons/fi"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import useSyncMutation from "@/hooks/hooks/useSyncMutation"
import {
  searchEntitiesAtLevel,
  getLevelResult,
  upsertLevelResult,
  computeAggregateFromStreams,
  type LevelEntity,
} from "@/services/LevelResults"
import {
  getFormTypeForLevel,
  AGGREGATION_LEVEL_LABEL,
  LEVEL_SUFFIX,
  positionHasTallyAtLevel,
} from "@/constants/elections"
import FormImageUpload from "./FormImageUpload"
import StatusBadge from "./StatusBadge"
import VoteTable from "./VoteTable"
import type { AggregateInfo } from "./VoteTable"
import { CARD_STYLES } from "./constants"
import type { Position } from "./types"
import type { AggregationLevel } from "@prisma/client"

/* ── Types ──────────────────────────────────────────────────── */

type LevelEntryProps = {
  electionId: string
  positions: Position[]
  onBack: () => void
}

type AggregateData = {
  streamCount: number
  totalVotes: number
  rejectedVotes: number
  candidateTotals: { candidateId: string; votes: number }[]
}

/* ── All possible Form B/C tally levels ─────────────────────── */
const ALL_ENTRY_LEVELS: {
  level: AggregationLevel
  suffix: string
  label: string
  description: string
}[] = [
  { level: "WARD",         suffix: "B", label: "Ward",         description: "Ward tally — MCA Form 33B" },
  { level: "CONSTITUENCY", suffix: "B", label: "Constituency", description: "Constituency tally — Forms 34B / 35B / 36B / 37B / 38B" },
  { level: "COUNTY",       suffix: "C", label: "County",       description: "County declaration — Forms 36C / 37C / 38C" },
  { level: "NATIONAL",     suffix: "C", label: "National",     description: "National declaration — Form 34C" },
]

/* ── Component ──────────────────────────────────────────────── */

export default function LevelEntryClient({
  electionId,
  positions,
  onBack,
}: LevelEntryProps) {
  const [selectedLevel, setSelectedLevel]       = useState<AggregationLevel | null>(null)
  const [selectedEntity, setSelectedEntity]     = useState<LevelEntity | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

  if (!selectedLevel) {
    return (
      <LevelPicker
        positions={positions}
        onSelect={setSelectedLevel}
        onBack={onBack}
      />
    )
  }

  if (!selectedEntity) {
    if (selectedLevel === "NATIONAL") {
      setSelectedEntity({ id: "national", name: "National" })
      return null
    }
    return (
      <EntitySelector
        electionId={electionId}
        level={selectedLevel}
        onSelect={setSelectedEntity}
        onBack={() => setSelectedLevel(null)}
      />
    )
  }

  if (!selectedPosition) {
    return (
      <LevelPositionSelector
        level={selectedLevel}
        entity={selectedEntity}
        positions={positions}
        onSelect={setSelectedPosition}
        onBack={() => setSelectedEntity(null)}
      />
    )
  }

  return (
    <LevelVoteEntryForm
      level={selectedLevel}
      entity={selectedEntity}
      position={selectedPosition}
      onBack={() => setSelectedPosition(null)}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════
   Step 1: Level Picker — only shows levels relevant to this election's positions
   ═══════════════════════════════════════════════════════════════ */

function LevelPicker({
  positions,
  onSelect,
  onBack,
}: {
  positions: Position[]
  onSelect: (level: AggregationLevel) => void
  onBack: () => void
}) {
  // Only show levels that have at least one applicable position in this election
  const applicableLevels = useMemo(
    () =>
      ALL_ENTRY_LEVELS.filter(({ level }) =>
        positions.some((p) => positionHasTallyAtLevel(p.type, level)),
      ),
    [positions],
  )

  return (
    <VStack gap={4} alignItems="stretch">
      <HStack gap={2}>
        <Box
          as="button" onClick={onBack} cursor="pointer"
          _hover={{ color: "gray.900" }} color="gray.400" transition="color 0.15s"
        >
          <FiArrowLeft />
        </Box>
        <VStack alignItems="flex-start" gap={0}>
          <Text fontSize="sm" fontWeight="700" color="gray.900">Select Tally Level</Text>
          <Text fontSize="xs" color="gray.400">Choose which level of results to enter (Form B or C)</Text>
        </VStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        {applicableLevels.map(({ level, suffix, label, description }) => {
          // Show only the form codes that apply at this level from this election's positions
          const formCodes = positions
            .filter((p) => positionHasTallyAtLevel(p.type, level))
            .map((p) => getFormTypeForLevel(p.type, level))
            .filter((v, i, a) => a.indexOf(v) === i)

          return (
            <Box
              key={level}
              as="button"
              onClick={() => onSelect(level)}
              {...CARD_STYLES}
            >
              <HStack gap={3} align="flex-start">
                <Flex
                  w={10} h={10} borderRadius="xl" flexShrink={0}
                  bg={suffix === "B" ? "#dbeafe" : "#fce7f3"}
                  align="center" justify="center"
                >
                  <Text fontWeight="800" fontSize="sm" color={suffix === "B" ? "#1e40af" : "#9d174d"}>
                    {suffix}
                  </Text>
                </Flex>
                <VStack alignItems="flex-start" gap={0.5}>
                  <Text fontWeight="700" fontSize="sm" color="gray.900">{label}</Text>
                  <Text fontSize="xs" color="gray.500">{description}</Text>
                  <HStack gap={1.5} mt={1} flexWrap="wrap">
                    {formCodes.map((code) => (
                      <Badge
                        key={code} size="xs" variant="subtle"
                        colorPalette={suffix === "B" ? "blue" : "pink"} fontSize="9px"
                      >
                        Form {code}
                      </Badge>
                    ))}
                  </HStack>
                </VStack>
              </HStack>
            </Box>
          )
        })}
      </SimpleGrid>
    </VStack>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Step 2: Entity Selector
   ═══════════════════════════════════════════════════════════════ */

function EntitySelector({
  electionId,
  level,
  onSelect,
  onBack,
}: {
  electionId: string
  level: AggregationLevel
  onSelect: (entity: LevelEntity) => void
  onBack: () => void
}) {
  const [search, setSearch] = useState("")

  const { data: entities = [], isLoading } = useQuery({
    queryKey: ["level-entities", electionId, level, search],
    queryFn: () => searchEntitiesAtLevel(electionId, level, search || undefined),
    staleTime: 60_000,
  })

  const levelLabel = AGGREGATION_LEVEL_LABEL[level]

  return (
    <VStack gap={4} alignItems="stretch">
      <HStack gap={2}>
        <Box
          as="button" onClick={onBack} cursor="pointer"
          _hover={{ color: "gray.900" }} color="gray.400" transition="color 0.15s"
        >
          <FiArrowLeft />
        </Box>
        <VStack alignItems="flex-start" gap={0}>
          <Text fontSize="sm" fontWeight="700" color="gray.900">Select {levelLabel}</Text>
          <Text fontSize="xs" color="gray.400">Choose which {levelLabel.toLowerCase()} to enter results for</Text>
        </VStack>
      </HStack>

      <HStack
        bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200"
        px={3} py={2.5} gap={2}
      >
        <FiSearch fontSize="0.9rem" color="#94a3b8" />
        <Input
          placeholder={`Search ${levelLabel.toLowerCase()}s…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="outline"
          border="none"
          fontSize="sm"
        />
      </HStack>

      {isLoading ? (
        <HStack justify="center" py={8} gap={2}>
          <FiLoader className="animate-spin" fontSize="0.9rem" color="#94a3b8" />
          <Text fontSize="sm" color="gray.400">Searching…</Text>
        </HStack>
      ) : entities.length === 0 ? (
        <VStack py={8} gap={1}>
          <FiMapPin fontSize="1.5rem" color="#94a3b8" />
          <Text fontSize="sm" color="gray.400">No {levelLabel.toLowerCase()}s found</Text>
        </VStack>
      ) : (
        <VStack gap={2} alignItems="stretch">
          {entities.map((entity) => (
            <Box
              key={entity.id}
              as="button"
              onClick={() => onSelect(entity)}
              {...CARD_STYLES}
              p={4}
            >
              <HStack gap={3}>
                <Flex
                  w={8} h={8} borderRadius="lg" flexShrink={0}
                  bg="#f0f9ff" align="center" justify="center"
                >
                  <FiMapPin fontSize="0.85rem" color="#0284c7" />
                </Flex>
                <VStack alignItems="flex-start" gap={0}>
                  <Text fontWeight="600" fontSize="sm" color="gray.900">
                    {entity.name}
                  </Text>
                  {(entity.parentName || entity.grandparentName) && (
                    <HStack gap={1} flexWrap="wrap">
                      {entity.grandparentName && (
                        <>
                          <Text fontSize="xs" color="gray.400">{entity.grandparentName}</Text>
                          <Text fontSize="xs" color="gray.300">›</Text>
                        </>
                      )}
                      {entity.parentName && (
                        <Text fontSize="xs" color="gray.400">{entity.parentName}</Text>
                      )}
                    </HStack>
                  )}
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Step 3: Level Position Selector
   Only shows positions that actually have a tally form at this level
   ═══════════════════════════════════════════════════════════════ */

function LevelPositionSelector({
  level,
  entity,
  positions,
  onSelect,
  onBack,
}: {
  level: AggregationLevel
  entity: LevelEntity
  positions: Position[]
  onSelect: (position: Position) => void
  onBack: () => void
}) {
  // Filter to only positions that have a tally at this level per IEBC forms:
  //   WARD         → MCA only (Form 33B)
  //   CONSTITUENCY → President (34B), MP (35B), Women Rep (36B), Governor (37B), Senator (38B)
  //   COUNTY       → Women Rep (36C), Governor (37C), Senator (38C)
  //   NATIONAL     → President (34C) only
  const levelPositions = useMemo(
    () => positions.filter((p) => positionHasTallyAtLevel(p.type, level)),
    [positions, level],
  )

  const levelLabel = AGGREGATION_LEVEL_LABEL[level]

  return (
    <VStack gap={4} alignItems="stretch">
      <HStack gap={2}>
        <Box
          as="button" onClick={onBack} cursor="pointer"
          _hover={{ color: "gray.900" }} color="gray.400" transition="color 0.15s"
        >
          <FiArrowLeft />
        </Box>
        <VStack alignItems="flex-start" gap={0}>
          <Text fontSize="sm" fontWeight="700" color="gray.900">
            {entity.name} — Select Position
          </Text>
          <Text fontSize="xs" color="gray.400">
            {levelLabel} level tally · Form {LEVEL_SUFFIX[level]}
          </Text>
        </VStack>
      </HStack>

      {levelPositions.length === 0 ? (
        <VStack py={8} gap={1}>
          <Text fontSize="sm" color="gray.400">No positions are tallied at {levelLabel} level</Text>
        </VStack>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          {levelPositions.map((position) => {
            const formCode = getFormTypeForLevel(position.type, level)
            return (
              <PositionCardWithStatus
                key={position.id}
                position={position}
                formCode={formCode}
                level={level}
                entityId={entity.id}
                onSelect={() => onSelect(position)}
              />
            )
          })}
        </SimpleGrid>
      )}
    </VStack>
  )
}

function PositionCardWithStatus({
  position,
  formCode,
  level,
  entityId,
  onSelect,
}: {
  position: Position
  formCode: string
  level: AggregationLevel
  entityId: string
  onSelect: () => void
}) {
  const { data: existing } = useQuery({
    queryKey: ["level-result", position.id, level, entityId],
    queryFn: () => getLevelResult(position.id, level, entityId),
    staleTime: 30_000,
  })

  const status = existing?.status

  return (
    <Box as="button" onClick={onSelect} {...CARD_STYLES}>
      <HStack justify="space-between" align="flex-start">
        <VStack alignItems="flex-start" gap={0.5}>
          <Text fontWeight="700" fontSize="sm" color="gray.900">{position.title}</Text>
          <HStack gap={1.5}>
            <Badge size="xs" variant="subtle" colorPalette="blue" fontSize="9px">
              Form {formCode}
            </Badge>
            <Text fontSize="xs" color="gray.400">
              {position.candidates.length} candidates
            </Text>
          </HStack>
        </VStack>
        {status && <StatusBadge status={status} />}
      </HStack>
    </Box>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Step 4: Level Vote Entry Form
   ═══════════════════════════════════════════════════════════════ */

function LevelVoteEntryForm({
  level,
  entity,
  position,
  onBack,
}: {
  level: AggregationLevel
  entity: LevelEntity
  position: Position
  onBack: () => void
}) {
  const queryClient = useQueryClient()
  const formCode = getFormTypeForLevel(position.type, level)
  const levelLabel = AGGREGATION_LEVEL_LABEL[level]

  const { data: existingResult } = useQuery({
    queryKey: ["level-result", position.id, level, entity.id],
    queryFn: () => getLevelResult(position.id, level, entity.id),
    staleTime: 30_000,
  })

  const { data: aggregate } = useQuery<AggregateData>({
    queryKey: ["level-aggregate", position.id, level, entity.id],
    queryFn: () => computeAggregateFromStreams(position.id, level, entity.id),
    staleTime: 60_000,
  })

  const isSubmitted =
    existingResult?.status === "SUBMITTED" ||
    existingResult?.status === "VERIFIED"

  const [votes, setVotes] = useState<Record<string, number>>(() => {
    if (existingResult) {
      const m: Record<string, number> = {}
      for (const v of existingResult.votes) m[v.candidateId] = v.votes
      return m
    }
    const m: Record<string, number> = {}
    for (const c of position.candidates) m[c.id] = 0
    return m
  })
  const [rejectedVotes, setRejectedVotes] = useState(existingResult?.rejectedVotes ?? 0)
  const [notes, setNotes] = useState(existingResult?.notes ?? "")
  const [success, setSuccess] = useState("")

  useState(() => {
    if (existingResult) {
      const m: Record<string, number> = {}
      for (const v of existingResult.votes) m[v.candidateId] = v.votes
      setVotes(m)
      setRejectedVotes(existingResult.rejectedVotes ?? 0)
      setNotes(existingResult.notes ?? "")
    }
  })

  const totalCandidateVotes = position.candidates.reduce(
    (s, c) => s + (votes[c.id] ?? 0),
    0,
  )
  const grandTotal = totalCandidateVotes + rejectedVotes

  const saveMutation = useSyncMutation(
    async ({ andSubmit }: { andSubmit: boolean }) => {
      const candidateVotes = position.candidates.map((c) => ({
        candidateId: c.id,
        votes: votes[c.id] ?? 0,
      }))
      await upsertLevelResult(
        {
          positionId: position.id,
          level,
          entityId: entity.id,
          votes: candidateVotes,
          totalVotes: grandTotal,
          rejectedVotes,
          notes: notes || undefined,
        },
        andSubmit ? "SUBMITTED" : "DRAFT",
      )
      return { andSubmit }
    },
    {
      onSuccess: ({ andSubmit }) => {
        queryClient.invalidateQueries({
          queryKey: ["level-result", position.id, level, entity.id],
        })
        setSuccess(andSubmit ? "Results submitted successfully!" : "Draft saved successfully!")
        if (andSubmit) {
          setTimeout(() => { onBack(); setSuccess("") }, 1500)
        } else {
          setTimeout(() => setSuccess(""), 3000)
        }
      },
    },
  )

  const saveResult = (andSubmit: boolean) => {
    setSuccess("")
    saveMutation.mutate({ andSubmit })
  }

  const aggInfo = useMemo((): AggregateInfo | undefined => {
    if (!aggregate || aggregate.streamCount === 0) return undefined
    return {
      streamCount: aggregate.streamCount,
      totalVotes: aggregate.totalVotes,
      rejectedVotes: aggregate.rejectedVotes,
      candidateTotals: new Map(aggregate.candidateTotals.map((c) => [c.candidateId, c.votes])),
    }
  }, [aggregate])

  return (
    <VStack gap={5} alignItems="stretch" maxW="700px">
      <HStack gap={2}>
        <Box
          as="button"
          onClick={() => { saveMutation.reset(); setSuccess(""); onBack() }}
          cursor="pointer" _hover={{ color: "gray.900" }} color="gray.400" transition="color 0.15s"
        >
          <FiArrowLeft />
        </Box>
        <VStack alignItems="flex-start" gap={0}>
          <HStack gap={2}>
            <Text fontSize="sm" fontWeight="700" color="gray.900">
              {position.title}
            </Text>
            <Badge size="xs" variant="subtle" colorPalette="blue" fontSize="9px">
              Form {formCode}
            </Badge>
          </HStack>
          <Text fontSize="xs" color="gray.400">
            {entity.name} — {levelLabel} level
          </Text>
        </VStack>
        {existingResult?.status && (
          <Box ml="auto"><StatusBadge status={existingResult.status} /></Box>
        )}
      </HStack>

      <VoteTable
        candidates={position.candidates}
        votes={votes}
        onVoteChange={(id, val) => setVotes((prev) => ({ ...prev, [id]: val }))}
        rejectedVotes={rejectedVotes}
        onRejectedVotesChange={setRejectedVotes}
        notes={notes}
        onNotesChange={setNotes}
        isSubmitted={isSubmitted}
        grandTotal={grandTotal}
        error={saveMutation.error}
        success={success}
        isPending={saveMutation.isPending}
        onSaveDraft={() => saveResult(false)}
        onSubmit={() => saveResult(true)}
        aggregate={aggInfo}
        votesColumnLabel={`Form ${formCode}`}
        formImageUpload={
          <FormImageUpload
            positionId={position.id}
            positionType={position.type}
            level={level}
            entityId={entity.id}
          />
        }
      />
    </VStack>
  )
}
