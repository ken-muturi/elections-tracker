'use client'

import CustomInput from '@/components/Generic/Formik/CustomInput';
import { Button, HStack, Spacer, VStack, createToaster } from '@chakra-ui/react';
import { Formik, Form as FormikForm } from 'formik';
import React, { useEffect, useState } from 'react'
import { TabDetail, TabForm, } from '../type';
import { handleReturnError } from '@/db/error-handling';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createTab, updateTab } from '@/services/Tabs';
import CustomSelect from '@/components/Generic/Formik/CustomSelect';
import { getModules } from "@/services/Modules";
import { ucwords } from '@/utils/util';
import { useUX } from '@/context/UXContext';
import { dictionary } from '../dictionary';

const initialData: TabForm = {
  title: "",
  description: "",
  moduleId: "",
};

const Form = ({ tab }: { tab?: TabDetail }) => {
  const queryClient = useQueryClient()
  const toaster = createToaster({
    placement: "top-end",
  });
  const { translate } = useUX()
  const [initialValues, setInitialValues] = useState<TabForm>(initialData);
  const { data: modules } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      return await getModules();
    }
  })

  useEffect(() => {
    if (tab) {
      setInitialValues({
        id: tab.id,
        title: tab.title,
        description: tab.description,
      } as TabForm);
    }
  }, [tab]);

  const saveRoles = async (values: TabForm) => {
    setInitialValues(values);

    try {
      const apiData = values
      if (tab) {
        await updateTab(tab.id, apiData)
      }
      else {
        await createTab(apiData)
      }

      setInitialValues(initialData);
      
      toaster.success({
        title: translate(dictionary.success),
        description: translate(dictionary.saveSuccess),
      });
      
      await queryClient.refetchQueries({ queryKey: ["tabs"] });

      window.location.href = "/tabs";

    } catch (e) {
      const message = handleReturnError(e);
      
      toaster.error({
        title: translate(dictionary.error),
        description: translate(dictionary.deleteErrorDescription),
      });
      console.error("Error saving tab:", message);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={saveRoles}
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
                label={translate(dictionary.tab)}
                variant="filled"
              />
              <CustomSelect
                name="moduleId"
                required
                type="text"
                label={translate(dictionary.module)}
                options={(modules || []).map((module) => ({
                  value: module.id,
                  label: ucwords(module.title),
                }))}
              />
              <CustomInput
                name="description"
                required
                type="text"
                label={translate(dictionary.description)}
                variant="filled"
              />
              <HStack>
                <Button type="submit" colorPalette="orange">
                  {translate(dictionary.save)}
                </Button>
                <Spacer />
                <Button as="a">{translate(dictionary.cancel)}</Button>
              </HStack>
            </VStack>
          </FormikForm>
        );
      }}
    </Formik>
  );
};

export default Form
