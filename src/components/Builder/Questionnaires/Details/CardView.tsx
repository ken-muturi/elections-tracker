"use client";
import { useUX } from "@/context/UXContext";
import {
  Box,
  HStack,
  IconButton,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import { dictionary } from "../dictionary";
import DeleteQuestionnaire from "./DeleteQuestionnaire";
import Modal from "@/components/Generic/Modal";
import { FaEdit } from "react-icons/fa";
import Form from "../Form";
import { format } from "date-fns";
import { QuestionnaireDetail, QuestionnaireWithRelations } from "../type";
import { TbListDetails } from "react-icons/tb";

const CardView = ({ forms }: { forms: QuestionnaireWithRelations[] }) => {
  const { translate } = useUX();
  return (
    <Box p={2}>
      <SimpleGrid gap={4} columns={{ base: 1, md: 2, lg: 3 }}>
        {forms.map((d) => {
              const questionnaire = {
                ...d,
                startDate: d.startDate ? format(new Date(d.startDate), "yyyy-MM-dd") : "",
                endDate: d.startDate ? format(new Date(d.endDate), "yyyy-MM-dd") : "",
                hasSections: d.sections && d.sections.length > 0,
              } as QuestionnaireDetail;
          return (
            <VStack
              alignContent="stretch"
              gap={2}
              alignItems="left"
              minH="150px"
              key={questionnaire.id}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
              p={4}
            >
              <Box fontWeight="bold">
                {translate(
                  questionnaire.title as PrismaJson.PartialTranslation[]
                )}
              </Box>
              <Text color="gray.400" fontSize="sm">
                {questionnaire.description.length
                  ? translate(
                      questionnaire.description as PrismaJson.PartialTranslation[]
                    )
                  : "No description provided"}
              </Text>
              <Box bg="orange.50" h="5px" w="full" />
              <HStack
                w="full"
                fontSize="xs"
                bg="warchild.black.900"
                p={4}
                borderRadius="md"
              >
                <IconButton
                  as="a"
                  size="xs"
                  color="warchild.sand.default"
                  _hover={{ bg: "gray.600" }}
                  aria-label={translate(dictionary.viewQuestionnaireDetails)}
                >
                  <TbListDetails />
                </IconButton>
                <Modal
                  size="lg"
                  vh="80vh"
                  title={`${translate(
                    dictionary.editQuestionnaire
                  )} ${translate(
                    questionnaire.title as PrismaJson.PartialTranslation[]
                  )}`}
                  mainContent={<Form questionnaire={questionnaire} />}
                >
                  <IconButton
                    as="a"
                    size="xs"
                    color="orange.400"
                    _hover={{ bg: "gray.600" }}
                    aria-label={translate(dictionary.editQuestionnaire)}
                  >
                    <FaEdit />
                  </IconButton>
                </Modal>
                <DeleteQuestionnaire
                  disabled={questionnaire.hasSections}
                  id={questionnaire.id}
                />
              </HStack>
            </VStack>
          );
        })}
      </SimpleGrid>
    </Box>
  );
};

export default CardView;
