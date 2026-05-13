"use client"

import { useEffect, useImperativeHandle, useState } from "react"
import {
  Box, Text, VStack, HStack, Input, Flex,
} from "@chakra-ui/react"
import { FiUserPlus, FiCheck, FiX, FiSearch } from "react-icons/fi"
import { useQuery } from "@tanstack/react-query"
import { getElectionsLight, assignAgentToStream, getStreamsByElection } from "@/services/Elections"
import { getUsers } from "@/services/Users"
import useSyncMutation from "@/hooks/hooks/useSyncMutation"
import React from "react"

interface Props {
  onAssigned?: () => void
  formRef?: React.MutableRefObject<{ prefill: (electionId: string, agentId: string) => void } | null>
}

type StreamOption = {
  id: string
  label: string // "Ward / Station / Stream"
}

export default function AssignAgentForm({ onAssigned, formRef }: Props) {
  const [electionId, setElectionId] = useState("")
  const [streamSearch, setStreamSearch] = useState("")
  const [selectedStreamId, setSelectedStreamId] = useState("")
  const [streamFocused, setStreamFocused] = useState(false)
  const [agentSearch, setAgentSearch] = useState("")
  const [agentFocused, setAgentFocused] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useImperativeHandle(formRef, () => ({
    prefill: (eid: string, aid: string) => {
      setElectionId(eid)
      setSelectedAgentId(aid)
      setSelectedStreamId("")
      setStreamSearch("")
    },
  }))

  // ── Data ─────────────────────────────────────────────────────────────────

  const { data: elections = [] } = useQuery({
    queryKey: ["elections-light"],
    queryFn: () => getElectionsLight(),
  })

  const { data: rawStreams = [], isFetching: streamsLoading } = useQuery({
    queryKey: ["streams", electionId],
    queryFn: () => getStreamsByElection(electionId),
    enabled: !!electionId,
  })

  const { data: rawUsers = [] } = useQuery({
    queryKey: ["users-all"],
    queryFn: () => getUsers(),
  })

  // reset stream/agent when election changes
  useEffect(() => {
    setSelectedStreamId("")
    setStreamSearch("")
    setSelectedAgentId("")
    setAgentSearch("")
  }, [electionId])

  // ── Derived options ──────────────────────────────────────────────────────

  const streamOptions: StreamOption[] = rawStreams.map((s) => ({
    id: s.id,
    label: `${s.pollingStation.ward} / ${s.pollingStation.name} / ${s.name}`,
  }))

  const filteredStreams = streamSearch
    ? streamOptions.filter((s) => s.label.toLowerCase().includes(streamSearch.toLowerCase()))
    : streamOptions.slice(0, 50)

  const filteredUsers = (rawUsers as Array<{ id: string; firstname: string; othernames: string; email: string }>)
    .filter((u) => {
      if (!agentSearch) return true
      const q = agentSearch.toLowerCase()
      return (
        u.firstname.toLowerCase().includes(q) ||
        u.othernames.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    })
    .slice(0, 50)

  const selectedStream = streamOptions.find((s) => s.id === selectedStreamId)
  const selectedAgent = (rawUsers as Array<{ id: string; firstname: string; othernames: string; email: string }>).find(
    (u) => u.id === selectedAgentId,
  )
  const selectedElection = elections.find((e) => e.id === electionId)

  // ── Mutation ─────────────────────────────────────────────────────────────

  const assignMutation = useSyncMutation(
    async () => {
      if (!electionId || !selectedStreamId || !selectedAgentId) throw new Error("Please fill all fields.")
      return assignAgentToStream(electionId, selectedStreamId, selectedAgentId)
    },
    {
      onSuccess: () => {
        setSuccess(true)
        setSelectedStreamId("")
        setStreamSearch("")
        setSelectedAgentId("")
        setAgentSearch("")
        setError("")
        onAssigned?.()
        setTimeout(() => setSuccess(false), 3000)
      },
      onError: (e: Error) => setError(e.message),
    },
  )

  const canSubmit = electionId && selectedStreamId && selectedAgentId && !assignMutation.isPending

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.100"
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
      overflow="hidden"
    >
      {/* Header */}
      <HStack
        px={5}
        py={4}
        bg="#f8fafc"
        borderBottomWidth="1px"
        borderBottomColor="gray.100"
        gap={3}
      >
        <Flex
          w={9}
          h={9}
          borderRadius="lg"
          bg="#eff9d1"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <FiUserPlus fontSize="1rem" color="#798217" />
        </Flex>
        <VStack gap={0} alignItems="flex-start">
          <Text fontWeight="700" fontSize="sm" color="gray.900">
            Assign Agent to Stream
          </Text>
          <Text fontSize="xs" color="gray.400">
            Manually assign one agent to one stream
          </Text>
        </VStack>
      </HStack>

      <VStack px={5} py={5} gap={4} alignItems="stretch">
        {/* Election */}
        <VStack gap={1} alignItems="stretch">
          <Text fontSize="xs" fontWeight="600" color="gray.600">Election</Text>
          <select
            value={electionId}
            onChange={(e) => setElectionId(e.target.value)}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "14px",
              color: electionId ? "#111827" : "#9ca3af",
              background: "white",
              cursor: "pointer",
              width: "100%",
              outline: "none",
            }}
          >
            <option value="">Select election…</option>
            {elections.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.year})
              </option>
            ))}
          </select>
        </VStack>

        {/* Stream */}
        <VStack gap={1} alignItems="stretch">
          <Text fontSize="xs" fontWeight="600" color="gray.600">Stream</Text>
          {selectedStreamId ? (
            <HStack
              px={3}
              py={2}
              borderWidth="1px"
              borderColor="#798217"
              borderRadius="lg"
              justify="space-between"
            >
              <Text fontSize="sm" color="gray.900" flex={1} truncate>
                {selectedStream?.label}
              </Text>
              <Box
                as="button"
                onClick={() => { setSelectedStreamId(""); setStreamSearch("") }}
                color="gray.400"
                _hover={{ color: "gray.700" }}
                cursor="pointer"
              >
                <FiX size={14} />
              </Box>
            </HStack>
          ) : (
            <Box position="relative">
              <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" pointerEvents="none">
                <FiSearch size={13} />
              </Box>
              <Input
                pl={8}
                placeholder={electionId ? (streamsLoading ? "Loading streams…" : "Search streams…") : "Select election first"}
                value={streamSearch}
                onChange={(e) => setStreamSearch(e.target.value)}
                onFocus={() => setStreamFocused(true)}
                onBlur={() => setTimeout(() => setStreamFocused(false), 150)}
                size="sm"
                borderRadius="lg"
                disabled={!electionId || streamsLoading}
              />
              {electionId && streamFocused && filteredStreams.length > 0 && (
                <Box
                  position="absolute"
                  top="calc(100% + 4px)"
                  left={0}
                  right={0}
                  bg="white"
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  boxShadow="md"
                  zIndex={10}
                  maxH="200px"
                  overflowY="auto"
                >
                  {filteredStreams.map((s) => (
                    <Box
                      key={s.id}
                      px={3}
                      py={2}
                      fontSize="sm"
                      cursor="pointer"
                      _hover={{ bg: "#eff9d1" }}
                      onClick={() => { setSelectedStreamId(s.id); setStreamSearch("") }}
                    >
                      {s.label}
                    </Box>
                  ))}
                </Box>
              )}
              {electionId && streamFocused && filteredStreams.length === 0 && !streamsLoading && (
                <Box
                  position="absolute"
                  top="calc(100% + 4px)"
                  left={0}
                  right={0}
                  bg="white"
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  boxShadow="md"
                  zIndex={10}
                  px={3}
                  py={3}
                >
                  <Text fontSize="sm" color="gray.400">No streams found.</Text>
                </Box>
              )}
            </Box>
          )}
        </VStack>

        {/* Agent */}
        <VStack gap={1} alignItems="stretch">
          <Text fontSize="xs" fontWeight="600" color="gray.600">Agent</Text>
          {selectedAgentId ? (
            <HStack
              px={3}
              py={2}
              borderWidth="1px"
              borderColor="#798217"
              borderRadius="lg"
              justify="space-between"
            >
              <Text fontSize="sm" color="gray.900">
                {selectedAgent?.firstname} {selectedAgent?.othernames}
                <Text as="span" fontSize="xs" color="gray.400" ml={1}>({selectedAgent?.email})</Text>
              </Text>
              <Box
                as="button"
                onClick={() => { setSelectedAgentId(""); setAgentSearch("") }}
                color="gray.400"
                _hover={{ color: "gray.700" }}
                cursor="pointer"
              >
                <FiX size={14} />
              </Box>
            </HStack>
          ) : (
            <Box position="relative">
              <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" pointerEvents="none">
                <FiSearch size={13} />
              </Box>
              <Input
                pl={8}
                placeholder="Search agents by name or email…"
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                onFocus={() => setAgentFocused(true)}
                onBlur={() => setTimeout(() => setAgentFocused(false), 150)}
                size="sm"
                borderRadius="lg"
              />
              {agentFocused && filteredUsers.length > 0 && (
                <Box
                  position="absolute"
                  top="calc(100% + 4px)"
                  left={0}
                  right={0}
                  bg="white"
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  boxShadow="md"
                  zIndex={10}
                  maxH="200px"
                  overflowY="auto"
                >
                  {filteredUsers.map((u) => (
                    <Box
                      key={u.id}
                      px={3}
                      py={2}
                      fontSize="sm"
                      cursor="pointer"
                      _hover={{ bg: "#eff9d1" }}
                      onClick={() => { setSelectedAgentId(u.id); setAgentSearch("") }}
                    >
                      <Text fontWeight="600" color="gray.900">{u.firstname} {u.othernames}</Text>
                      <Text fontSize="xs" color="gray.400">{u.email}</Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </VStack>

        {/* Error / Success */}
        {error && (
          <Box px={3} py={2} bg="#fef2f2" borderRadius="lg">
            <Text fontSize="sm" color="#dc2626">{error}</Text>
          </Box>
        )}
        {success && (
          <HStack px={3} py={2} bg="#d1fae5" borderRadius="lg" gap={1.5}>
            <FiCheck color="#065f46" />
            <Text fontSize="sm" fontWeight="600" color="#065f46">
              Agent assigned to {selectedElection?.title ?? "stream"} successfully.
            </Text>
          </HStack>
        )}

        {/* Submit */}
        <Box
          as="button"
          onClick={() => assignMutation.mutate(undefined)}
          aria-disabled={!canSubmit} pointerEvents={!canSubmit ? "none" : "auto"}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          gap={1.5}
          px={4}
          py={2.5}
          bg={canSubmit ? "#798217" : "gray.200"}
          color={canSubmit ? "white" : "gray.400"}
          borderRadius="lg"
          fontSize="sm"
          fontWeight="600"
          cursor={canSubmit ? "pointer" : "not-allowed"}
          _hover={canSubmit ? { bg: "#6a7314" } : {}}
          transition="background 0.15s"
          alignSelf="flex-end"
        >
          <FiUserPlus />
          <Text>{assignMutation.isPending ? "Assigning…" : "Assign Agent"}</Text>
        </Box>
      </VStack>
    </Box>
  )
}
