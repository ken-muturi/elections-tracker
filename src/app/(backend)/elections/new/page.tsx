"use client"

import {
  Box, Heading, Text, VStack, HStack, SimpleGrid, Flex, Input, Textarea,
} from "@chakra-ui/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { createElection, type PositionInput } from "@/services/Elections"
import { KNOWN_POSITIONS, AGGREGATION_LEVELS, AGGREGATION_LEVEL_LABEL } from "@/constants/elections"
import { AggregationLevel } from "@prisma/client"
import { FiArrowLeft, FiPlus, FiTrash2, FiChevronDown } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import { LEVEL_COLOR } from "@/components/Elections/constants"

const DEFAULT_POSITIONS: PositionInput[] = Object.entries(KNOWN_POSITIONS).map(([type, meta], i) => ({
  type,
  title: meta.label,
  aggregationLevel: meta.aggregationLevel,
  description: meta.description,
  sortOrder: i,
}))

export default function NewElectionPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle]               = useState("")
  const [year, setYear]                 = useState(new Date().getFullYear().toString())
  const [electionDate, setElectionDate] = useState("")
  const [description, setDescription]  = useState("")
  const [positions, setPositions]       = useState<PositionInput[]>(DEFAULT_POSITIONS)
  const [error, setError]               = useState("")

  // ── Position helpers ──────────────────────────────────────────────────────

  const addPosition = () => {
    setPositions((prev) => [
      ...prev,
      {
        type: "",
        title: "",
        aggregationLevel: "WARD",
        description: "",
        sortOrder: prev.length,
      },
    ])
  }

  const removePosition = (idx: number) => {
    setPositions((prev) => prev.filter((_, i) => i !== idx))
  }

  const updatePosition = (idx: number, field: keyof PositionInput, value: string) => {
    setPositions((prev) =>
      prev.map((p, i) => {
        if (i !== idx) return p
        if (field === "type") {
          // Auto-fill title from known positions
          const known = KNOWN_POSITIONS[value.toUpperCase()]
          return {
            ...p,
            type: value,
            title: known ? known.label : p.title,
            aggregationLevel: known ? known.aggregationLevel : p.aggregationLevel,
            description: known ? known.description : p.description,
          }
        }
        return { ...p, [field]: value }
      })
    )
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !year || !electionDate) {
      setError("Title, year, and election date are required.")
      return
    }
    if (positions.length === 0) {
      setError("Add at least one position.")
      return
    }
    for (const p of positions) {
      if (!p.type.trim()) { setError("All positions must have a type/key."); return }
      if (!p.title.trim()) { setError(`Position "${p.type}" needs a display title.`); return }
    }
    const types = positions.map((p) => p.type.trim().toUpperCase())
    const dupes = types.filter((t, i) => types.indexOf(t) !== i)
    if (dupes.length) { setError(`Duplicate position types: ${dupes.join(", ")}`); return }

    setError("")
    startTransition(async () => {
      try {
        const election = await createElection({
          title: title.trim(),
          year: parseInt(year),
          electionDate: new Date(electionDate),
          description: description.trim() || undefined,
          positions,
        })
        router.push(`/elections/${election.id}`)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to create election.")
      }
    })
  }

  return (
    <VStack gap={6} alignItems="stretch" w="full" maxW="680px">
      {/* Back */}
      <VStack alignItems="flex-start" gap={3}>
        <Link href="/elections">
          <HStack gap={1.5} color="gray.500" fontSize="sm" _hover={{ color: "gray.800" }} transition="color 0.15s">
            <FiArrowLeft />
            <Text>All Elections</Text>
          </HStack>
        </Link>
        <VStack alignItems="flex-start" gap={0.5}>
          <Heading fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} color="gray.900" lineHeight="1.2">
            New Election
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Configure this election cycle — positions, candidates, and results are scoped to it.
          </Text>
        </VStack>
      </VStack>

      <Box as="form" onSubmit={handleSubmit}>
        <VStack gap={5} alignItems="stretch">

          {/* ── Basic details ── */}
          <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100"
            boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" p={6}>
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide" mb={5}>
              Election Details
            </Text>
            <VStack gap={4} alignItems="stretch">
              <VStack alignItems="flex-start" gap={1.5}>
                <Text fontSize="sm" fontWeight="600" color="gray.700">Title *</Text>
                <Input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kenyan General Election 2027"
                  bg="gray.50" borderColor="gray.200" borderRadius="lg" fontSize="sm" h="42px"
                  _focus={{ bg: "white", borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                />
              </VStack>
              <SimpleGrid columns={2} gap={4}>
                <VStack alignItems="flex-start" gap={1.5}>
                  <Text fontSize="sm" fontWeight="600" color="gray.700">Year *</Text>
                  <Input
                    type="number" value={year} onChange={(e) => setYear(e.target.value)}
                    placeholder="2027"
                    bg="gray.50" borderColor="gray.200" borderRadius="lg" fontSize="sm" h="42px"
                    _focus={{ bg: "white", borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                  />
                </VStack>
                <VStack alignItems="flex-start" gap={1.5}>
                  <Text fontSize="sm" fontWeight="600" color="gray.700">Election Date *</Text>
                  <Input
                    type="date" value={electionDate} onChange={(e) => setElectionDate(e.target.value)}
                    bg="gray.50" borderColor="gray.200" borderRadius="lg" fontSize="sm" h="42px"
                    _focus={{ bg: "white", borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                  />
                </VStack>
              </SimpleGrid>
              <VStack alignItems="flex-start" gap={1.5}>
                <Text fontSize="sm" fontWeight="600" color="gray.700">Description</Text>
                <Textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes about this election cycle…"
                  bg="gray.50" borderColor="gray.200" borderRadius="lg" fontSize="sm" rows={2} resize="none"
                  _focus={{ bg: "white", borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                />
              </VStack>
            </VStack>
          </Box>

          {/* ── Positions ── */}
          <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor="gray.100"
            boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" p={6}>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wide">
                Positions
              </Text>
              <Text fontSize="xs" color="gray.400">{positions.length} configured</Text>
            </HStack>
            <Text fontSize="xs" color="gray.400" mb={5}>
              Pre-filled with standard Kenyan positions. Edit, remove, or add custom ones.
            </Text>

            <VStack gap={3} alignItems="stretch">
              {positions.map((pos, idx) => {
                const lc = LEVEL_COLOR[pos.aggregationLevel]
                return (
                  <Box key={idx} p={4} borderRadius="xl" borderWidth="1.5px"
                    borderColor={pos.type ? "gray.100" : "#fca5a5"} bg="gray.50">
                    <HStack gap={3} align="flex-start" flexWrap="wrap">
                      {/* Icon */}
                      <Flex w={8} h={8} borderRadius="lg" bg={lc.bg} align="center" justify="center" flexShrink={0} mt={0.5}>
                        <MdHowToVote fontSize="0.9rem" color={lc.color} />
                      </Flex>

                      {/* Fields */}
                      <VStack flex={1} gap={2} alignItems="stretch" minW="200px">
                        <HStack gap={2} flexWrap="wrap">
                          {/* Type key */}
                          <VStack alignItems="flex-start" gap={0.5} flex={1} minW="100px">
                            <Text fontSize="10px" color="gray.400" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                              Type key
                            </Text>
                            <Input
                              value={pos.type}
                              onChange={(e) => updatePosition(idx, "type", e.target.value)}
                              placeholder="e.g. MCA"
                              size="sm" bg="white" borderColor="gray.200" borderRadius="lg"
                              fontFamily="mono" textTransform="uppercase"
                              _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                            />
                          </VStack>
                          {/* Title */}
                          <VStack alignItems="flex-start" gap={0.5} flex={2} minW="140px">
                            <Text fontSize="10px" color="gray.400" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                              Display name
                            </Text>
                            <Input
                              value={pos.title}
                              onChange={(e) => updatePosition(idx, "title", e.target.value)}
                              placeholder="e.g. Member of County Assembly"
                              size="sm" bg="white" borderColor="gray.200" borderRadius="lg"
                              _focus={{ borderColor: "#C9D927", boxShadow: "0 0 0 3px rgba(201,217,39,0.15)" }}
                            />
                          </VStack>
                        </HStack>

                        {/* Aggregation level */}
                        <VStack alignItems="flex-start" gap={0.5}>
                          <Text fontSize="10px" color="gray.400" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                            Aggregation level
                          </Text>
                          <Box position="relative" w="full">
                            <select
                              value={pos.aggregationLevel}
                              onChange={(e) => updatePosition(idx, "aggregationLevel", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "6px 32px 6px 10px",
                                fontSize: "13px",
                                fontWeight: 600,
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                background: "white",
                                appearance: "none",
                                color: lc.color,
                                backgroundColor: lc.bg,
                                cursor: "pointer",
                              }}
                            >
                              {AGGREGATION_LEVELS.map((level) => (
                                <option key={level} value={level}>
                                  {AGGREGATION_LEVEL_LABEL[level]}
                                </option>
                              ))}
                            </select>
                            <Box position="absolute" right={2} top="50%" transform="translateY(-50%)" pointerEvents="none">
                              <FiChevronDown fontSize="0.8rem" color={lc.color} />
                            </Box>
                          </Box>
                        </VStack>
                      </VStack>

                      {/* Remove */}
                      <button
                        type="button" onClick={() => removePosition(idx)}
                        style={{
                          width: "28px", height: "28px", borderRadius: "8px",
                          border: "1px solid #e5e7eb", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          color: "#d1d5db", cursor: "pointer", flexShrink: 0,
                          background: "transparent", transition: "all 0.15s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#ef4444" }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#d1d5db" }}
                      >
                        <FiTrash2 fontSize="0.75rem" />
                      </button>
                    </HStack>
                  </Box>
                )
              })}

              {/* Add position */}
              <button
                type="button" onClick={addPosition}
                style={{
                  padding: "12px 16px", borderRadius: "12px",
                  border: "1.5px dashed #e5e7eb", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: "8px",
                  color: "#9ca3af", cursor: "pointer", background: "transparent",
                  width: "100%", transition: "all 0.15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "#C9D927"; e.currentTarget.style.color = "#4b5563"; e.currentTarget.style.background = "#fafff0" }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent" }}
              >
                <FiPlus fontSize="0.85rem" />
                <Text fontSize="sm" fontWeight="600">Add position</Text>
              </button>
            </VStack>
          </Box>

          {/* Error */}
          {error && (
            <Box bg="#fef2f2" borderWidth="1px" borderColor="#fecaca" borderRadius="xl" px={4} py={3}>
              <Text fontSize="sm" color="#dc2626">{error}</Text>
            </Box>
          )}

          {/* Actions */}
          <HStack gap={3} justify="flex-end">
            <Link href="/elections">
              <Box px={5} py={2.5} borderRadius="lg" borderWidth="1.5px" borderColor="gray.200"
                fontSize="sm" fontWeight="600" color="gray.600" cursor="pointer"
                _hover={{ bg: "gray.50" }} transition="all 0.15s">
                Cancel
              </Box>
            </Link>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: "10px 24px", borderRadius: "8px",
                background: isPending ? "#e5e7eb" : "#C9D927",
                color: isPending ? "#9ca3af" : "#0f172a",
                fontSize: "14px", fontWeight: 700,
                cursor: isPending ? "not-allowed" : "pointer",
                border: "none", transition: "all 0.15s",
              }}
            >
              {isPending ? "Creating…" : "Create Election"}
            </button>
          </HStack>
        </VStack>
      </Box>
    </VStack>
  )
}
