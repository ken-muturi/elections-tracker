'use client'

import CustomInput from '@/components/Generic/Formik/CustomInput';
import { Button, HStack, Spacer, VStack, createToaster } from '@chakra-ui/react';
import { Formik, Form as FormikForm } from 'formik';
import React, { useEffect, useState } from 'react'
import { RoleDetail, RoleForm, } from '../type';
import { handleReturnError } from '@/db/error-handling';
import { createRole, updateRole } from '@/services/Roles';
import { useQueryClient } from '@tanstack/react-query';
import { useUX } from '@/context/UXContext';
import { dictionary } from '../dictionary';
import CustomTextarea from "@/components/Generic/Formik/CustomTextarea";
import FullPageLoader from "@/components/Generic/FullPageLoader";

const initialData: RoleForm = {
  title: "",
  description: "",
};

const Form = ({ role }: { role?: RoleDetail }) => {
  const toaster = createToaster({
    placement: "top-end",
  });
  const queryClient = useQueryClient();
  const { translate } = useUX();
  const [initialValues, setInitialValues] = useState<RoleForm>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setInitialValues({
        id: role.id,
        title: role.title,
        description: role.description,
      } as RoleForm);
    }
  }, [role]);

  const saveRoles = async (values: RoleForm) => {
    setInitialValues(values);
    setIsSaving(true);
    try {
      const apiData = values;
      if (role) {
        await updateRole(role.id, apiData);
      } else {
        await createRole(apiData);
      }

      setInitialValues(initialData);
      
      toaster.success({
        title: translate(dictionary.success),
        description: translate(dictionary.saveSuccess),
      });
      
      await queryClient.refetchQueries({ queryKey: ["roles"] });

      window.location.href = "/roles";
    } catch (e) {
      const message = handleReturnError(e);
      
      toaster.error({
        title: translate(dictionary.error),
        description: translate(dictionary.deleteErrorDescription),
      });
      console.error("Error saving role:", message);
      setIsSaving(false);
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
            {isSaving && <FullPageLoader />}
            <VStack alignItems="left" gap={4}>
              <CustomInput
                name="title"
                required
                type="text"
                label={translate(dictionary.role)}
                variant="filled"
              />
              <CustomTextarea
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
                <Button onClick={() => (window.location.href = "/roles")}>
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
