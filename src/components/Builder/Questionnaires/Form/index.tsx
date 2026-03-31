'use client'

import React, { useEffect, useState } from 'react';
import { Formik, Form as FormikForm } from 'formik';

import { Check } from 'lucide-react';
import { TranslationText } from '@/types';
import { QuestionnaireDetail } from '../type';
import { SupportedLocale, useUX } from '@/context/UXContext';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { handleReturnError } from '@/db/error-handling';
import { dictionary } from '../dictionary';
import { createQuestionnaire, updateQuestionnaire } from '@/services/Questionnaires';
import { schema } from './schema';
import { useMultilingualForm } from '@/hooks/useMultilingualForm';
import { 
  Box, 
  HStack, 
  VStack, 
  Text, 
  Button, 
  Input, 
  Textarea,
  Badge,
  Circle,
  createToaster,
  Select,
  createListCollection
} from '@chakra-ui/react';
import FullPageLoader from '@/components/Generic/FullPageLoader';

type QuestionnaireForm = {
  id?: string;
  title: TranslationText[];
  description: TranslationText[];
  startDate: string;
  endDate: string;
};

// Create a type that matches our multilingual fields for the hook
type QuestionnaireTranslations = Pick<QuestionnaireForm, 'title' | 'description'>;

const titleInitializer: TranslationText = {
  language: "en",
  text: "",
};

const initialData: QuestionnaireForm = {
  title: [titleInitializer],
  description: [titleInitializer],
  startDate: "",
  endDate: "",
};

const MultilingualFormikForm = ({ questionnaire }: { questionnaire?: QuestionnaireDetail }) => {
  const { translate, supportedLocales: languages } = useUX();
  const [initialValues, setInitialValues] = useState<QuestionnaireForm>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  
  // Define which fields contain translations
  const translationFields: (keyof QuestionnaireTranslations)[] = ['title', 'description'];
  
  const multilingualForm = useMultilingualForm<QuestionnaireTranslations>('en', languages, translationFields);
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
  
  const toaster = createToaster({
    placement: "top-end",
  });
  
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (questionnaire) {
      setInitialValues({
        id: questionnaire.id,
        title: (questionnaire.title as PrismaJson.PartialTranslation[]).map(
          (t) => t.body
        ),
        description: (
          questionnaire.description as PrismaJson.PartialTranslation[]
        ).map((t) => t.body),
        startDate: format(new Date(questionnaire.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(questionnaire.endDate), "yyyy-MM-dd"),
      } as QuestionnaireForm);
    }
  }, [questionnaire]);

  const saveQuestionnaire = async (values: QuestionnaireForm) => {
    setIsSaving(true);
    try {
      console.log({ values });
      const apiData = {
        ...values,
        title: values.title.map(t => ({ body: t })),
        description: values.description.map(t => ({ body: t }))
      };
      if (questionnaire) {
        await updateQuestionnaire(questionnaire.id, apiData);
      } else {
        await createQuestionnaire(apiData);
      }

      setInitialValues(initialData);
      
      toaster.success({
        title: translate(dictionary.success),
        description: translate(dictionary.saveSuccess),
      });
      
      await queryClient.refetchQueries({ queryKey: ["questionnaires"] });

      window.location.href = "/questionnaires";
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
        onSubmit={saveQuestionnaire}
        validationSchema={schema}
        enableReinitialize={true}
      >
        {(formProps) => {
          const { values, setFieldValue, errors, touched } = formProps;
          console.log({ formProps });
          return (
            <FormikForm>
                {isSaving && <FullPageLoader />}
                <VStack alignItems="left" gap={2}>
                  {/* Language Pills */}
                  <HStack gap="2">
                    {getActiveLanguages(values).map(langCode => {
                      return (
                        <Badge
                          key={langCode}
                          variant={currentLanguage === langCode ? "solid" : "outline"}
                          colorScheme={currentLanguage === langCode ? "blue" : "gray"}
                          size="lg"
                          px={4}
                          py={2}
                          borderRadius="full"
                          cursor="pointer"
                          onClick={() => setCurrentLanguage(langCode as SupportedLocale)}
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
                          addLanguage(details.value[0] as SupportedLocale, values, setFieldValue);
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
                        {getAvailableLanguages(values).map(lang => (
                            <Select.Item key={lang} item={lang}>
                              <Select.ItemText>{lang}</Select.ItemText>
                            </Select.Item>
                          ))}
                      </Select.Content>
                      </Select.Root>
                    </Box>
                  </HStack>

                  {/* Form */}
                    <Text color="gray.500" fontSize="sm" fontStyle="italic">Enter content in {currentLanguage}</Text>

                      <Box width="full">
                        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">Question Title *</Text>
                        <Input
                        p={2}
                          name="title"
                          value={getCurrentText('title', values)}
                          onChange={(e:React.ChangeEvent<HTMLInputElement>) => {
                            console.log(e.target.value);
                            updateTranslation('title', e.target.value, values, setFieldValue)
                          }}
                          placeholder={`Enter title in ${currentLanguage}`}
                          borderRadius="xl"
                          borderWidth="2px"
                          borderColor={errors.title && touched.title ? "red.500" : "gray.200"}
                        />
                        {errors.title && touched.title && (
                          <Text color="red.500" fontSize="sm" mt="1">{errors.title as string}</Text>
                        )}
                      </Box>

                      <Box width="full">
                        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">Question Description *</Text>
                        <Textarea
                          name="description"
                          value={getCurrentText('description', values)}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateTranslation('description', e.target.value, values, setFieldValue)}
                          placeholder={`Enter description in ${currentLanguage}`}
                          rows={5}
                          p={2}
                          borderRadius="xl"
                          borderWidth="2px"
                          borderColor={errors.description && touched.description ? "red.500" : "gray.200"}
                          resize="none"
                        />
                        {errors.description && touched.description && (
                          <Text color="red.500" fontSize="sm" mt="1">{errors.description as string}</Text>
                        )}
                      </Box>

                      {/* Date Fields */}
                      <HStack gap="4" width="full">
                        <Box flex="1">
                          <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">Start Date *</Text>
                          <Input
                          p={2}
                            type="date"
                            value={values.startDate}
                            onChange={(e) => setFieldValue('startDate', e.target.value)}
                            borderRadius="xl"
                            borderWidth="2px"
                            borderColor={errors.startDate && touched.startDate ? "red.500" : "gray.200"}
                          />
                          {errors.startDate && touched.startDate && (
                            <Text color="red.500" fontSize="sm" mt="1">{errors.startDate as string}</Text>
                          )}
                        </Box>

                        <Box flex="1">
                          <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="2">End Date *</Text>
                          <Input
                          p={2}
                            type="date"
                            value={values.endDate}
                            onChange={(e) => setFieldValue('endDate', e.target.value)}
                            borderRadius="xl"
                            borderWidth="2px"
                            borderColor={errors.endDate && touched.endDate ? "red.500" : "gray.200"}
                          />
                          {errors.endDate && touched.endDate && (
                            <Text color="red.500" fontSize="sm" mt="1">{errors.endDate as string}</Text>
                          )}
                        </Box>
                      </HStack>

                    {/* Progress */}
                    <Box mt="8" pt="6" borderTop="1px" borderColor="gray.200">
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          {getActiveLanguages(values).filter(lang => hasAnyContent(lang, values)).length} of {getActiveLanguages(values).length} languages completed
                        </Text>
                        <HStack gap="2">
                          {getActiveLanguages(values).map(langCode => (
                            <Circle
                              key={langCode}
                              size="3"
                              bg={hasAnyContent(langCode, values) ? "green.500" : "gray.300"}
                            />
                          ))}
                        </HStack>
                      </HStack>
                    </Box>

                    <HStack justify="space-between" mt="4">
                      <Button 
                        variant="outline"
                        borderColor="gray.300"
                        color="gray.700"
                        borderRadius="xl"
                        _hover={{ bg: "gray.50" }}
                        onClick={() => window.location.href = "/questionnaires"}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        bg="blue.600"
                        color="white"
                        px="6"
                        py="3"
                        borderRadius="xl"
                        _hover={{ bg: "blue.700" }}
                        fontWeight="medium"
                      >
                        Save Question
                      </Button>
                    </HStack>
                </VStack>
            </FormikForm>
          )
        }}
      </Formik>
  );
};

export default MultilingualFormikForm;