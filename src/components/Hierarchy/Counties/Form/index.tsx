"use client"

import { useEffect, useState } from "react"
import { Button, HStack, Spacer, VStack } from "@chakra-ui/react"
import { Formik, Form as FormikForm } from "formik"
import * as Yup from "yup"
import { useQueryClient } from "@tanstack/react-query"
import CustomInput from "@/components/Generic/Formik/CustomInput"
import FullPageLoader from "@/components/Generic/FullPageLoader"
import { createCounty, updateCounty } from "@/services/Hierarchy"
import { toaster } from "../../toaster"

type CountyForm = { id?: string; name: string; code: string }
type County = { id: string; name: string; code: string }

const schema = Yup.object({
  name: Yup.string().required("Name is required"),
  code: Yup.string().required("Code is required"),
})

const initialData: CountyForm = { name: "", code: "" }

export default function Form({ county, onClose }: { county?: County; onClose?: () => void }) {
  const qc = useQueryClient()
  const [initialValues, setInitialValues] = useState<CountyForm>(initialData)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (county) setInitialValues({ id: county.id, name: county.name, code: county.code })
  }, [county])

  const handleSave = async (values: CountyForm) => {
    setIsSaving(true)
    try {
      if (county) await updateCounty(county.id, values.name, values.code)
      else await createCounty(values.name, values.code)
      toaster.success({ title: county ? "County updated" : "County created" })
      await qc.invalidateQueries({ queryKey: ["counties"] })
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
