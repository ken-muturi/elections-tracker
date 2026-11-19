"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge, Box, Button, CloseButton, Drawer, HStack, Link, Portal, Spinner, Text, VStack } from "@chakra-ui/react"
import { getProjectsForCard, ProjectRowData } from "@/services/Hesabu"
import { SOURCE_INFO, SourceKey } from "@/constants/hesabu-sources"
import { fmtKesShort, projectTotalLabel } from "./project-format"

type Props = {
  open: boolean
  onClose: () => void
  countyCode: string
  fiscalYear: string
  /** null = county-wide bucket */
  cardName: string | null
  label: string
}

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  stalled: { label: "Stalled", bg: "#E63946", color: "#fff" },
  ongoing: { label: "Ongoing", bg: "#E9C46A", color: "#0B0F1A" },
  completed: { label: "Completed", bg: "#2A9D8F", color: "#fff" },
  unknown: { label: "Status unknown", bg: "#e2e8f0", color: "#334155" },
}

const sourceLabel = (key: string) =>
  key in SOURCE_INFO ? SOURCE_INFO[key as SourceKey].name.split(" — ")[0] : key

export const ProjectDrawer = ({ open, onClose, countyCode, fiscalYear, cardName, label }: Props) => {
  const [rows, setRows] = useState<ProjectRowData[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setRows(null)
    setError(null)
    setStatus(null)
    setSource(null)
    getProjectsForCard(countyCode, fiscalYear, cardName)
      .then((r) => { if (!cancelled) setRows(r) })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load projects") })
    return () => { cancelled = true }
  }, [open, countyCode, fiscalYear, cardName, attempt])

  const statuses = useMemo(() => [...new Set((rows ?? []).map((r) => r.status))], [rows])
  const sources = useMemo(() => [...new Set((rows ?? []).flatMap((r) => r.sources.map((s) => s.source)))], [rows])
  const visible = (rows ?? []).filter(
    (r) => (!status || r.status === status) && (!source || r.sources.some((s) => s.source === source))
  )
  const summary = rows && {
    cardName,
    count: rows.length,
    withAmount: rows.filter((r) => r.budgetAllocated != null).length,
    totalAllocated: rows.reduce((s, r) => s + (r.budgetAllocated ?? 0), 0),
  }

  const chip = (active: boolean, text: string, onClick: () => void) => (
    <Button key={text} size="xs" px={2} variant={active ? "solid" : "outline"} colorPalette="teal" onClick={onClick}>
      {text}
    </Button>
  )

  return (
    <Drawer.Root open={open} onOpenChange={(e) => { if (!e.open) onClose() }} placement="end" size="md">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header flexDirection="column" alignItems="start" gap={1} px={5} pt={5} pb={3} pr={12}>
              <Drawer.Title>{label}</Drawer.Title>
              <Text fontSize="sm" color="gray.500">
                FY {fiscalYear}
                {summary ? ` · ${summary.count} project${summary.count === 1 ? "" : "s"} · ${projectTotalLabel(summary)}` : ""}
              </Text>
            </Drawer.Header>

            <Drawer.Body px={5} pb={5}>
              {!rows && !error && <HStack justify="center" py={10}><Spinner /></HStack>}

              {error && (
                <VStack py={10} gap={3}>
                  <Text color="red.600" fontSize="sm">Couldn&apos;t load projects: {error}</Text>
                  <Button size="sm" onClick={() => setAttempt((n) => n + 1)}>Retry</Button>
                </VStack>
              )}

              {rows && rows.length === 0 && (
                <Text color="gray.500" fontSize="sm" py={10} textAlign="center">No documented projects for FY {fiscalYear}.</Text>
              )}

              {rows && rows.length > 0 && (
                <>
                  <HStack gap={1} flexWrap="wrap" mb={2}>
                    {chip(!status, "All statuses", () => setStatus(null))}
                    {statuses.map((s) => chip(status === s, STATUS[s]?.label ?? s, () => setStatus(s)))}
                  </HStack>
                  <HStack gap={1} flexWrap="wrap" mb={4}>
                    {chip(!source, "All sources", () => setSource(null))}
                    {sources.map((s) => chip(source === s, sourceLabel(s), () => setSource(s)))}
                  </HStack>

                  <VStack align="stretch" gap={3}>
                    {visible.map((r) => {
                      const st = STATUS[r.status] ?? STATUS.unknown
                      const isOpen = expanded.has(r.id)
                      return (
                        <Box key={r.id} border="1px solid" borderColor="gray.200" borderRadius="lg" p={3}>
                          <HStack justify="space-between" align="start" gap={3}>
                            <Text fontWeight="semibold" fontSize="sm" color="gray.900">{r.title}</Text>
                            <Text fontWeight="bold" fontSize="sm" whiteSpace="nowrap" color={r.budgetAllocated == null ? "gray.400" : "gray.900"}>
                              {r.budgetAllocated == null ? "Amount not stated" : fmtKesShort(r.budgetAllocated)}
                            </Text>
                          </HStack>
                          <HStack gap={2} mt={2} flexWrap="wrap">
                            <Badge bg={st.bg} color={st.color} borderRadius="full" px={2} fontSize="2xs">{st.label}</Badge>
                            <Text fontSize="xs" color="gray.500">{r.sector}</Text>
                            {r.sources.map((s) => (
                              <Link key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" fontSize="2xs" color="teal.700"
                                border="1px solid" borderColor="teal.200" borderRadius="full" px={2} py={0.5}>
                                {sourceLabel(s.source)} ↗
                              </Link>
                            ))}
                          </HStack>
                          {r.matchedOn && (
                            <Text fontSize="2xs" color="gray.400" mt={1}>Matched on: {r.locationText ?? r.matchedOn}</Text>
                          )}
                          <Text
                            fontSize="xs" color="gray.600" mt={2} lineClamp={isOpen ? undefined : 2} cursor="pointer"
                            onClick={() => setExpanded((prev) => {
                              const next = new Set(prev)
                              if (next.has(r.id)) next.delete(r.id)
                              else next.add(r.id)
                              return next
                            })}
                          >
                            {r.summary}
                          </Text>
                        </Box>
                      )
                    })}
                  </VStack>
                </>
              )}
            </Drawer.Body>

            <Drawer.Footer px={5} py={3} borderTop="1px solid" borderColor="gray.100" justifyContent="flex-start">
              <Text fontSize="2xs" color="gray.500">
                Projects are compiled from public documents. Card totals above are separate estimates.
              </Text>
            </Drawer.Footer>

            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" position="absolute" top={3} right={3} />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
