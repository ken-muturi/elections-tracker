"use client"

import { useState } from "react"
import { Box, Text, VStack, HStack, Button } from "@chakra-ui/react"
import { CountyFull } from "@/services/Hesabu"
import { createReport } from "@/services/Hesabu"

type Props = {
  county: CountyFull
  onSuccess: () => void
  onCancel: () => void
}

export const ReportForm = ({ county, onSuccess, onCancel }: Props) => {
  const [wardId, setWardId] = useState("")
  const [sectorId, setSectorId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputStyle = {
    bg: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "10px 12px",
    color: "#0f172a",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    background: "white",
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wardId || !sectorId || !title.trim()) {
      setError("Please fill in all required fields.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await createReport({
        countyId: county.id,
        wardId,
        sectorId,
        title: title.trim(),
        description: description.trim() || undefined,
      })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit report.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack gap={4} align="stretch">
<Text fontSize="sm" color="gray.500">
          Help hold the county government accountable by reporting service delivery gaps in your area.
        </Text>

        {/* Ward selector */}
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="wider">
            Ward *
          </Text>
          <select
            value={wardId}
            onChange={(e) => setWardId(e.target.value)}
            style={{ ...inputStyle } as React.CSSProperties}
            required
          >
            <option value="">Select ward…</option>
            {county.wards.map((w) => (
              <option key={w.id} value={w.id} style={{ background: "#141824" }}>
                {w.name}
              </option>
            ))}
          </select>
        </Box>

        {/* Sector selector */}
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="wider">
            Sector *
          </Text>
          <select
            value={sectorId}
            onChange={(e) => setSectorId(e.target.value)}
            style={{ ...inputStyle } as React.CSSProperties}
            required
          >
            <option value="">Select sector…</option>
            {county.sectors.map((s) => (
              <option key={s.id} value={s.id} style={{ background: "#141824" }}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>
        </Box>

        {/* Title */}
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="wider">
            Report Title *
          </Text>
          <input
            type="text"
            placeholder="Briefly describe the service delivery gap…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            style={{ ...inputStyle } as React.CSSProperties}
            required
          />
        </Box>

        {/* Description */}
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="wider">
            Details (optional)
          </Text>
          <textarea
            placeholder="Provide more context — what was promised, what's missing, impact on community…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
            } as React.CSSProperties}
          />
        </Box>

        {error && (
          <Text fontSize="sm" color="#E63946">
            {error}
          </Text>
        )}

        <HStack gap={3} justify="flex-end">
          <Button
            variant="ghost"
            color="whiteAlpha.600"
            onClick={onCancel}
            disabled={submitting}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            bg="#0f172a"
            color="white"
            fontWeight="bold"
            size="sm"
            loading={submitting}
            loadingText="Submitting…"
            _hover={{ bg: "#1e3a5f" }}
          >
            Submit Report
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}
