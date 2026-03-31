'use client'

import CustomInput from "@/components/Generic/Formik/CustomInput";
import CustomSelect from "@/components/Generic/Formik/CustomSelect";
import CustomTextarea from "@/components/Generic/Formik/CustomTextarea";
import {
  Button,
  Spacer,
  VStack,
  HStack,
  Box,
  Text,
  createToaster,
} from "@chakra-ui/react";
import { Role } from "@prisma/client";

import { Formik, Form as FormikForm } from "formik";
import React, { useEffect, useState } from "react";
import { UserForm, UserWithRelations } from "../type";
import { ucwords } from "@/utils/util";
import CustomRadio from "@/components/Generic/Formik/CustomRadio";
import { omit } from "lodash";

import * as Yup from "yup";
import { handleReturnError } from "@/db/error-handling";
import { createUser, updateUser } from "@/services/Users";
import { useQueryClient } from "@tanstack/react-query";
// import { uploadFile } from "@/utils/s3"; // TODO: Implement S3 upload utility
import FilePreview from "@/components/Generic/Dropzone/FilePreview";
import Dropzone from "@/components/Generic/Dropzone";
import FullPageLoader from "@/components/Generic/FullPageLoader";
import { dictionary } from "../dictionary";
import { useUX } from "@/context/UXContext";

const initialData: UserForm = {
  id: "",
  email: "",
  image: "",
  firstname: "",
  othernames: "",
  gender: "",
  phone: "",
  alternatePhone: "",
  roleId: "",
  password: "",
  passwordConfirm: "",
};

const schema = Yup.object({
  firstname: Yup.string().required("Firstname Field is required"),
  othernames: Yup.string().required("Othernames Field is required"),
  gender: Yup.string().required("Gender field is required"),
  phone: Yup.string().required("Phone field is required"),
  alternatePhone: Yup.string().required("Alternate Phone field is required"),
  roleId: Yup.string().required("Role is required"),
  organizationId: Yup.string().required("Organization is required"),
  image: Yup.string(),
});

const Form = ({
  user,
  roles,
}: {
  user?: UserWithRelations;
  roles: Role[];
}) => {
  const toaster = createToaster({
    placement: "top-end",
  });
  const [initialValues, setInitialValues] = useState<UserForm>(initialData);
  const { translate } = useUX();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | undefined>();
  const [isSavings, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setInitialValues({
        id: user.id,
        email: user.email,
        image: user.image || "",
        firstname: user.firstname,
        othernames: user.othernames,
        gender: user.gender,
        phone: user.phone,
        alternatePhone: user.alternatePhone,
        roleId: user.roleId,
        organizationId: user.organizationId,
      } as UserForm);
    }
  }, [user]);

  const saveUsers = async (values: UserForm) => {
    setIsSaving(true);
    try {
      const apiData: UserForm = {
        ...omit(values, ["file", "password", "passwordConfirm"]),
        id: values.id || "",
        image: values.image || "",
      } as UserForm;
      if (file) {
        // TODO: Implement file upload functionality
        // const fileUrl = await uploadFile(file);
        console.log("File upload not implemented yet:", file.name);
        // apiData.image = fileUrl;
      }
      console.log({ apiData });
      if (user) {
        await updateUser(user.id, {
          ...apiData,
        });
      } else {
        await createUser(omit(apiData, ["id", "passwordConfirm"]));
      }
      setInitialValues(initialData);

      toaster.success({
        title: translate(dictionary.success),
        description: translate(dictionary.saveSuccess),
      });
      
      queryClient.refetchQueries({
        queryKey: ["users"],
      });
      window.location.href = "/users";
    } catch (e) {
      console.log({ e });
      const message = handleReturnError(e);
      
      toaster.error({
        title: translate(dictionary.error),
        description: translate(dictionary.saveError),
      });
      
      console.error("Error saving user:", message);
      
      setIsSaving(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={saveUsers}
      enableReinitialize={true}
      validationSchema={schema}
    >
      {(formProps) => {
        console.log({ formProps });
        return (
          <FormikForm>
            {isSavings && <FullPageLoader />}
            <VStack alignItems="left" gap={2}>
              <CustomSelect
                name="roleId"
                required
                label="Role"
                value={formProps.values.roleId}
                options={roles.map((r) => ({
                  value: r.id,
                  label: r.title,
                }))}
              />
              <CustomInput
                name="firstname"
                required
                type="text"
                label={translate(dictionary.firstname)}
                variant="filled"
              />
              <CustomInput
                name="othernames"
                required
                type="text"
                label={translate(dictionary.othernames)}
                variant="filled"
              />
              <CustomSelect
                label="Organization"
                name="organizationId"
                required
                options={[]} // TODO: Add organizations data
              />
              <CustomInput
                name="email"
                required
                type="text"
                label="Email"
                variant="filled"
              />
              <Box>
                <Text mb={2} fontWeight="medium">
                  Image
                </Text>
                {file ? (
                  <FilePreview
                    file={file}
                    isInline
                    onRemove={() => {
                      setFile(undefined);
                    }}
                  />
                ) : (
                  <Dropzone
                    isInline
                    setSelectedFile={(file) => {
                      formProps.setFieldValue("file", file);
                      setFile(file);
                    }}
                    maxSize={5 * 1024 * 1024}
                  />
                )}
              </Box>

              <CustomRadio
                label={translate(dictionary.gender)}
                name="gender"
                required
                options={["female", "male"].map((d) => ({
                  label: ucwords(d),
                  value: d,
                }))}
              />

              <CustomTextarea
                name="address"
                label={translate(dictionary.address)}
              />

              <CustomInput
                name="phone"
                required
                type="text"
                label={translate(dictionary.phone)}
                variant="filled"
              />
              <CustomInput
                name="alternatePhone"
                required
                type="text"
                label={translate(dictionary.alternatePhone)}
                variant="filled"
              />
              <HStack pt={5}>
                <Button type="submit" colorPalette="red">
                  {translate(dictionary.save)}
                </Button>
                <Spacer />
                <Button onClick={() => (window.location.href = "/users")}>
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
