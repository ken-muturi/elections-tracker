/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import CustomInput from "@/components/Generic/Formik/CustomInput";
import {
  Box,
  Button,
  HStack,
  IconButton,
  Spacer,
  Stack,
  VStack,
  Text,
  Textarea,
  Input,
  Select,
  createListCollection,
  Badge,
  Circle,
} from "@chakra-ui/react";
import { Field, FieldArray, Formik, Form as FormikForm } from "formik";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  QuestionForm,
  QuestionFormSaveFields,
  QuestionWithRelations,
} from "../type";
import { handleReturnError } from "@/db/error-handling";
import { useQueryClient } from "@tanstack/react-query";
import { SupportedLocale, useUX } from "@/context/UXContext";
import { dictionary } from "../dictionary";
import FullPageLoader from "@/components/Generic/FullPageLoader";
import * as Yup from "yup";

import { useParams } from "next/navigation";
import { createQuestion, updateQuestion } from "@/services/Questions";
import CustomSelect from "@/components/Generic/Formik/CustomSelect";
import { FaPlusCircle, FaTimes } from "react-icons/fa";
import { TranslationText } from "@/types";

import { toaster } from "@/components/ui/toaster";
import { useMultilingualForm } from "@/hooks/useMultilingualForm";
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
  note: Yup.string(),
  required: Yup.boolean(),
  type: Yup.string().required("Type is required"),
  options: Yup.array().when("type", {
    is: (val: string) =>
      ["select", "checkbox", "radio", "multi-select"].includes(val),
    then: (schema) =>
      schema.min(1, "At least one option is required").of(
        Yup.object({
          label: Yup.array()
            .of(
              Yup.object().shape({
                language: Yup.string().required("Label Language is required"),
                text: Yup.string().required("Label is required"),
              })
            )
            .min(1, "At least one language text is required"),
          value: Yup.string().required("Value required"),
        })
      ),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const titleInitializer: TranslationText = {
  language: "en",
  text: "",
};

const initialData: QuestionForm = {
  title: [titleInitializer],
  description: [titleInitializer],
  unitId: "",
  note: "",
  options: [],
  conditions: [],
  required: false,
  type: "text",
};

const conditions = [
  { value: "equals", label: "Equals" },
  { value: "notEquals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "notContains", label: "Not Contains" },
  { value: "greaterThan", label: "Greater Than" },
  { value: "lessThan", label: "Less Than" },
];

const questionTypes = [
  "Text",
  "Email",
  "Password",
  "Number",
  "Date",
  "Textarea",
  "Select",
  "Checkbox",
  "Radio",
  "Multi-select",
];

type QuestionTranslations = Pick<QuestionForm, 'title' | 'description'>;

// New type for option translations


const Form = ({
  unitId,
  otherQuestions,
  question,
}: {
  unitId: string;
  otherQuestions: QuestionWithRelations[];
  question?: QuestionWithRelations;
}) => {
  const queryClient = useQueryClient();
  const [initialValues, setInitialValues] = useState<QuestionForm>(initialData);
  const { translate, supportedLocales } = useUX();

    // Define which fields contain translations
    const translationFields: (keyof QuestionTranslations)[] = ['title', 'description'];
    
    const multilingualForm = useMultilingualForm<QuestionTranslations>('en', supportedLocales, translationFields);
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
    if (question) {
      const questionDetails = (question.details ||
        {}) as PrismaJson.QuestionDetail;
      setInitialValues({
        id: question.id,
        unitId: question.unitId,
        title: (question.title as PrismaJson.PartialTranslation[]).map(
          (t) => t.body
        ),
        description: (
          question.description as PrismaJson.PartialTranslation[]
        ).map((t) => t.body),
        note: questionDetails?.note,
        options: (questionDetails.options || []).map((option) => ({
          label: option.label.map((o) => ({
            language: o.body.language,
            text: o.body.text,
          })),
          value: option.value,
        })),
        conditions: questionDetails.conditions,
        required: questionDetails.required,
        type: questionDetails.type,
      } as QuestionForm);
    }
  }, [question]);

  const saveUnit = async (values: QuestionForm) => {
    setIsSaving(true);
    try {
      const optionsToSave = (values.options || []).map((option) => ({
        value: option.value,
        label: option.label.map((translation) => ({
          body: {
            text: translation.text,
            language: translation.language,
          },
        })),
      }));

      const apiData = {
        title: values.title.map((t) => ({
          body: t,
        })),
        description: values.description.map((t) => ({
          body: t,
        })),
        unitId: unitId,
        details: {
          note: values.note,
          type: values.type,
          options: optionsToSave,
          conditions: values.conditions ? values.conditions[0] : undefined,
        },
      } as QuestionFormSaveFields;
      console.log({ apiData });
      if (question) {
        await updateQuestion(question.id, apiData);
      } else {
        await createQuestion(apiData);
      }

      setInitialValues(initialData);
      toaster.create({
        title: translate(dictionary.success),
        description: translate(dictionary.saveSuccess),
        type: "success",
        duration: 5000,
        closable: true,
      });
      await queryClient.refetchQueries({ queryKey: ["sections"] });

      window.location.href = `/questionnaires/${questionnaireId}/sections`;
    } catch (e) {
      const message = handleReturnError(e);
      toaster.create({
        title: translate(dictionary.error),
        description: message,
        type: "error",
        duration: 5000,
        closable: true,
      });
      setIsSaving(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={saveUnit}
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
              <CustomInput
                name="note"
                type="text"
                label={translate(dictionary.note)}
                variant="flushed"
              />
              <HStack>
                <CustomSelect
                  name="type"
                  required
                  width="100px"
                  variant="flushed"
                  label={translate(dictionary.questionType)}
                  options={questionTypes.map((type) => ({
                    value: type.toLowerCase(),
                    label: type,
                  }))}
                />
              </HStack>
              <HStack verticalAlign="center">
                <Field
                  label={translate(dictionary.required)}
                  type="checkbox"
                  name="required"
                />
                <Text fontWeight="semibold" as="span" fontSize="sm">
                  {translate(dictionary.required)}
                </Text>
              </HStack>

              {["select", "checkbox", "radio", "multi-select"].includes(
                formProps.values.type
              ) && (
                <>
                  <Box>{translate(dictionary.options)}</Box>
                  <FieldArray name="options">
                    {({ push, remove }) => {
                      return (
                        <VStack
                          p={2}
                          alignItems="left"
                          bg="gray.50"
                          borderRadius="md"
                          gap={3}
                        >
                          {/* Instructions */}
                          <Text
                            color="gray.500"
                            fontSize="sm"
                            fontStyle="italic"
                          >
                            Enter option labels in {currentLanguage}
                          </Text>

                          {formProps.values.options?.map((option, idx) => (
                            <Box
                              key={idx}
                              p={3}
                              bg="white"
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor="gray.200"
                            >
                              <HStack justify="space-between" mb={2}>
                                <Text
                                  fontSize="sm"
                                  fontWeight="semibold"
                                  color="gray.700"
                                >
                                  Option {idx + 1}
                                </Text>
                                <IconButton
                                  size="xs"
                                  variant="plain"
                                  color="red.500"
                                  onClick={() => remove(idx)}
                                  aria-label="remove option"
                                >
                                  <FaTimes />
                                </IconButton>
                              </HStack>

                              <Stack gap={3} direction="row">
                                <Box>
                                  <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                    color="gray.700"
                                    mb="2"
                                  >
                                    Option Label in {currentLanguage} *
                                  </Text>
                                  <Input
                                    value={(() => {
                                      const option =
                                        formProps.values.options?.[idx];
                                      if (!option?.label) return "";
                                      const translation = option.label.find(
                                        (t) => t.language === currentLanguage
                                      );
                                      return translation?.text || "";
                                    })()}
                                    onChange={(e) => {
                                      const currentOption = option || {
                                        label: [],
                                        value: "",
                                      };
                                      const currentLabels =
                                        currentOption.label || [];
                                      const existingIndex =
                                        currentLabels.findIndex(
                                          (t) => t.language === currentLanguage
                                        );

                                      let updatedLabels: TranslationText[];
                                      if (existingIndex >= 0) {
                                        updatedLabels = [...currentLabels];
                                        updatedLabels[existingIndex] = {
                                          language: currentLanguage,
                                          text: e.target.value,
                                        };
                                      } else {
                                        updatedLabels = [
                                          ...currentLabels,
                                          {
                                            language: currentLanguage,
                                            text: e.target.value,
                                          },
                                        ];
                                      }

                                      setFieldValue(
                                        `options[${idx}].label`,
                                        updatedLabels
                                      );
                                    }}
                                    placeholder={`${translate(
                                      dictionary.label
                                    )} in ${currentLanguage}`}
                                    px={2}
                                    borderRadius="xl"
                                    borderWidth="2px"
                                    size="sm"
                                  />
                                </Box>

                                <Box>
                                  <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                    color="gray.700"
                                    mb="2"
                                  >
                                    Option Value *
                                  </Text>
                                  <Input
                                    value={option.value || ""}
                                    onChange={(e) =>
                                      setFieldValue(
                                        `options[${idx}].value`,
                                        e.target.value
                                      )
                                    }
                                    placeholder={translate(dictionary.value)}
                                    px={2}
                                    size="sm"
                                    borderRadius="xl"
                                    borderWidth="2px"
                                  />
                                </Box>
                              </Stack>
                            </Box>
                          ))}

                          <Box>
                            <Button
                              size="sm"
                              variant="outline"
                              borderColor="gray.300"
                              onClick={() =>
                                push({
                                  label: [
                                    { language: currentLanguage, text: "" },
                                  ],
                                  value: "",
                                })
                              }
                            >
                              <FaPlusCircle />
                              {translate(dictionary.addOption)}
                            </Button>
                          </Box>
                        </VStack>
                      );
                    }}
                  </FieldArray>
                </>
              )}
              {!!(otherQuestions && otherQuestions.length) && (
                <>
                  <Box>{translate(dictionary.condition)}</Box>
                  <FieldArray name="conditions">
                    {({ remove, form }) => (
                      <VStack
                        p={2}
                        alignItems="left"
                        bg="gray.50"
                        borderRadius="md"
                      >
                        {form.values.conditions?.map(
                          (_cond: any, idx: number) => {
                            console.log({ _cond });
                            return (
                              <Stack
                                key={idx}
                                p={2}
                                gap={4}
                                direction={{ base: "column" }}
                              >
                                <CustomSelect
                                  name={`conditions[${idx}].questionId`}
                                  label={translate(dictionary.questionId)}
                                  required
                                  variant="flushed"
                                  options={otherQuestions.map((q) => ({
                                    value: q.id,
                                    label: q.title,
                                  }))}
                                />
                                <HStack>
                                  <CustomSelect
                                    name={`conditions[${idx}].operator`}
                                    label={translate(dictionary.condition)}
                                    required
                                    options={conditions}
                                  />
                                  <CustomInput
                                    name={`conditions[${idx}].value`}
                                    label="Value"
                                    required
                                  />
                                  <IconButton
                                    size="xs"
                                    variant="plain"
                                    color="red.500"
                                    onClick={() => remove(idx)}
                                    aria-label="remove"
                                  >
                                    <FaTimes />
                                  </IconButton>
                                </HStack>
                              </Stack>
                            );
                          }
                        )}{" "}
                        {/* <Box>
                          <Button
                            leftIcon={<FaPlusCircle />}
                            size="xs"
                            variant="link"
                            onClick={() =>
                              push({
                                questionId: "",
                                operator: "equals",
                                value: "",
                              })
                            }
                          >
                            {translate(dictionary.addCondition)}
                          </Button>
                        </Box> */}
                      </VStack>
                    )}
                  </FieldArray>
                </>
              )}
              <HStack>
                <Button
                  type="submit"
                  bg="orange.500"
                  color="white"
                  _hover={{ bg: "orange.600" }}
                >
                  {translate(dictionary.save)}
                </Button>
                <Spacer />
                <Link href={`/questionnaires/${questionnaireId}/sections`}>
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    px="4"
                    py="2"
                    borderWidth="1px"
                    borderColor="gray.300"
                    color="gray.700"
                    borderRadius="md"
                    textDecoration="none"
                    _hover={{ bg: "gray.50" }}
                    cursor="pointer"
                  >
                    {translate(dictionary.cancel)}
                  </Box>
                </Link>
              </HStack>
            </VStack>
          </FormikForm>
        );
      }}
    </Formik>
  );
};

export default Form;
