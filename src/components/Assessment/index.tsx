/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FullPageLoader from "../Generic/FullPageLoader";
import { Text, Box, VStack, Stack, createToaster, HStack, Badge, Input } from "@chakra-ui/react";
import { SectionWithRelations } from "./type";
import {
  type ActionMeta,
  type GroupBase,
  Select as ReactSelect,
} from "chakra-react-select";

import { getSections } from "@/services/Sections";
import { Questionnaire, PollingStation } from "@prisma/client";
import { DynamicForm, FieldConfig } from "@/utils/form-builder";
import { last } from "lodash";
import { handleReturnError } from "@/db/error-handling";
import { dictionary } from "./dictionary";
import { useUX } from "@/context/UXContext";
import { UnitWithRelation } from "../Builder/Units/type";
import { saveAnswers } from "@/services/Answers";

export type Option = {
  label: string;
  sectionId: string;
  value: string;
};

type StationOption = {
  label: string;
  value: string;
};

const activeStyle = {
  color: "warchild.black.default",
};

const toaster = createToaster({ placement: "top-end" });
const Assessment = ({
  questionnaire,
  sections,
  pollingStations = [],
  readOnly = false,
}: {
  questionnaire: Questionnaire;
  sections: SectionWithRelations[];
  pollingStations?: PollingStation[];
  readOnly?: boolean;
}) => {
  const { translate } = useUX();
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string | undefined>(undefined);
  const [stationSearch, setStationSearch] = useState("");
  const [currentSection, setCurrentSection] = useState<
    SectionWithRelations | undefined
  >(undefined);
  const [currentUnit, setCurrentUnit] = useState<UnitWithRelation | undefined>(
    undefined
  );

  const { data, isLoading } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      return (await getSections(
        { questionnaireId: questionnaire.id },
        true
      )) as SectionWithRelations[];
    },
    initialData: sections,
  });

  const sortedSections = useMemo(
    () =>
      data?.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) ||
      [],
    [data]
  );

  useEffect(() => {
    if (sortedSections && sortedSections.length > 0 && !currentSection) {
      setCurrentSection(sortedSections[0]);
      const sortedSectionUnits = sortedSections[0].units
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setCurrentUnit(sortedSectionUnits[0]);
    }
  }, [sortedSections, currentSection]);

  const questions =
    sortedSections
      ?.find((section) => section.id === currentSection?.id)
      ?.units?.find((unit) => unit.id === currentUnit?.id)?.questions || [];

  const fields = questions
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((question) => {
      const questionDetails = (question.details ||
        {}) as PrismaJson.QuestionDetail;
      return {
        name: question.id,
        label: translate(question.title as PrismaJson.PartialTranslation[]),
        note: questionDetails.note,
        description: translate(
          question.description as PrismaJson.PartialTranslation[]
        ),
        type: questionDetails.type,
        required: questionDetails.required,
        options: questionDetails.options,
        conditions: questionDetails.conditions,
        dynamicOptions: questionDetails.dynamicOptions,
        answer: "",
      } as FieldConfig;
    });

  // check if current unit is the last unit
  // we also need to first check if the section is the last section
  const isLastSection = last(data)?.id === currentSection?.id;
  const isLastUnit =
    last(data?.find((section) => section.id === currentSection?.id)?.units)
      ?.id === currentUnit;
  const buttonText = translate(
    dictionary[isLastSection && isLastUnit ? "submit" : "next"]
  );

  const goToNextUnit = () => {
    // Find current section and unit indices
    const sectionIndex = data.findIndex(
      (section) => section.id === currentSection?.id
    );
    const currentSectionObj = data[sectionIndex];
    const currentSectionUnits = currentSectionObj.units.sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    const unitIndex = currentSectionUnits.findIndex(
      (unit) => unit.id === currentUnit?.id
    );

    if (unitIndex < currentSectionUnits.length - 1) {
      setCurrentUnit(currentSectionUnits[unitIndex + 1]);
    } else if (sectionIndex < data.length - 1) {
      // If last unit in section, go to first unit of next section
      setCurrentSection(data[sectionIndex + 1]);
      setCurrentUnit(data[sectionIndex + 1].units[0]);
    } else {
      // Last unit of last section: handle completion (e.g., show a message)
      toaster.success({
        title: translate(dictionary.success),
        description: translate(dictionary.saveSuccess),
      });
    }
  };

  const handleSelectSectionUnit = (option: Option | undefined) => {
    if (!option) {
      setCurrentSection(undefined);
      setCurrentUnit(undefined);
      return;
    }

    const section = data?.find((s) => s.id === option.sectionId);
    const unit = section?.units.find((u) => u.id === option.value);

    if (section && unit) {
      setCurrentSection(section);
      setCurrentUnit(unit);
    }
  };

  const saveAssessment = async (values: any) => {
    if (!selectedStation) {
      toaster.error({
        title: "Please select a polling station",
        description: "You must select a polling station before submitting results.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const answerEntries = Object.entries(values).map(
        ([questionId, answer]) => ({
          questionId,
          answer: String(answer),
        })
      );

      await saveAnswers(
        answerEntries,
        questionnaire.id,
        selectedStation
      );

      goToNextUnit();
      setIsSaving(false);
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
    <>
      {(isLoading || isSaving) && <FullPageLoader />}
      {!isLoading && (
        <VStack gap={2} w="full" alignItems="left">
          {/* Polling Station Selector */}
          <Box
            p={4}
            borderWidth="1px"
            borderRadius="md"
            bg={selectedStation ? "green.50" : "yellow.50"}
            borderColor={selectedStation ? "green.200" : "yellow.200"}
          >
            <Text fontWeight="bold" fontSize="sm" mb={2}>
              🏛 Select Polling Station
            </Text>
            <Input
              placeholder="Search stations by name or code..."
              value={stationSearch}
              onChange={(e) => setStationSearch(e.target.value)}
              size="sm"
              mb={2}
              maxW="400px"
            />
            {stationSearch && (
              <VStack gap={1} alignItems="start" maxH="200px" overflowY="auto">
                {pollingStations
                  .filter(
                    (s) =>
                      s.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
                      s.code.toLowerCase().includes(stationSearch.toLowerCase())
                  )
                  .slice(0, 10)
                  .map((station) => (
                    <HStack
                      key={station.id}
                      p={2}
                      w="full"
                      cursor="pointer"
                      borderRadius="sm"
                      bg={selectedStation === station.id ? "blue.100" : "white"}
                      _hover={{ bg: "blue.50" }}
                      onClick={() => {
                        setSelectedStation(station.id);
                        setStationSearch("");
                      }}
                    >
                      <Badge colorPalette="blue" size="sm">
                        {station.code}
                      </Badge>
                      <Text fontSize="sm">{station.name}</Text>
                      <Text fontSize="xs" color="gray.400">
                        {station.constituency}, {station.county}
                      </Text>
                    </HStack>
                  ))}
              </VStack>
            )}
            {selectedStation && (
              <HStack mt={1}>
                <Text fontSize="sm" color="green.600">
                  ✓ Selected:{" "}
                  {pollingStations.find((s) => s.id === selectedStation)?.name} (
                  {pollingStations.find((s) => s.id === selectedStation)?.code})
                </Text>
                <Text
                  fontSize="xs"
                  color="blue.500"
                  cursor="pointer"
                  textDecoration="underline"
                  onClick={() => setSelectedStation(undefined)}
                >
                  Change
                </Text>
              </HStack>
            )}
          </Box>

          <Stack
            gap={4}
            direction={{ base: "column", md: "row" }}
            w="full"
            fontSize="xs"
          >
            <VStack
              gap={2}
              alignItems="left"
              p={2}
              w="350px"
              display={{ base: "none", md: "flex" }}
            >
              {(sortedSections || []).map((section) => (
                <Box
                  key={section.id}
                  p={2}
                  borderWidth="thin"
                  borderColor="gray.200"
                  borderRadius="md"
                  bg="gray.50"
                >
                  <Text fontWeight="bold" fontSize="sm" color="green.500">
                    {translate(
                      section.title as PrismaJson.PartialTranslation[]
                    )}
                  </Text>
                  <VStack gap={1} alignItems="left" p={1}>
                    {section.units
                      .slice()
                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                      .map((unit) => (
                        <Text
                          key={unit.id}
                          fontSize="xs"
                          fontWeight="500"
                          px={1}
                          {...(unit.id === currentUnit?.id
                            ? activeStyle
                            : { color: "gray.500" })}
                          cursor="pointer"
                          _hover={activeStyle}
                          onClick={() => {
                            setCurrentSection(section);
                            setCurrentUnit(unit);
                          }}
                        >
                          {translate(
                            unit.title as PrismaJson.PartialTranslation[]
                          )}
                        </Text>
                      ))}
                  </VStack>
                </Box>
              ))}
            </VStack>
            <Box display={{ base: "block", md: "none" }}>
              <ReactSelect<Option, true, GroupBase<Option>>
                size="sm"
                id={`select-unit`}
                instanceId={`select-unit`}
                closeMenuOnSelect
                placeholder={`--- ${translate(dictionary.selectUnit)} ---`}
                options={sections.map((s) => {
                  return {
                    label: translate(
                      s.title as PrismaJson.PartialTranslation[]
                    ).toUpperCase(),
                    options: s.units
                      .slice()
                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                      .map(
                        (u) =>
                          ({
                            value: u.id,
                            sectionId: s.id,
                            label: translate(
                              u.title as PrismaJson.PartialTranslation[]
                            ),
                          } as Option)
                      ),
                  };
                })}
                onChange={(
                  option: readonly Option[],
                  actionMeta: ActionMeta<Option>
                ) => {
                  if (
                    actionMeta?.action === "select-option" &&
                    actionMeta?.option
                  ) {
                    console.log("Selected option:", actionMeta.option);
                    handleSelectSectionUnit(actionMeta?.option);
                  }

                  if (
                    actionMeta?.action === "remove-value" &&
                    actionMeta?.removedValue?.value
                  ) {
                    handleSelectSectionUnit(undefined);
                  }
                }}
              />
            </Box>
            <VStack gap={6} w="full" alignItems="left" pr={2}>
              <Text
                fontSize={{ base: "lg", lg: "xl" }}
                textTransform="capitalize"
                fontWeight="bold"
                borderBottomWidth="thin"
                borderBottomColor="gray.200"
              >
                {translate(
                  currentSection?.title as PrismaJson.PartialTranslation[]
                )}
                &nbsp; - &nbsp;
                {translate(
                  currentUnit?.title as PrismaJson.PartialTranslation[]
                )}
              </Text>
              <DynamicForm
                isReadOnly={readOnly}
                onSubmit={saveAssessment}
                buttonText={buttonText}
                fields={fields}
                translate={translate}
              />
            </VStack>
          </Stack>
        </VStack>
      )}
    </>
  );
};

export default Assessment;
