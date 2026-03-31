'use client'

import {
  Badge,
  Box,
  Button,
  HStack,
  Select,
  Spacer,
  Text,
  VStack,
  Circle,
  createListCollection,
  createToaster,
  Input,
  Textarea,
} from "@chakra-ui/react";
import { Formik, Form as FormikForm } from "formik";
import React, { useEffect, useState } from "react";
import { SectionForm, SectionWithRelations } from "../type";
import { handleReturnError } from "@/db/error-handling";
import { useQueryClient } from "@tanstack/react-query";
import { SupportedLocale, useUX } from "@/context/UXContext";
import { dictionary } from "../dictionary";
import Link from "next/link";
import FullPageLoader from "@/components/Generic/FullPageLoader";
import * as Yup from "yup";

import { createSection, updateSection } from "@/services/Sections";
import { useParams } from "next/navigation";
import { TranslationText } from "@/types";
import { useMultilingualForm } from '@/hooks/useMultilingualForm';
import { Check } from "lucide-react";

const schema = Yup.object().shape({
  title: Yup.array()
    .of(
      Yup.object().shape({
        language: Yup.string().required("Language is required"),
        text: Yup.string().required("Title text is required"),
      })
    )
    .min(1, "At least one language text is required"),
  description: Yup.array()
    .of(
      Yup.object().shape({
        language: Yup.string().required("Description Language is required"),
        text: Yup.string().required("Description text is required"),
      })
    )
    .min(1, "At least one language text is required"),
});

const titleInitializer: TranslationText = {
  language: "en",
  text: "",
};

const initialData: SectionForm = {
  title: [titleInitializer],
  description: [titleInitializer],
  questionnaireId: "",
};

type SectionFormTranslations = Pick<SectionForm, 'title' | 'description'>;
const Form = ({
  section,
  onClose,
}: {
  onClose?: () => void;
  section?: SectionWithRelations;
}) => {
  const queryClient = useQueryClient();
  const [initialValues, setInitialValues] = useState<SectionForm>(initialData);
  const toaster = createToaster({
    placement: "top-end",
  });
  const { translate, supportedLocales } = useUX();

  const translationFields: (keyof SectionFormTranslations)[] = [
    "title",
    "description",
  ];

  const multilingualForm = useMultilingualForm<SectionFormTranslations>(
    "en",
    supportedLocales,
    translationFields
  );
  const {
    currentLanguage,
    setCurrentLanguage,
    getActiveLanguages,
    hasAnyContent,
    getCurrentText,
    addLanguage,
    updateTranslation,
    getAvailableLanguages,
  } = multilingualForm;

  const params = useParams() as { id: string }; // Adjusted to match the expected type for useParams
  const { id: questionnaireId } = params;
  console.log({ params });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (section) {
      setInitialValues({
        questionnaireId: section.questionnaireId,
        title: (section.title as PrismaJson.PartialTranslation[]).map(
          (t) => t.body
        ),
        description: (
          section.description as PrismaJson.PartialTranslation[]
        ).map((t) => t.body),
      } as SectionForm);
    }
  }, [section]);

  const saveSection = async (values: SectionForm) => {
    setIsSaving(true);
    try {
      const apiData = {
        ...values,
        questionnaireId,
        title: values.title.map((t) => ({
          body: t,
        })),
        description: values.description.map((t) => ({
          body: t,
        })),
      };
      if (section) {
        await updateSection(section.id, apiData);
      } else {
        await createSection(apiData);
      }

      setInitialValues(initialData);
      toaster.success({
        title: translate(dictionary.success),
        description: translate(dictionary.saveSuccess),
      });
      await queryClient.refetchQueries({ queryKey: ["sections"] });

      // window.location.href = `/questionnaires/${questionnaireId}/sections`;
      onClose?.();
    } catch (e) {
      const message = handleReturnError(e);
      toaster.error({
        title: translate(dictionary.error),
        description: message,
      });
      setIsSaving(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={saveSection}
      enableReinitialize={true}
      validationSchema={schema}
    >
      {(formProps) => {
        const { values, setFieldValue, errors, touched } = formProps;
        console.log({ formProps });
        return (
          <FormikForm>
            {isSaving && <FullPageLoader />}
            <VStack alignItems="left" gap={4}>
              {/* Language Pills */}
              <HStack gap="2">
                {getActiveLanguages(values).map((langCode) => {
                  return (
                    <Badge
                      key={langCode}
                      variant={
                        currentLanguage === langCode ? "solid" : "outline"
                      }
                      colorScheme={
                        currentLanguage === langCode ? "blue" : "gray"
                      }
                      size="lg"
                      px={4}
                      py={2}
                      borderRadius="full"
                      cursor="pointer"
                      onClick={() =>
                        setCurrentLanguage(langCode as SupportedLocale)
                      }
                      position="relative"
                    >
                      {langCode}
                      {hasAnyContent(langCode, values) && (
                        <Circle
                          size="3"
                          bg="green.500"
                          position="absolute"
                          top="-1"
                          right="-1"
                        >
                          <Check size="8px" color="white" />
                        </Circle>
                      )}
                    </Badge>
                  );
                })}

                <Box>
                  <Select.Root
                    collection={createListCollection({
                      items: getAvailableLanguages(values),
                    })}
                    size="sm"
                    onValueChange={(details) => {
                      if (details.value[0]) {
                        addLanguage(
                          details.value[0] as SupportedLocale,
                          values,
                          setFieldValue
                        );
                      }
                    }}
                  >
                    <Select.Trigger
                      borderRadius="full"
                      borderWidth="1px"
                      borderColor="gray.300"
                      px="3"
                      py="1"
                      fontSize="sm"
                      cursor="pointer"
                      _hover={{ borderColor: "gray.400" }}
                    >
                      <Select.ValueText placeholder="+ Add Language" />
                    </Select.Trigger>
                    <Select.Content>
                      {getAvailableLanguages(values).map((lang) => (
                        <Select.Item key={lang} item={lang}>
                          <Select.ItemText>{lang}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>
              </HStack>

              {/* Form */}
              <Text color="gray.500" fontSize="sm" fontStyle="italic">
                Enter content in {currentLanguage}
              </Text>

              <Box width="full">
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                  Question Title *
                </Text>
                <Input
                  p={2}
                  name="title"
                  value={getCurrentText("title", values)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    console.log(e.target.value);
                    updateTranslation(
                      "title",
                      e.target.value,
                      values,
                      setFieldValue
                    );
                  }}
                  placeholder={`Enter title in ${currentLanguage}`}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor={
                    errors.title && touched.title ? "red.500" : "gray.200"
                  }
                />
                {errors.title && touched.title && (
                  <Text color="red.500" fontSize="sm" mt="1">
                    {errors.title as string}
                  </Text>
                )}
              </Box>

              <Box width="full">
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">
                  Question Description *
                </Text>
                <Textarea
                  name="description"
                  value={getCurrentText("description", values)}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateTranslation(
                      "description",
                      e.target.value,
                      values,
                      setFieldValue
                    )
                  }
                  placeholder={`Enter description in ${currentLanguage}`}
                  rows={5}
                  p={2}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor={
                    errors.description && touched.description
                      ? "red.500"
                      : "gray.200"
                  }
                  resize="none"
                />
                {errors.description && touched.description && (
                  <Text color="red.500" fontSize="sm" mt="1">
                    {errors.description as string}
                  </Text>
                )}
              </Box>

              <HStack>
                <Button type="submit" colorScheme="orange">
                  {translate(dictionary.save)}
                </Button>
                <Spacer />
                <Link href="#">
                  <Button variant="outline">
                    {translate(dictionary.cancel)}
                  </Button>
                </Link>
              </HStack>
            </VStack>
          </FormikForm>
        );
      }}
    </Formik>
  );
};

export default Form
