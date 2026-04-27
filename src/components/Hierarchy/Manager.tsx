"use client"

import React, { useState, useMemo } from "react"
import {
  Box, Button, Dialog, Flex, HStack, Input,
  Spinner, Tabs, Text, VStack, Badge, createToaster,
} from "@chakra-ui/react"
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiLayers, FiMap } from "react-icons/fi"
import { useQuery, useQueryClient } from "@tanstack/react-query"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import {
  getCounties, getAllConstituencies, getWardsByElection,
  createCounty, updateCounty, deleteCounty,
  createConstituency, updateConstituency, deleteConstituency,
  createWard, updateWard, deleteWard,
} from "@/services/Hierarchy"
import StyledIconButton from "@/components/Generic/StyledIconButton"
import { TableGroupable } from "@/components/Generic/TableGroupable"

const toaster = createToaster({ placement: "top-end" })

type Election = { id: string; title: string; year: number }

// ─── Shared dialog ────────────────────────────────────────────────────────────

function NameCodeDialog({
  title,
  open,
  onClose,
  onSave,
  saving,
  initialName = "",
  initialCode = "",
  children,
}: {
  title: string
  open: boolean
  onClose: () => void
  onSave: (name: string, code: string) => void
  saving: boolean
  initialName?: string
  initialCode?: string
  children?: React.ReactNode
}) {
  const [name, setName] = useState(initialName)
  const [code, setCode] = useState(initialCode)

  React.useEffect(() => {
    if (open) { setName(initialName); setCode(initialCode) }
  }, [open, initialName, initialCode])

  return (
    <Dialog.Root open={open} onOpenChange={(d) => { if (!d.open) onClose() }} size="sm">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>
          <Dialog.Body>
            <VStack gap={4} alignItems="stretch">
              {children}
              <Box>
                <Text fontSize="sm" fontWeight="500" mb={1}>Name *</Text>
                <Input size="sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nairobi" />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="500" mb={1}>Code *</Text>
                <Input size="sm" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 047" />
              </Box>
            </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <HStack gap={3}>
              <Button colorPalette="blue" size="sm" loading={saving}
                onClick={() => { if (name && code) onSave(name, code) }}>
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}

// ─── Counties tab ─────────────────────────────────────────────────────────────

type CountyRow = { id: string; name: string; code: string }

function CountiesTab() {
  const qc = useQueryClient()
  const { data: counties = [], isLoading } = useQuery({ queryKey: ["counties"], queryFn: getCounties })

  const [dialog, setDialog] = useState<{ open: boolean; id?: string; name: string; code: string }>
    ({ open: false, name: "", code: "" })
  const [saving, setSaving] = useState(false)

  const invalidate = () => qc.invalidateQueries({ queryKey: ["counties"] })
  const openAdd = () => setDialog({ open: true, name: "", code: "" })
  const openEdit = (c: CountyRow) => setDialog({ open: true, id: c.id, name: c.name, code: c.code })
  const close = () => setDialog({ open: false, name: "", code: "" })

  const handleSave = async (name: string, code: string) => {
    setSaving(true)
    try {
      if (dialog.id) await updateCounty(dialog.id, name, code)
      else await createCounty(name, code)
      toaster.success({ title: dialog.id ? "County updated" : "County created" })
      invalidate(); close()
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message })
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete county "${name}"? This will also remove its constituencies.`)) return
    try {
      await deleteCounty(id)
      toaster.success({ title: "County deleted" }); invalidate()
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message })
    }
  }

  const columnHelper = createColumnHelper<CountyRow>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<CountyRow, any>[]>(() => [
    columnHelper.accessor("id", {
      header: "#",
      enableGrouping: false,
      cell: (cell) => cell.row.index + 1,
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (cell) => <Text fontWeight="500">{cell.getValue()}</Text>,
    }),
    columnHelper.accessor("code", {
      header: "Code",
      cell: (cell) => <Badge colorPalette="gray">{cell.getValue()}</Badge>,
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      enableGrouping: false,
      cell: ({ row }) => (
        <HStack gap={1}>
          <StyledIconButton variant="edit" aria-label="Edit" size="xs"
            onClick={() => openEdit(row.original)}>
            <FiEdit2 size={11} />
          </StyledIconButton>
          <StyledIconButton variant="delete" aria-label="Delete" size="xs"
            onClick={() => handleDelete(row.original.id, row.original.name)}>
            <FiTrash2 size={11} />
          </StyledIconButton>
        </HStack>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [counties])

  return (
    <>
      <TableGroupable<CountyRow>
        title="Counties"
        data={counties}
        columnInfo={columns}
        loading={isLoading}
        exportCsv
        headingContent={
          <Button size="xs" colorPalette="blue" onClick={openAdd}><FiPlus /> Add County</Button>
        }
      />
      <NameCodeDialog
        title={dialog.id ? "Edit County" : "Add County"}
        open={dialog.open} onClose={close} onSave={handleSave} saving={saving}
        initialName={dialog.name} initialCode={dialog.code}
      />
    </>
  )
}

// ─── Constituencies tab ───────────────────────────────────────────────────────

type ConstituencyRow = {
  id: string; name: string; code: string; countyId: string;
  county: { name: string; code: string }
}

function ConstituenciesTab() {
  const qc = useQueryClient()
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["all-constituencies"], queryFn: getAllConstituencies,
  })
  const { data: counties = [] } = useQuery({ queryKey: ["counties"], queryFn: getCounties })

  const [dialog, setDialog] = useState<{
    open: boolean; id?: string; name: string; code: string; countyId: string
  }>({ open: false, name: "", code: "", countyId: "" })
  const [saving, setSaving] = useState(false)

  const invalidate = () => qc.invalidateQueries({ queryKey: ["all-constituencies"] })
  const openAdd = () => setDialog({ open: true, name: "", code: "", countyId: "" })
  const openEdit = (c: ConstituencyRow) =>
    setDialog({ open: true, id: c.id, name: c.name, code: c.code, countyId: c.countyId })
  const close = () => setDialog({ open: false, name: "", code: "", countyId: "" })

  const handleSave = async (name: string, code: string) => {
    if (!dialog.countyId) { toaster.error({ title: "Select a county" }); return }
    setSaving(true)
    try {
      if (dialog.id) await updateConstituency(dialog.id, name, code)
      else await createConstituency(dialog.countyId, name, code)
      toaster.success({ title: dialog.id ? "Constituency updated" : "Constituency created" })
      invalidate(); close()
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message })
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete constituency "${name}"?`)) return
    try {
      await deleteConstituency(id)
      toaster.success({ title: "Constituency deleted" }); invalidate()
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message })
    }
  }

  const columnHelper = createColumnHelper<ConstituencyRow>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<ConstituencyRow, any>[]>(() => [
    columnHelper.accessor("id", {
      header: "#",
      enableGrouping: false,
      cell: (cell) => cell.row.index + 1,
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (cell) => <Text fontWeight="500">{cell.getValue()}</Text>,
    }),
    columnHelper.accessor("code", {
      header: "Code",
      cell: (cell) => <Badge colorPalette="gray">{cell.getValue()}</Badge>,
    }),
    columnHelper.accessor("county.name", {
      id: "countyName",
      header: "County",
      cell: (cell) => cell.getValue(),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      enableGrouping: false,
      cell: ({ row }) => (
        <HStack gap={1}>
          <StyledIconButton variant="edit" aria-label="Edit" size="xs"
            onClick={() => openEdit(row.original)}>
            <FiEdit2 size={11} />
          </StyledIconButton>
          <StyledIconButton variant="delete" aria-label="Delete" size="xs"
            onClick={() => handleDelete(row.original.id, row.original.name)}>
            <FiTrash2 size={11} />
          </StyledIconButton>
        </HStack>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [all])

  return (
    <>
      <TableGroupable<ConstituencyRow>
        title="Constituencies"
        data={all}
        columnInfo={columns}
        loading={isLoading}
        exportCsv
        defaultGrouping={["countyName"]}
        headingContent={
          <Button size="xs" colorPalette="blue" onClick={openAdd}><FiPlus /> Add Constituency</Button>
        }
      />
      <NameCodeDialog
        title={dialog.id ? "Edit Constituency" : "Add Constituency"}
        open={dialog.open} onClose={close} onSave={handleSave} saving={saving}
        initialName={dialog.name} initialCode={dialog.code}
      >
        <Box>
          <Text fontSize="sm" fontWeight="500" mb={1}>County *</Text>
          <select
            value={dialog.countyId}
            onChange={(e) => setDialog((d) => ({ ...d, countyId: e.target.value }))}
            style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 13, background: "white" }}
          >
            <option value="">Select county…</option>
            {counties.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Box>
      </NameCodeDialog>
    </>
  )
}

// ─── Wards tab ────────────────────────────────────────────────────────────────

type WardRow = {
  id: string; name: string; code: string; constituencyId: string
  constituency: { name: string; county: { name: string } }
  _count: { pollingStations: number }
}

function WardsTab({ elections }: { elections: Election[] }) {
  const qc = useQueryClient()
  const { data: counties = [] } = useQuery({ queryKey: ["counties"], queryFn: getCounties })
  const { data: all = [] } = useQuery({
    queryKey: ["all-constituencies"], queryFn: getAllConstituencies,
  })

  const [electionId, setElectionId] = useState(elections[0]?.id ?? "")

  const { data: wards = [], isLoading } = useQuery({
    queryKey: ["wards", electionId],
    queryFn: () => getWardsByElection(electionId),
    enabled: !!electionId,
  })

  const [dialog, setDialog] = useState<{
    open: boolean; id?: string; name: string; code: string; constituencyId: string
  }>({ open: false, name: "", code: "", constituencyId: "" })
  const [saving, setSaving] = useState(false)

  const invalidate = () => qc.invalidateQueries({ queryKey: ["wards", electionId] })
  const openAdd = () => setDialog({ open: true, name: "", code: "", constituencyId: "" })
  const openEdit = (w: WardRow) =>
    setDialog({ open: true, id: w.id, name: w.name, code: w.code, constituencyId: w.constituencyId })
  const close = () => setDialog({ open: false, name: "", code: "", constituencyId: "" })

  const handleSave = async (name: string, code: string) => {
    if (!dialog.constituencyId) { toaster.error({ title: "Select a constituency" }); return }
    setSaving(true)
    try {
      if (dialog.id) await updateWard(dialog.id, name, code)
      else await createWard(electionId, dialog.constituencyId, name, code)
      toaster.success({ title: dialog.id ? "Ward updated" : "Ward created" })
      invalidate(); close()
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message })
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ward "${name}"?`)) return
    try {
      await deleteWard(id)
      toaster.success({ title: "Ward deleted" }); invalidate()
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message })
    }
  }

  const columnHelper = createColumnHelper<WardRow>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<WardRow, any>[]>(() => [
    columnHelper.accessor("id", {
      header: "#",
      enableGrouping: false,
      cell: (cell) => cell.row.index + 1,
    }),
    columnHelper.accessor("name", {
      header: "Ward",
      cell: (cell) => <Text fontWeight="500">{cell.getValue()}</Text>,
    }),
    columnHelper.accessor("code", {
      header: "Code",
      cell: (cell) => <Badge colorPalette="purple">{cell.getValue()}</Badge>,
    }),
    columnHelper.accessor("constituency.name", {
      id: "constituencyName",
      header: "Constituency",
      cell: (cell) => cell.getValue(),
    }),
    columnHelper.accessor("constituency.county.name", {
      id: "countyName",
      header: "County",
      cell: (cell) => cell.getValue(),
    }),
    columnHelper.accessor("_count.pollingStations", {
      id: "stations",
      header: "Stations",
      enableGrouping: false,
      cell: (cell) => (
        <Badge colorPalette="blue" variant="subtle">{cell.getValue()}</Badge>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      enableGrouping: false,
      cell: ({ row }) => (
        <HStack gap={1}>
          <StyledIconButton variant="edit" aria-label="Edit" size="xs"
            onClick={() => openEdit(row.original)}>
            <FiEdit2 size={11} />
          </StyledIconButton>
          <StyledIconButton variant="delete" aria-label="Delete" size="xs"
            onClick={() => handleDelete(row.original.id, row.original.name)}>
            <FiTrash2 size={11} />
          </StyledIconButton>
        </HStack>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [wards])

  return (
    <>
      <TableGroupable<WardRow>
        title="Wards"
        data={wards}
        columnInfo={columns}
        loading={isLoading}
        exportCsv
        defaultGrouping={["countyName"]}
        advancedSearchButton={
          <select
            value={electionId}
            onChange={(e) => setElectionId(e.target.value)}
            style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 10px", fontSize: 13, background: "white" }}
          >
            <option value="">Select election…</option>
            {elections.map((e) => <option key={e.id} value={e.id}>{e.title} ({e.year})</option>)}
          </select>
        }
        headingContent={
          <Button size="xs" colorPalette="blue" onClick={openAdd} disabled={!electionId}>
            <FiPlus /> Add Ward
          </Button>
        }
      />
      <NameCodeDialog
        title={dialog.id ? "Edit Ward" : "Add Ward"}
        open={dialog.open} onClose={close} onSave={handleSave} saving={saving}
        initialName={dialog.name} initialCode={dialog.code}
      >
        <Box>
          <Text fontSize="sm" fontWeight="500" mb={1}>Constituency *</Text>
          <select
            value={dialog.constituencyId}
            onChange={(e) => setDialog((d) => ({ ...d, constituencyId: e.target.value }))}
            style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 13, background: "white" }}
          >
            <option value="">Select constituency…</option>
            {counties.map((county) => (
              <optgroup key={county.id} label={county.name}>
                {all.filter((c) => c.countyId === county.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Box>
      </NameCodeDialog>
    </>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function HierarchyManager({ elections }: { elections: Election[] }) {
  return (
    <Box bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden">
      <Tabs.Root defaultValue="counties">
        <Tabs.List px={4} borderBottomWidth="1px" borderBottomColor="gray.100" bg="#f8fafc">
          <Tabs.Trigger value="counties" fontSize="sm" fontWeight="600">
            <FiMapPin /> Counties
          </Tabs.Trigger>
          <Tabs.Trigger value="constituencies" fontSize="sm" fontWeight="600">
            <FiLayers /> Constituencies
          </Tabs.Trigger>
          <Tabs.Trigger value="wards" fontSize="sm" fontWeight="600">
            <FiMap /> Wards
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="counties" p={5}><CountiesTab /></Tabs.Content>
        <Tabs.Content value="constituencies" p={5}><ConstituenciesTab /></Tabs.Content>
        <Tabs.Content value="wards" p={5}><WardsTab elections={elections} /></Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
