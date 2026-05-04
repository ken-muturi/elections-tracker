"use client"

import { useEffect, useState } from "react"
import { Box, Button, HStack, Spacer, Text, VStack } from "@chakra-ui/react"
import { Formik, Form as FormikForm, useFormikContext } from "formik"
import * as Yup from "yup"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import CustomInput from "@/components/Generic/Formik/CustomInput"
import FullPageLoader from "@/components/Generic/FullPageLoader"
import { getAllConstituencies, getCounties, createWard, updateWard } from "@/services/Hierarchy"
import { toaster } from "../../toaster"

type WardForm = { id?: string; name: string; code: string; constituencyId: string }
type Ward = { id: string; name: string; code: string; constituencyId: string }

const schema = Yup.object({
  name: Yup.string().required("Name is required"),
  code: Yup.string().required("Code is required"),
  constituencyId: Yup.string().required("Constituency is required"),
})

const initialData: WardForm = { name: "", code: "", constituencyId: "" }

function ConstituencySelect() {
  const { values, setFieldValue } = useFormikContext<WardForm>()
  const { data: counties = [] } = useQuery({ queryKey: ["counties"], queryFn: getCounties })
  const { data: all = [] } = useQuery({ queryKey: ["all-constituencies"], queryFn: getAllConstituencies })

  return (
    <Box>
      <Text fontSize="sm" fontWeight="500" mb={1}>Constituency *</Text>
      <select
        value={values.constituencyId}
        onChange={(e) => setFieldValue("constituencyId", e.target.value)}
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
  )
}

export default function Form({
  ward,
  electionId,
  onClose,
}: {
  ward?: Ward
  electionId: string
  onClose?: () => void
}) {
  const qc = useQueryClient()
  const [initialValues, setInitialValues] = useState<WardForm>(initialData)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (ward) {
      setInitialValues({
        id: ward.id,
        name: ward.name,
        code: ward.code,
        constituencyId: ward.constituencyId,
      })
    }
  }, [ward])

  const handleSave = async (values: WardForm) => {
    if (!electionId) { toaster.error({ title: "Select an election first" }); return }
    setIsSaving(true)
    try {
      if (ward) await updateWard(ward.id, values.name, values.code, values.constituencyId)
      else await createWard(electionId, values.constituencyId, values.name, values.code)
      toaster.success({ title: ward ? "Ward updated" : "Ward created" })
      await qc.invalidateQueries({ queryKey: ["wards", electionId] })
      onClose?.()
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message })
      setIsSaving(false)
    }
  }

  return (
    <Formik initialValues={initialValues} validationSchema={schema} onSubmit={handleSave} enableReinitialize>
      <FormikForm>
        {isSaving && <FullPageLoader />}
        <VStack gap={4} alignItems="stretch">
          <ConstituencySelect />
          <CustomInput name="name" label="Ward Name" required type="text" variant="filled" />
          <CustomInput name="code" label="Code" required type="text" variant="filled" />
          <HStack pt={2}>
            <Button type="submit" colorPalette="blue" size="sm">Save</Button>
            <Spacer />
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          </HStack>
        </VStack>
      </FormikForm>
    </Formik>
  )
}
