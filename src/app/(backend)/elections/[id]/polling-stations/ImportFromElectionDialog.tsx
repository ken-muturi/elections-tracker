"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Text, VStack, HStack, Box, Flex, Portal, Dialog, Spinner } from "@chakra-ui/react"
import { FiDownload, FiX, FiCheck, FiChevronDown } from "react-icons/fi"
import { toaster } from "@/components/ui/toaster"
import { getElectionsLight } from "@/services/Elections"
import { getElectionCountyNames, previewPollingStationsImport, importPollingStationsFromElection } from "@/services/Hierarchy"

import StepSelectElection from "./import/StepSelectElection"
import StepFilterCounties from "./import/StepFilterCounties"
import StepPreview from "./import/StepPreview"
import type { ElectionLight, PreviewResult } from "./import/types"

const STEPS = [
  { n: 1, label: "Source Election" },
  { n: 2, label: "Filter Counties" },
  { n: 3, label: "Preview & Import" },
] as const

interface Props {
  targetElectionId: string
  targetElectionTitle: string
}

export default function ImportFromElectionDialog({ targetElectionId, targetElectionTitle }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1
  const [elections, setElections] = useState<ElectionLight[]>([])
  const [sourceElectionId, setSourceElectionId] = useState("")
  const [loadingElections, setLoadingElections] = useState(false)

  // Step 2
  const [counties, setCounties] = useState<string[]>([])
  const [selectedCounties, setSelectedCounties] = useState<string[]>([])
  const [loadingCounties, setLoadingCounties] = useState(false)

  // Step 3
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Reset on open
  useEffect(() => {
    if (!open) return
    setStep(1)
    setSourceElectionId("")
    setSelectedCounties([])
    setPreview(null)
    setLoadingElections(true)
    getElectionsLight()
      .then((list) => setElections(list.filter((e) => e.id !== targetElectionId)))
      .catch(() => toaster.error({ title: "Could not load elections" }))
      .finally(() => setLoadingElections(false))
  }, [open, targetElectionId])

  // Load counties when source changes
  useEffect(() => {
    if (!sourceElectionId) return
    setSelectedCounties([])
    setPreview(null)
    setLoadingCounties(true)
    getElectionCountyNames(sourceElectionId)
      .then(setCounties)
      .catch(() => toaster.error({ title: "Could not load counties" }))
      .finally(() => setLoadingCounties(false))
  }, [sourceElectionId])

  const toggleCounty = (name: string) =>
    setSelectedCounties((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    )

  const toggleAllCounties = () =>
    setSelectedCounties((prev) => (prev.length === counties.length ? [] : [...counties]))

  const loadPreview = async () => {
    setLoadingPreview(true)
    try {
      const result = await previewPollingStationsImport(targetElectionId, sourceElectionId, {
        countyNames: selectedCounties.length ? selectedCounties : undefined,
      })
      setPreview(result)
      setStep(3)
    } catch (e) {
      toaster.error({ title: "Preview failed", description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleImport = () => {
    startTransition(async () => {
      try {
        const result = await importPollingStationsFromElection(
          targetElectionId, sourceElectionId,
          { countyNames: selectedCounties.length ? selectedCounties : undefined }
        )
        toaster.success({
          title: "Import complete",
          description: `${result.wardsCreated} wards, ${result.stationsCreated} stations, ${result.streamsCreated} streams added`,
        })
        setOpen(false)
        router.refresh()
      } catch (e) {
        toaster.error({ title: "Import failed", description: e instanceof Error ? e.message : "Unknown error" })
      }
    })
  }

  return (
    <>
      {/* Trigger button */}
      <HStack
        as="button" gap={2} px={4} py={2} bg="white" color="gray.700"
        borderRadius="lg" borderWidth="1px" borderColor="gray.200"
        fontSize="sm" fontWeight="600" cursor="pointer"
        _hover={{ bg: "gray.50", borderColor: "gray.300" }} transition="all 0.15s"
        onClick={() => setOpen(true)}
      >
        <FiDownload fontSize="0.9rem" />
        <Text>Import from Previous Elections</Text>
      </HStack>

      <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)} size="lg">
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl" overflow="hidden" maxW="600px">
              {/* Header */}
              <Dialog.Header bg="#f8fafc" px={6} py={4} borderBottomWidth="1px" borderBottomColor="gray.100">
                <HStack justify="space-between" w="full">
                  <VStack alignItems="flex-start" gap={0}>
                    <Text fontWeight="700" fontSize="lg" color="gray.900">Import from Previous Elections</Text>
                    <Text fontSize="sm" color="gray.500">into <strong>{targetElectionTitle}</strong></Text>
                  </VStack>
                  <Dialog.CloseTrigger asChild>
                    <Flex w={8} h={8} borderRadius="full" bg="gray.100" align="center" justify="center" cursor="pointer" _hover={{ bg: "gray.200" }}>
                      <FiX fontSize="1rem" color="#6b7280" />
                    </Flex>
                  </Dialog.CloseTrigger>
                </HStack>
              </Dialog.Header>

              <Dialog.Body px={6} py={5}>
                <VStack gap={5} alignItems="stretch">
                  {/* Step indicator */}
                  <HStack gap={2}>
                    {STEPS.map(({ n, label }) => (
                      <HStack key={n} gap={1.5} opacity={step >= n ? 1 : 0.4}>
                        <Flex
                          w={6} h={6} borderRadius="full"
                          bg={step >= n ? "#0f172a" : "gray.200"}
                          color="white" align="center" justify="center"
                          fontSize="xs" fontWeight="700"
                        >
                          {step > n ? <FiCheck /> : n}
                        </Flex>
                        <Text fontSize="xs" fontWeight="600" color={step >= n ? "gray.800" : "gray.400"}>
                          {label}
                        </Text>
                        {n < 3 && <Box flex={1} h="1px" bg="gray.200" minW={4} />}
                      </HStack>
                    ))}
                  </HStack>

                  {/* Step panels */}
                  {step === 1 && (
                    <StepSelectElection
                      elections={elections}
                      loading={loadingElections}
                      selectedId={sourceElectionId}
                      onSelect={setSourceElectionId}
                    />
                  )}
                  {step === 2 && (
                    <StepFilterCounties
                      counties={counties}
                      selected={selectedCounties}
                      loading={loadingCounties}
                      onToggle={toggleCounty}
                      onToggleAll={toggleAllCounties}
                    />
                  )}
                  {step === 3 && preview && <StepPreview preview={preview} />}
                </VStack>
              </Dialog.Body>

              {/* Footer navigation */}
              <Dialog.Footer px={6} pb={6} pt={0}>
                <HStack justify="space-between" w="full">
                  {/* Left: Cancel or Back */}
                  {step === 1 ? (
                    <Dialog.CloseTrigger asChild>
                      <HStack
                        gap={1.5} px={4} py={2} borderRadius="lg" cursor="pointer"
                        bg="white" borderWidth="1px" borderColor="gray.200"
                        _hover={{ bg: "gray.50" }} transition="all 0.15s"
                      >
                        <Text fontSize="sm" fontWeight="600" color="gray.600">Cancel</Text>
                      </HStack>
                    </Dialog.CloseTrigger>
                  ) : (
                    <HStack
                      gap={1.5} px={4} py={2} borderRadius="lg" cursor="pointer"
                      bg="white" borderWidth="1px" borderColor="gray.200"
                      _hover={{ bg: "gray.50" }} transition="all 0.15s"
                      pointerEvents={isPending || loadingPreview ? "none" : "auto"}
                      opacity={isPending || loadingPreview ? 0.5 : 1}
                      onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                    >
                      <FiChevronDown fontSize="0.85rem" color="#6b7280" style={{ transform: "rotate(90deg)" }} />
                      <Text fontSize="sm" fontWeight="600" color="gray.600">Back</Text>
                    </HStack>
                  )}

                  {/* Right: Next / Preview / Confirm */}
                  {step === 1 && (
                    <HStack
                      gap={1.5} px={4} py={2} borderRadius="lg" cursor="pointer"
                      bg={sourceElectionId ? "#0f172a" : "gray.200"}
                      color={sourceElectionId ? "white" : "gray.400"}
                      _hover={sourceElectionId ? { bg: "#1e293b" } : {}}
                      transition="all 0.15s"
                      pointerEvents={sourceElectionId ? "auto" : "none"}
                      onClick={() => setStep(2)}
                    >
                      <Text fontSize="sm" fontWeight="600">Next</Text>
                      <FiChevronDown fontSize="0.85rem" style={{ transform: "rotate(-90deg)" }} />
                    </HStack>
                  )}

                  {step === 2 && (
                    <HStack
                      gap={1.5} px={4} py={2} borderRadius="lg" cursor="pointer"
                      bg="#0f172a" color="white" _hover={{ bg: "#1e293b" }} transition="all 0.15s"
                      pointerEvents={loadingPreview ? "none" : "auto"}
                      opacity={loadingPreview ? 0.7 : 1}
                      onClick={loadPreview}
                    >
                      {loadingPreview ? (
                        <><Spinner size="xs" /><Text fontSize="sm" fontWeight="600">Loading…</Text></>
                      ) : (
                        <><Text fontSize="sm" fontWeight="600">Preview</Text>
                        <FiChevronDown fontSize="0.85rem" style={{ transform: "rotate(-90deg)" }} /></>
                      )}
                    </HStack>
                  )}

                  {step === 3 && (
                    <HStack
                      gap={1.5} px={4} py={2} borderRadius="lg" cursor="pointer"
                      bg="#16a34a" color="white" _hover={{ bg: "#15803d" }} transition="all 0.15s"
                      pointerEvents={isPending ? "none" : "auto"}
                      opacity={isPending ? 0.6 : 1}
                      onClick={handleImport}
                    >
                      {isPending ? (
                        <><Spinner size="xs" /><Text fontSize="sm" fontWeight="600">Importing…</Text></>
                      ) : (
                        <><FiDownload fontSize="0.9rem" /><Text fontSize="sm" fontWeight="600">Confirm Import</Text></>
                      )}
                    </HStack>
                  )}
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
