"use client"

import { useState, useTransition } from "react"
import { Box, Text, HStack, Button, VStack } from "@chakra-ui/react"
import { ReportData, CountyFull } from "@/services/Hesabu"
import { ReportCard } from "./ReportCard"
import { ReportForm } from "./ReportForm"
import { voteOnReport } from "@/services/Hesabu"

type Filter = "ALL" | "UNRESOLVED" | "INVESTIGATING" | "RESOLVED"

type Props = {
  county: CountyFull
  initialReports: ReportData[]
}

export const CitizenReports = ({ county, initialReports }: Props) => {
  const [reports, setReports] = useState<ReportData[]>(initialReports)
  const [filter, setFilter] = useState<Filter>("ALL")
  const [showForm, setShowForm] = useState(false)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const filtered =
    filter === "ALL" ? reports : reports.filter((r) => r.status === filter)

  const handleVote = (reportId: string) => {
    if (votedIds.has(reportId)) return

    // Optimistic update
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, votes: r.votes + 1 } : r))
    )
    setVotedIds((prev) => new Set([...prev, reportId]))

    // Server call
    const fp = `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
    startTransition(() => {
      voteOnReport(reportId, fp).catch(() => {
        // Revert on failure
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, votes: r.votes - 1 } : r))
        )
        setVotedIds((prev) => {
          const next = new Set(prev)
          next.delete(reportId)
          return next
        })
      })
    })
  }

  const handleReportSuccess = () => {
    setShowForm(false)
    // Reload reports from server — simple window reload for now
    window.location.reload()
  }

  const filterButtons: { label: string; value: Filter }[] = [
    { label: "All", value: "ALL" },
    { label: "Unresolved", value: "UNRESOLVED" },
    { label: "Investigating", value: "INVESTIGATING" },
    { label: "Resolved", value: "RESOLVED" },
  ]

  return (
    <Box>
      {/* Header row */}
      <HStack justify="space-between" mb={4} flexWrap="wrap" gap={3}>
        <Text fontWeight="bold" color="gray.700" fontSize="md">
          Service Delivery Gap Reports
        </Text>
        <Button
          bg="#0f172a"
          color="white"
          fontWeight="bold"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          _hover={{ bg: "#1e3a5f" }}
        >
          {showForm ? "✕ Cancel" : "+ Flag a Gap"}
        </Button>
      </HStack>

      {/* Inline form */}
      {showForm && (
        <Box
          bg="gray.50"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={5}
          mb={4}
        >
          <Text fontWeight="bold" color="gray.700" mb={3} fontSize="sm">
            🚩 Flag a Service Delivery Gap
          </Text>
          <ReportForm
            county={county}
            onSuccess={handleReportSuccess}
            onCancel={() => setShowForm(false)}
          />
        </Box>
      )}

      {/* Filter pills */}
      <HStack gap={2} mb={4} flexWrap="wrap">
        {filterButtons.map((btn) => {
          const isActive = filter === btn.value
          return (
            <Box
              key={btn.value}
              as="button"
              px={3}
              py={1.5}
              borderRadius="full"
              fontSize="xs"
              fontWeight={isActive ? "bold" : "normal"}
              bg={isActive ? "#0f172a" : "gray.100"}
              color={isActive ? "white" : "gray.500"}
              cursor="pointer"
              onClick={() => setFilter(btn.value)}
              _hover={{ bg: isActive ? "#0f172a" : "gray.200" }}
              transition="all 0.15s"
            >
              {btn.label}
            </Box>
          )
        })}
      </HStack>

      {/* Report list */}
      {filtered.length === 0 ? (
        <Box
          bg="gray.50"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={8}
          textAlign="center"
        >
          <Text fontSize="2xl" mb={2}>🎉</Text>
          <Text color="gray.500" fontSize="sm">
            No {filter !== "ALL" ? filter.toLowerCase() : ""} reports for this county.
          </Text>
        </Box>
      ) : (
        <VStack gap={2} align="stretch">
          {filtered
            .sort((a, b) => b.votes - a.votes)
            .map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onVote={handleVote}
                hasVoted={votedIds.has(report.id)}
              />
            ))}
        </VStack>
      )}
    </Box>
  )
}
