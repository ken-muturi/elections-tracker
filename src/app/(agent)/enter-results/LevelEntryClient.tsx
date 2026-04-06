"use client"

import { useState, useMemo } from "react"
import {
  Box, Text, VStack, HStack, Input, Flex, SimpleGrid, Badge,
} from "@chakra-ui/react"
import {
  FiArrowLeft, FiSearch, FiMapPin,
  FiSave, FiSend, FiAlertCircle, FiCheckCircle, FiLoader,
} from "react-icons/fi"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import useSyncMutation from "@/hooks/hooks/useSyncMutation"
import {
  searchEntitiesAtLevel,
  getLevelResult,
  upsertLevelResult,
  submitLevelResult,
  computeAggregateFromStreams,
  type LevelEntity,
} from "@/services/LevelResults"
import { getFormTypeForLevel, AGGREGATION_LEVEL_LABEL, LEVEL_SUFFIX } from "@/constants/elections"
import FormImageUpload from "./FormImageUpload"
import StatusBadge from "./StatusBadge"
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

/* ── Valid levels for B/C entry (excludes POLLING_STATION which is Form A) ── */

const ENTRY_LEVELS: { level: AggregationLevel; suffix: string; label: string; description: string }[] = [
  { level: "WARD", suffix: "B", label: "Ward", description: "Ward-level tally (Form B)" },
  { level: "CONSTITUENCY", suffix: "B", label: "Constituency", description: "Constituency tally (Form B)" },
  { level: "COUNTY", suffix: "C", label: "County", description: "County tally (Form C)" },
  { level: "NATIONAL", suffix: "C", label: "National", description: "National declaration (Form C)" },
]

/* ── Component ──────────────────────────────────────────────── */

export default function LevelEntryClient({
  electionId,
  positions,
  onBack,
}: LevelEntryProps) {
  /* ── Navigation state ──────────────────────────────────── */
  const [selectedLevel, setSelectedLevel] = useState<AggregationLevel | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<LevelEntity | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

  /* ── Step 1: Level selection ───────────────────────────── */
  if (!selectedLevel) {
    return (
      <LevelPicker
        positions={positions}
        onSelect={setSelectedLevel}
        onBack={onBack}
      />
    )
  }

  /* ── Step 2: Entity selection ──────────────────────────── */
  if (!selectedEntity) {
    // NATIONAL has no entity to pick — auto-select
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

  /* ── Step 3: Position selection ─────────────────────────── */
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

  /* ── Step 4: Vote entry ────────────────────────────────── */
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
   Step 1: Level Picker
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
  // Which form types exist for this election's positions
  const positionTypes = useMemo(
    () => [...new Set(positions.map((p) => p.type.toUpperCase().replace(/\s+/g, "_")))],
    [positions],
  )

  return (
    <VStack gap={4} alignItems="stretch">
      <HStack gap={2}>
        <Box as="button" onClick={onBack} cursor="pointer" _hover={{ color: "gray.900" }} color="gray.400" transition="color 0.15s">
          <FiArrowLeft />
        </Box>
        <VStack alignItems="flex-start" gap={0}>
          <Text fontSize="sm" fontWeight="700" color="gray.900">Select Tally Level</Text>
          <Text fontSize="xs" color="gray.400">Choose which level of results to enter (Form B or C)</Text>
        </VStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        {ENTRY_LEVELS.map(({ level, suffix, label, description }) => {
          // Show which form codes apply
          const formCodes = positionTypes
            .map((pt) => getFormTypeForLevel(pt, level))
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
                      <Badge key={code} size="xs" variant="subtle" colorPalette={suffix === "B" ? "blue" : "pink"} fontSize="9px">
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
        <Box as="button" onClick={onBack} cursor="pointer" _hover={{ color: "gray.900" }} color="gray.400" transition="color 0.15s">
          <FiArrowLeft />
        </Box>
        <VStack alignItems="flex-start" gap={0}>
          <Text fontSize="sm" fontWeight="700" color="gray.900">Select {levelLabel}</Text>
          <Text fontSize="xs" color="gray.400">Choose which {levelLabel.toLowerCase()} to enter results for</Text>
        </VStack>
      </HStack>

      {/* Search */}
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

      {/* Results */}
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
  // Filter positions that are relevant at this level
  // e.g. at WARD level, only MCA positions matter
  // At CONSTITUENCY, only MP. At COUNTY, Governor/Senator/Women Rep
  // At NATIONAL, only President
  // Actually, any position needs its B/C form at every level. The tally form at any
  // aggregation level covers ALL positions tallied through that level.
  // So we show all positions — they all need their tallies entered at every level.

  const levelLabel = AGGREGATION_LEVEL_LABEL[level]

  return (
    <VStack gap={4} alignItems="stretch">
      <HStack gap={2}>
        <Box as="button" onClick={onBack} cursor="pointer" _hover={{ color: "gray.900" }} color="gray.400" transition="color 0.15s">
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

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        {positions.map((position) => {
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
  // Fetch existing level result status
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

  /* ── Fetch existing level result ───────────────────────── */
  const { data: existingResult } = useQuery({
    queryKey: ["level-result", position.id, level, entity.id],
    queryFn: () => getLevelResult(position.id, level, entity.id),
    staleTime: 30_000,
  })

  /* ── Fetch system aggregate for comparison ─────────────── */
  const { data: aggregate } = useQuery<AggregateData>({
    queryKey: ["level-aggregate", position.id, level, entity.id],
    queryFn: () => computeAggregateFromStreams(position.id, level, entity.id),
    staleTime: 60_000,
  })

  const isSubmitted =
    existingResult?.status === "SUBMITTED" ||
    existingResult?.status === "VERIFIED"

  /* ── Form state ────────────────────────────────────────── */
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
  const [rejectedVotes, setRejectedVotes] = useState(
    existingResult?.rejectedVotes ?? 0,
  )
  const [notes, setNotes] = useState(existingResult?.notes ?? "")
  const [success, setSuccess] = useState("")

  // Re-sync when existing result loads
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

  /* ── Save/Submit mutation ──────────────────────────────── */
  const saveMutation = useSyncMutation(
    async ({ andSubmit }: { andSubmit: boolean }) => {
      const candidateVotes = position.candidates.map((c) => ({
        candidateId: c.id,
        votes: votes[c.id] ?? 0,
      }))

      const result = await upsertLevelResult(
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

      if (andSubmit && result) {
        await submitLevelResult(result.id)
      }

      return { result, andSubmit }
    },
    {
      onSuccess: ({ andSubmit }) => {
        queryClient.invalidateQueries({
          queryKey: ["level-result", position.id, level, entity.id],
        })
        setSuccess(
          andSubmit
            ? "Results submitted successfully!"
            : "Draft saved successfully!",
        )
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

  /* ── Aggregate comparison helper ───────────────────────── */
  const aggMap = useMemo(() => {
    if (!aggregate) return new Map<string, number>()
    return new Map(aggregate.candidateTotals.map((c) => [c.candidateId, c.votes]))
  }, [aggregate])

  return (
    <VStack gap={5} alignItems="stretch" maxW="700px">
      {/* Header */}
      <HStack gap={2}>
        <Box as="button" onClick={() => { saveMutation.reset(); setSuccess(""); onBack() }}
          cursor="pointer" _hover={{ color: "gray.900" }} color="gray.400" transition="color 0.15s">
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

      {/* Aggregate comparison banner */}
      {aggregate && aggregate.streamCount > 0 && (
        <Box bg="#f0f9ff" borderRadius="xl" p={4} borderWidth="1px" borderColor="#bae6fd">
          <Text fontSize="xs" fontWeight="700" color="#0369a1" mb={2}>
            System Aggregate ({aggregate.streamCount} stream{aggregate.streamCount !== 1 ? "s" : ""})
          </Text>
          <HStack gap={6} flexWrap="wrap">
            <VStack gap={0} alignItems="flex-start">
              <Text fontSize="2xs" color="#0284c7">Total Votes</Text>
              <Text fontSize="md" fontWeight="800" color="#0c4a6e">
                {aggregate.totalVotes.toLocaleString()}
              </Text>
            </VStack>
            <VStack gap={0} alignItems="flex-start">
              <Text fontSize="2xs" color="#0284c7">Rejected</Text>
              <Text fontSize="md" fontWeight="800" color="#0c4a6e">
                {aggregate.rejectedVotes.toLocaleString()}
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}

      {/* Candidates table */}
      <Box bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
        boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden">
        {/* Heading */}
        <HStack px={5} py={3} bg="#f8fafc" borderBottomWidth="1px" borderBottomColor="gray.100">
          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" flex={1}>
            Candidate
          </Text>
          {aggregate && aggregate.streamCount > 0 && (
            <Text fontSize="xs" fontWeight="700" color="#0284c7" textTransform="uppercase" letterSpacing="wide" w="90px" textAlign="right">
              Aggregated
            </Text>
          )}
          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" w="120px" textAlign="right">
            Form {formCode}
          </Text>
        </HStack>

        {position.candidates.map((c, i) => {
          const aggVotes = aggMap.get(c.id)
          const enteredVotes = votes[c.id] ?? 0
          const mismatch = aggVotes != null && enteredVotes > 0 && enteredVotes !== aggVotes

          return (
            <HStack key={c.id} px={5} py={3.5} gap={3}
              borderBottomWidth={i < position.candidates.length - 1 ? "1px" : "0"}
              borderBottomColor="gray.50"
              bg={mismatch ? "#fffbeb" : undefined}
            >
              <VStack alignItems="flex-start" gap={0} flex={1}>
                <Text fontSize="sm" fontWeight="600" color="gray.900">{c.name}</Text>
                {c.party && <Text fontSize="xs" color="gray.400">{c.party}</Text>}
              </VStack>
              {aggregate && aggregate.streamCount > 0 && (
                <Text fontSize="sm" fontWeight="600" color="#0284c7" w="90px" textAlign="right">
                  {aggVotes != null ? aggVotes.toLocaleString() : "—"}
                </Text>
              )}
              <Input
                type="number" min={0} w="120px" textAlign="right"
                fontWeight="700" fontSize="md"
                value={votes[c.id] ?? 0}
                onChange={(e) => setVotes((prev) => ({
                  ...prev, [c.id]: Math.max(0, parseInt(e.target.value) || 0),
                }))}
                disabled={isSubmitted}
                borderColor={mismatch ? "#f59e0b" : "gray.200"}
                _hover={{ borderColor: mismatch ? "#d97706" : "gray.300" }}
                _focus={{ borderColor: mismatch ? "#f59e0b" : "#0ea5e9", boxShadow: `0 0 0 1px ${mismatch ? "#f59e0b" : "#0ea5e9"}` }}
              />
            </HStack>
          )
        })}

        {/* Rejected votes */}
        <HStack px={5} py={3.5} bg="#fef7ed" borderTopWidth="1px" borderTopColor="gray.100">
          <Text fontSize="sm" fontWeight="600" color="#92400e" flex={1}>Rejected Ballots</Text>
          {aggregate && aggregate.streamCount > 0 && (
            <Text fontSize="sm" fontWeight="600" color="#0284c7" w="90px" textAlign="right">
              {aggregate.rejectedVotes.toLocaleString()}
            </Text>
          )}
          <Input
            type="number" min={0} w="120px" textAlign="right"
            fontWeight="700" fontSize="md" value={rejectedVotes}
            onChange={(e) => setRejectedVotes(Math.max(0, parseInt(e.target.value) || 0))}
            disabled={isSubmitted}
            borderColor="#fde68a" bg="white"
            _focus={{ borderColor: "#f59e0b", boxShadow: "0 0 0 1px #f59e0b" }}
          />
        </HStack>

        {/* Total */}
        <HStack px={5} py={3} bg="#f1f5f9" borderTopWidth="1px" borderTopColor="gray.200">
          <Text fontSize="sm" fontWeight="800" color="gray.700" flex={1}>TOTAL</Text>
          {aggregate && aggregate.streamCount > 0 && (
            <Text fontSize="md" fontWeight="800" color="#0284c7" w="90px" textAlign="right">
              {aggregate.totalVotes.toLocaleString()}
            </Text>
          )}
          <Text fontSize="lg" fontWeight="800" color="gray.900" w="120px" textAlign="right">
            {grandTotal.toLocaleString()}
          </Text>
        </HStack>
      </Box>

      {/* Notes */}
      <Box>
        <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1.5}>Notes (optional)</Text>
        <Input
          placeholder="Any observations or notes…"
          value={notes} onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitted} fontSize="sm" borderColor="gray.200"
        />
      </Box>

      {/* Form image upload */}
      <FormImageUpload
        positionId={position.id}
        positionType={position.type}
        level={level}
        entityId={entity.id}
      />

      {/* Messages */}
      {saveMutation.error && (
        <Box px={4} py={3} bg="#fef2f2" borderRadius="lg">
          <HStack gap={1.5}>
            <FiAlertCircle fontSize="0.8rem" color="#dc2626" />
            <Text fontSize="sm" color="#dc2626">{saveMutation.error.message}</Text>
          </HStack>
        </Box>
      )}
      {success && (
        <Box px={4} py={3} bg="#d1fae5" borderRadius="lg">
          <HStack gap={1.5}>
            <FiCheckCircle fontSize="0.8rem" color="#065f46" />
            <Text fontSize="sm" color="#065f46" fontWeight="600">{success}</Text>
          </HStack>
        </Box>
      )}

      {/* Actions */}
      {!isSubmitted && (
        <HStack gap={3} justify="flex-end">
          <Box as="button" onClick={() => saveResult(false)}
            px={5} py={2.5} borderRadius="lg" borderWidth="1px" borderColor="gray.200"
            fontSize="sm" fontWeight="600" color="gray.600" cursor="pointer"
            _hover={{ bg: "gray.50" }} transition="all 0.15s"
            opacity={saveMutation.isPending ? 0.6 : 1}>
            <HStack gap={1.5}><FiSave fontSize="0.85rem" /><Text>Save Draft</Text></HStack>
          </Box>
          <Box as="button" onClick={() => saveResult(true)}
            px={5} py={2.5} borderRadius="lg" bg="#0f172a" color="white"
            fontSize="sm" fontWeight="700" cursor="pointer"
            _hover={{ bg: "#1e293b" }} transition="all 0.15s"
            opacity={saveMutation.isPending ? 0.6 : 1}>
            <HStack gap={1.5}><FiSend fontSize="0.85rem" /><Text>Submit Results</Text></HStack>
          </Box>
        </HStack>
      )}

      {isSubmitted && (
        <Box px={4} py={3} bg="#dbeafe" borderRadius="lg">
          <HStack gap={1.5}>
            <FiCheckCircle fontSize="0.8rem" color="#1e40af" />
            <Text fontSize="sm" color="#1e40af" fontWeight="600">
              These results have been submitted and cannot be edited.
            </Text>
          </HStack>
        </Box>
      )}
    </VStack>
  )
}
