"use client"

import { useState } from "react"
import {
  Box, Text, VStack, HStack, Badge, Flex,
} from "@chakra-ui/react"
import { FiUsers, FiTrash2, FiRefreshCw } from "react-icons/fi"
import { MdHowToVote } from "react-icons/md"
import { useQueryClient } from "@tanstack/react-query"
import { removeAgentAssignment } from "@/services/Elections"
import StyledIconButton from "@/components/Generic/StyledIconButton"
import { createToaster } from "@chakra-ui/react"

const toaster = createToaster({ placement: "top-end" })

type Assignment = {
  id: string
  agentId: string
  electionId: string
  agent: { id: string; firstname: string; othernames: string; email: string }
  stream: {
    name: string
    code: string
    pollingStation: { name: string; ward: string; constituency: string; county: string }
  }
}

type ElectionGroup = {
  election: { id: string; title: string; year: number; isActive: boolean }
  assignments: Assignment[]
}

export default function AssignmentList({ data, onReassign }: { data: Record<string, ElectionGroup>; onReassign?: (electionId: string, agentId: string) => void }) {
  const queryClient = useQueryClient()
  const [removing, setRemoving] = useState<string | null>(null)

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this agent assignment?")) return
    setRemoving(id)
    try {
      await removeAgentAssignment(id)
      queryClient.invalidateQueries({ queryKey: ["agent-assignments"] })
      window.location.reload()
    } catch (e: unknown) {
      toaster.error({ title: "Failed to remove assignment", description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setRemoving(null)
    }
  }

  if (Object.keys(data).length === 0) {
    return (
      <Box
        bg="white" borderRadius="xl" p={12} textAlign="center"
        borderWidth="2px" borderStyle="dashed" borderColor="gray.200"
      >
        <Flex w={16} h={16} borderRadius="2xl" bg="#eff9d1" align="center" justify="center" mx="auto" mb={4}>
          <FiUsers fontSize="2rem" color="#798217" />
        </Flex>
        <Text fontWeight="700" fontSize="lg" color="gray.700" mb={1}>No agent assignments yet</Text>
        <Text fontSize="sm" color="gray.400">
          Assign agents to streams within each election to enable results data entry.
        </Text>
      </Box>
    )
  }

  return (
    <VStack gap={4} alignItems="stretch">
      {Object.values(data).map(({ election, assignments }) => {
        const agentsInElection = new Map<string, { name: string; email: string; streams: Assignment[] }>()
        for (const a of assignments) {
          const existing = agentsInElection.get(a.agentId)
          if (existing) {
            existing.streams.push(a)
          } else {
            agentsInElection.set(a.agentId, {
              name: `${a.agent.firstname} ${a.agent.othernames}`,
              email: a.agent.email,
              streams: [a],
            })
          }
        }

        return (
          <Box
            key={election.id} bg="white" borderRadius="xl" borderWidth="1px"
            borderColor="gray.100" boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden"
          >
            {/* Election header */}
            <HStack
              px={5} py={4} bg="#f8fafc" borderBottomWidth="1px" borderBottomColor="gray.100"
              justify="space-between" flexWrap="wrap" gap={2}
            >
              <HStack gap={3}>
                <Flex w={10} h={10} borderRadius="lg" bg="#eff9d1" align="center" justify="center" flexShrink={0}>
                  <MdHowToVote fontSize="1.2rem" color="#798217" />
                </Flex>
                <VStack gap={0} alignItems="flex-start">
                  <Text fontWeight="700" fontSize="sm" color="gray.900">{election.title}</Text>
                  <HStack gap={2}>
                    <Badge px={2} py={0.5} borderRadius="full" bg="#eff9d1" color="#798217" fontSize="xs" fontWeight="700">
                      {election.year}
                    </Badge>
                    <Badge
                      px={2} py={0.5} borderRadius="full" fontSize="xs" fontWeight="700"
                      bg={election.isActive ? "#d1fae5" : "#f3f4f6"}
                      color={election.isActive ? "#065f46" : "#6b7280"}
                    >
                      {election.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>
              <Text fontSize="sm" color="gray.500" fontWeight="600">
                {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} · {agentsInElection.size} agent{agentsInElection.size !== 1 ? "s" : ""}
              </Text>
            </HStack>

            {/* Agents */}
            <VStack px={5} py={4} gap={3} alignItems="stretch">
              {Array.from(agentsInElection.entries()).map(([agentId, agent]) => (
                <Box key={agentId}>
                  <HStack gap={3} mb={2}>
                    <Flex w={8} h={8} borderRadius="full" bg="#e0e7ff" align="center" justify="center" flexShrink={0}>
                      <FiUsers fontSize="0.85rem" color="#4f46e5" />
                    </Flex>
                    <VStack gap={0} alignItems="flex-start" flex={1}>
                      <Text fontSize="sm" fontWeight="600" color="gray.900">{agent.name}</Text>
                      <Text fontSize="xs" color="gray.400">{agent.email}</Text>
                    </VStack>
                    <Badge px={2} py={0.5} borderRadius="full" bg="#f1f5f9" color="#475569" fontSize="xs" fontWeight="600">
                      {agent.streams.length} stream{agent.streams.length !== 1 ? "s" : ""}
                    </Badge>
                  </HStack>

                  {/* Stream rows */}
                  <VStack gap={1} alignItems="stretch" pl={11}>
                    {agent.streams.map((a) => (
                      <HStack
                        key={a.id} px={3} py={1.5} borderRadius="md" bg="#f8fafc"
                        borderWidth="1px" borderColor="gray.100" justify="space-between"
                      >
                        <Text fontSize="xs" color="gray.600">
                          <Text as="span" fontWeight="600">{a.stream.pollingStation.ward}</Text>
                          {" / "}{a.stream.pollingStation.name}
                          {" / "}<Text as="span" fontWeight="600">{a.stream.name}</Text>
                          <Text as="span" color="gray.400" ml={1}>({a.stream.code})</Text>
                        </Text>
                        <HStack gap={1}>
                          {onReassign && (
                            <StyledIconButton
                              variant="edit"
                              aria-label="Reassign agent to different stream"
                              size="xs"
                              title="Reassign to another stream"
                              onClick={() => onReassign(a.electionId, a.agentId)}
                            >
                              <FiEdit2 size={10} />
                            </StyledIconButton>
                          )}
                          <StyledIconButton
                            variant="delete"
                            aria-label="Remove assignment"
                            size="xs"
                            onClick={() => handleRemove(a.id)}
                            opacity={removing === a.id ? 0.5 : 1}
                          >
                            <FiTrash2 size={11} />
                          </StyledIconButton>
                        </HStack>
                        {onReassign && (
                          <StyledIconButton
                            variant="edit"
                            aria-label="Reassign agent to different stream"
                            size="xs"
                            title="Reassign to a different stream"
                            onClick={() => onReassign(a.electionId, a.agentId)}
                          >
                            <FiRefreshCw size={11} />
                          </StyledIconButton>
                        )}
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </Box>
        )
      })}
    </VStack>
  )
}
