"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Text, VStack, HStack, Flex, Input, Textarea, Menu, Portal, Dialog,
} from "@chakra-ui/react"
import { toaster } from "@/components/ui/toaster"
import { updateElection, deleteElection } from "@/services/Elections"
import {
  FiMoreVertical, FiToggleLeft, FiToggleRight,
  FiEdit2, FiTrash2, FiX, FiCheck,
} from "react-icons/fi"

export interface ElectionForActions {
  id: string
  title: string
  year: number
  electionDate: Date | string
  description?: string | null
  isActive: boolean
}

interface Props {
  election: ElectionForActions
  /** "card" = icon-only trigger (list view), "detail" = full button (detail page) */
  variant?: "card" | "detail"
}

export default function ElectionActions({ election, variant = "card" }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ── Edit dialog state ──────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false)
  const [title, setTitle] = useState(election.title)
  const [year, setYear] = useState(String(election.year))
  const [electionDate, setElectionDate] = useState(
    new Date(election.electionDate).toISOString().split("T")[0],
  )
  const [description, setDescription] = useState(election.description ?? "")

  // ── Delete dialog state ────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false)

  // ── Toggle ─────────────────────────────────────────────────────────────
  const handleToggle = () => {
    startTransition(async () => {
      try {
        await updateElection(election.id, { isActive: !election.isActive })
        toaster.success({
          title: election.isActive ? "Election deactivated" : "Election activated",
        })
        router.refresh()
      } catch (e: unknown) {
        toaster.error({ title: "Error", description: e instanceof Error ? e.message : "Unknown error" })
      }
    })
  }

  // ── Save edit ──────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!title.trim() || !year || !electionDate) {
      toaster.error({ title: "Title, year and date are required" })
      return
    }
    startTransition(async () => {
      try {
        await updateElection(election.id, {
          title: title.trim(),
          year: parseInt(year, 10),
          electionDate: new Date(electionDate),
          description: description.trim() || undefined,
        })
        toaster.success({ title: "Election updated" })
        setEditOpen(false)
        router.refresh()
      } catch (e: unknown) {
        toaster.error({ title: "Error", description: e instanceof Error ? e.message : "Unknown error" })
      }
    })
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteElection(election.id)
        toaster.success({ title: "Election deleted" })
        setDeleteOpen(false)
        router.push("/elections")
        router.refresh()
      } catch (e: unknown) {
        toaster.error({ title: "Error", description: e instanceof Error ? e.message : "Unknown error" })
      }
    })
  }

  return (
    <>
      {/* ── Trigger menu ──────────────────────────────────────────────── */}
      <Menu.Root>
        <Menu.Trigger asChild>
          {variant === "detail" ? (
            <HStack
              gap={2} px={3} py={2} bg="white" borderWidth="1px" borderColor="gray.200"
              borderRadius="lg" cursor="pointer" fontSize="sm" fontWeight="600" color="gray.600"
              _hover={{ bg: "gray.50" }} transition="all 0.15s"
            >
              <FiMoreVertical />
              <Text>Actions</Text>
            </HStack>
          ) : (
            <Flex
              w={7} h={7} borderRadius="md" bg="gray.50" align="center" justify="center"
              cursor="pointer" _hover={{ bg: "gray.100" }} transition="all 0.15s"
              onClick={(e) => e.preventDefault()}
            >
              <FiMoreVertical fontSize="0.85rem" color="#6b7280" />
            </Flex>
          )}
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              minW="180px" bg="white" borderRadius="xl"
              boxShadow="0 10px 40px -10px rgba(0,0,0,0.15)"
              borderWidth="1px" borderColor="gray.100" py={1}
            >
              <Menu.Item
                value="toggle" py={2.5} px={3} cursor="pointer"
                onClick={(e) => { e.preventDefault(); handleToggle() }}
              >
                <HStack gap={2}>
                  {election.isActive
                    ? <FiToggleRight fontSize="1rem" color="#ef4444" />
                    : <FiToggleLeft fontSize="1rem" color="#10b981" />}
                  <Text fontSize="sm" fontWeight="500">
                    {election.isActive ? "Deactivate" : "Activate"}
                  </Text>
                </HStack>
              </Menu.Item>

              <Menu.Item
                value="edit" py={2.5} px={3} cursor="pointer"
                onClick={(e) => { e.preventDefault(); setEditOpen(true) }}
              >
                <HStack gap={2}>
                  <FiEdit2 fontSize="0.9rem" color="#3b82f6" />
                  <Text fontSize="sm" fontWeight="500">Edit Election</Text>
                </HStack>
              </Menu.Item>

              <Menu.Separator />

              <Menu.Item
                value="delete" py={2.5} px={3} cursor="pointer"
                onClick={(e) => { e.preventDefault(); setDeleteOpen(true) }}
              >
                <HStack gap={2}>
                  <FiTrash2 fontSize="0.9rem" color="#ef4444" />
                  <Text fontSize="sm" fontWeight="500" color="#ef4444">Delete Election</Text>
                </HStack>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {/* ── Edit dialog ───────────────────────────────────────────────── */}
      <Dialog.Root open={editOpen} onOpenChange={(e) => setEditOpen(e.open)} size="md">
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl" overflow="hidden">
              <Dialog.Header bg="#f8fafc" px={6} py={4} borderBottomWidth="1px" borderBottomColor="gray.100">
                <HStack justify="space-between" w="full">
                  <Text fontWeight="700" fontSize="lg" color="gray.900">Edit Election</Text>
                  <Dialog.CloseTrigger asChild>
                    <Flex w={8} h={8} borderRadius="lg" bg="gray.100" align="center" justify="center" cursor="pointer"
                      _hover={{ bg: "gray.200" }} transition="all 0.15s">
                      <FiX fontSize="0.9rem" color="#6b7280" />
                    </Flex>
                  </Dialog.CloseTrigger>
                </HStack>
              </Dialog.Header>

              <Dialog.Body px={6} py={5}>
                <VStack gap={4} alignItems="stretch">
                  <VStack alignItems="flex-start" gap={1}>
                    <Text fontSize="sm" fontWeight="600" color="gray.700">Title</Text>
                    <Input
                      value={title} onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Kenya General Elections 2027"
                      bg="white" borderColor="gray.200" borderRadius="lg"
                    />
                  </VStack>

                  <HStack gap={4}>
                    <VStack alignItems="flex-start" gap={1} flex={1}>
                      <Text fontSize="sm" fontWeight="600" color="gray.700">Year</Text>
                      <Input
                        type="number" value={year} onChange={(e) => setYear(e.target.value)}
                        bg="white" borderColor="gray.200" borderRadius="lg"
                      />
                    </VStack>
                    <VStack alignItems="flex-start" gap={1} flex={1}>
                      <Text fontSize="sm" fontWeight="600" color="gray.700">Election Date</Text>
                      <Input
                        type="date" value={electionDate} onChange={(e) => setElectionDate(e.target.value)}
                        bg="white" borderColor="gray.200" borderRadius="lg"
                      />
                    </VStack>
                  </HStack>

                  <VStack alignItems="flex-start" gap={1}>
                    <Text fontSize="sm" fontWeight="600" color="gray.700">Description</Text>
                    <Textarea
                      value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description…"
                      bg="white" borderColor="gray.200" borderRadius="lg"
                      rows={3}
                    />
                  </VStack>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer px={6} py={4} borderTopWidth="1px" borderTopColor="gray.100" bg="#f8fafc">
                <HStack justify="flex-end" gap={3}>
                  <Dialog.CloseTrigger asChild>
                    <HStack gap={1.5} px={4} py={2} borderRadius="lg" cursor="pointer"
                      bg="white" borderWidth="1px" borderColor="gray.200"
                      _hover={{ bg: "gray.50" }} transition="all 0.15s">
                      <Text fontSize="sm" fontWeight="600" color="gray.600">Cancel</Text>
                    </HStack>
                  </Dialog.CloseTrigger>

                  <HStack
                    gap={1.5} px={4} py={2} borderRadius="lg" cursor="pointer"
                    bg="#0f172a" color="white" _hover={{ bg: "#1e293b" }}
                    transition="all 0.15s"
                    onClick={handleSave}
                    opacity={isPending ? 0.6 : 1} pointerEvents={isPending ? "none" : "auto"}
                  >
                    <FiCheck fontSize="0.85rem" />
                    <Text fontSize="sm" fontWeight="600">{isPending ? "Saving…" : "Save Changes"}</Text>
                  </HStack>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* ── Delete confirmation dialog ────────────────────────────────── */}
      <Dialog.Root open={deleteOpen} onOpenChange={(e) => setDeleteOpen(e.open)} size="sm">
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl" overflow="hidden">
              <Dialog.Body p={6}>
                <VStack gap={4} alignItems="center" textAlign="center">
                  <Flex w={14} h={14} borderRadius="2xl" bg="#fef2f2" align="center" justify="center">
                    <FiTrash2 fontSize="1.5rem" color="#ef4444" />
                  </Flex>
                  <VStack gap={1}>
                    <Text fontWeight="700" fontSize="lg" color="gray.900">Delete Election</Text>
                    <Text fontSize="sm" color="gray.500" lineHeight="1.6">
                      Are you sure you want to delete <strong>{election.title}</strong>?
                      This will remove all positions, candidates, and results. This action cannot be undone.
                    </Text>
                  </VStack>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer px={6} pb={6} pt={0}>
                <HStack justify="center" gap={3} w="full">
                  <Dialog.CloseTrigger asChild>
                    <HStack flex={1} justify="center" gap={1.5} px={4} py={2.5} borderRadius="lg" cursor="pointer"
                      bg="white" borderWidth="1px" borderColor="gray.200"
                      _hover={{ bg: "gray.50" }} transition="all 0.15s">
                      <Text fontSize="sm" fontWeight="600" color="gray.600">Cancel</Text>
                    </HStack>
                  </Dialog.CloseTrigger>
                  <HStack
                    flex={1} justify="center" gap={1.5} px={4} py={2.5} borderRadius="lg" cursor="pointer"
                    bg="#ef4444" color="white" _hover={{ bg: "#dc2626" }}
                    transition="all 0.15s"
                    onClick={handleDelete}
                    opacity={isPending ? 0.6 : 1} pointerEvents={isPending ? "none" : "auto"}
                  >
                    <FiTrash2 fontSize="0.85rem" />
                    <Text fontSize="sm" fontWeight="600">{isPending ? "Deleting…" : "Delete"}</Text>
                  </HStack>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
