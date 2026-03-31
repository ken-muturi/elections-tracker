'use client';

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FullPageLoader from "@/components/Generic/FullPageLoader";
import {
  Text,
  Accordion,
  Box,
  VStack,
  IconButton,
  HStack,
  createToaster,
} from "@chakra-ui/react";
import { FaTimes, FaChevronDown } from "react-icons/fa";
import { SectionWithRelations } from "../type";
import { useUX } from "@/context/UXContext";
import { dictionary } from "../dictionary";
import { deleteSection, getSections } from "@/services/Sections";
import Units from "@/components/Builder/Units"; // TODO: Add missing Units component
import { Questionnaire } from "@prisma/client";
import { range } from "lodash";
import { ucwords } from "@/utils/util";
import { handleReturnError } from "@/db/error-handling";
import AddEditSectionModal from "./AddEditSectionModal";

const toaster = createToaster({
  placement: "top",
});

const Details = ({
  questionnaire,
  sections,
}: {
  questionnaire: Questionnaire;
  sections: SectionWithRelations[];
}) => {
  const queryClient = useQueryClient();
  const { translate } = useUX();
  const { data, isLoading } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      return (await getSections(
        { questionnaireId: questionnaire.id },
        true
      )) as SectionWithRelations[];
    },
    placeholderData: sections,
  });

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await deleteSection(sectionId);
      await queryClient.refetchQueries({ queryKey: ["sections"] });
      toaster.create({
        title: translate(dictionary.success),
        type: "success",
        duration: 5000,
      });
    } catch (error) {
      const message = handleReturnError(error);
      toaster.create({
        title: translate(dictionary.error),
        description: message,
        type: "error",
        duration: 5000,
      });
    }
  };

  return (
    <>
      {isLoading && <FullPageLoader />}
      {!isLoading && (
        <VStack gap={2} alignItems="left">
          <Text fontSize="3xl" fontWeight="bold" color="green.700">
            {ucwords(
              translate(questionnaire.title as PrismaJson.PartialTranslation[])
            )}
          </Text>
          <Text fontSize="md" borderBottomWidth="thin" pb={1}>
            {translate(
              questionnaire.description as PrismaJson.PartialTranslation[]
            )}
          </Text>

          <Accordion.Root
            collapsible
            multiple
            value={(sections || []).map((s) => s.id)}
          >
            {(data || []).map((section, index) => (
              <Accordion.Item key={section.id} value={section.id} mb={2}>
                <HStack
                  bg="gray.100"
                  _expanded={{
                    bg: "warchild.sand.default",
                    borderRadius: "lg",
                  }}
                  px={2}
                >
                  <Accordion.ItemTrigger p={1}>
                    <Box flex="1" textAlign="left">
                      {translate(dictionary.section)} {index + 1}:{" "}
                      {translate(
                        section.title as PrismaJson.PartialTranslation[]
                      )}
                    </Box>
                  </Accordion.ItemTrigger>
                  <AddEditSectionModal data={section} />
                  <IconButton
                    variant="ghost"
                    disabled={section.units && section.units.length > 0}
                    size="xs"
                    aria-label={translate(dictionary.deleteSection)}
                    onClick={async () => {
                      await handleDeleteSection(section.id);
                    }}
                  >
                    <FaTimes />
                  </IconButton>
                  <Accordion.ItemIndicator>
                    <FaChevronDown />
                  </Accordion.ItemIndicator>
                </HStack>
                <Accordion.ItemContent p={2}>
                  <Box fontStyle="italic" fontWeight="300" mb={2} fontSize="md">
                    {translate(
                      section.description as PrismaJson.PartialTranslation[]
                    )}
                  </Box>
                  <Units units={section.units || []} sectionId={section.id} />
                </Accordion.ItemContent>
              </Accordion.Item>
            ))}
          </Accordion.Root>

          <AddEditSectionModal />
        </VStack>
      )}
    </>
  );
};

export default Details;