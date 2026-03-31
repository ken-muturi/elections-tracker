'use client'

import CustomInput from '@/components/Generic/Formik/CustomInput';
import { Button, HStack, Spacer, VStack, createToaster } from '@chakra-ui/react';
import { Formik, Form as FormikForm } from 'formik';
import React, { useEffect, useState } from 'react'
import { ModuleDetail, ModuleForm, } from '../type';
import { handleReturnError } from '@/db/error-handling';
import { useQueryClient } from '@tanstack/react-query';
import { createModule, updateModule } from "@/services/Modules";
import { useUX } from '@/context/UXContext';
import { dictionary } from '../dictionary';

const initialData: ModuleForm = {
  title: "",
  description: "",
};

const Form = ({ module }: { module?: ModuleDetail }) => {
  const toaster = createToaster({
    placement: "top-end",
  });
  const queryClient = useQueryClient()
  const [initialValues, setInitialValues] = useState<ModuleForm>(initialData);
  const { translate } = useUX()

  useEffect(() => {
    if (module) {
      setInitialValues({
        id: module.id,
        title: module.title,
        description: module.description,
      } as ModuleForm);
    }
  }, [module]);

  const saveModule = async (values: ModuleForm) => {
    setInitialValues(values);

    try {
      const apiData = values
      if (module) {
        await updateModule(module.id, apiData)
      }
      else {
        await createModule(apiData)
      }

      setInitialValues(initialData);
      
      toaster.success({
        title: translate(dictionary.success),
        description: translate(dictionary.saveSuccess),
      });
      
      await queryClient.refetchQueries({ queryKey: ["modules"] });

      window.location.href = "/modules";

    } catch (e) {
      const message = handleReturnError(e);
      
      toaster.error({
        title: translate(dictionary.error),
        description: translate(dictionary.deleteErrorDescription),
      });
      console.error("Error saving module:", message);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={saveModule}
      enableReinitialize={true}
    >
      {(formProps) => {
        console.log({ formProps });
        return (
          <FormikForm>
            <VStack alignItems="left" gap={4}>
              <CustomInput
                name="title"
                required
                type="text"
                title={translate(dictionary.title)}
                variant="filled"
              />
              <CustomInput
                name="description"
                required
                type="text"
                title={translate(dictionary.description)}
                variant="filled"
              />
              <HStack>
                <Button type="submit" colorPalette="orange">
                  {translate(dictionary.save)}
                </Button>
                <Spacer />
                <Button onClick={() => (window.location.href = "/modules")}>
                  {translate(dictionary.cancel)}
                </Button>
              </HStack>
            </VStack>
          </FormikForm>
        );
      }}
    </Formik>
  );
};

export default Form
