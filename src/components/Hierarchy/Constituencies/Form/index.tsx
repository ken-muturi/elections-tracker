"use client"

import { useEffect, useState } from "react"
import { Box, Button, HStack, Spacer, Text, VStack } from "@chakra-ui/react"
import { Formik, Form as FormikForm, useFormikContext } from "formik"
import * as Yup from "yup"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import CustomInput from "@/components/Generic/Formik/CustomInput"
import FullPageLoader from "@/components/Generic/FullPageLoader"
import { createConstituency, getCounties, updateConstituency } from "@/services/Hierarchy"
import { toaster } from "../../toaster"

type ConstituencyForm = { id?: string; name: string; code: string; countyId: string }
type Constituency = { id: string; name: string; code: string; countyId: string }

const schema = Yup.object({
  name: Yup.string().required("Name is required"),
  code: Yup.string().required("Code is required"),
  countyId: Yup.string().required("County is required"),
})

const initialData: ConstituencyForm = { name: "", code: "", countyId: "" }

function CountySelect() {
  const { values, setFieldValue } = useFormikContext<ConstituencyForm>()
  const { data: counties = [] } = useQuery({ queryKey: ["counties"], queryFn: getCounties })

  return (
    <Box>
      <Text fontSize="sm" fontWeight="500" mb={1}>County *</Text>
      <select
        value={values.countyId}
        onChange={(e) => setFieldValue("countyId", e.target.value)}
        style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 13, background: "white" }}
      >
        <option value="">Select county…</option>
        {counties.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </Box>
  )
}

export default function Form({
  constituency,
  onClose,
}: {
  constituency?: Constituency
  onClose?: () => void
}) {
  const qc = useQueryClient()
  const [initialValues, setInitialValues] = useState<ConstituencyForm>(initialData)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (constituency) {
      setInitialValues({
        id: constituency.id,
        name: constituency.name,
        code: constituency.code,
        countyId: constituency.countyId,
      })
    }
  }, [constituency])

  const handleSave = async (values: ConstituencyForm) => {
    setIsSaving(true)
    try {
      if (constituency) await updateConstituency(constituency.id, values.name, values.code, values.countyId)
      else await createConstituency(values.countyId, values.name, values.code)
      toaster.success({ title: constituency ? "Constituency updated" : "Constituency created" })
      await qc.invalidateQueries({ queryKey: ["all-constituencies"] })
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
          <CountySelect />
          <CustomInput name="name" label="Name" required type="text" variant="filled" />
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
