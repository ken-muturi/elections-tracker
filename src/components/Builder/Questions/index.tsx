'use client';

import React, { useState } from "react";
import {
  Box,
  Button,
  Stack,
  VStack,
  IconButton,
  Icon,
  HStack,
  Popover,
  createToaster,
} from "@chakra-ui/react";
import { FaTimes } from "react-icons/fa";
import { useUX } from "@/context/UXContext";
import { dictionary } from "./dictionary";
import { QuestionWithRelations } from "./type";
import { GoGrabber } from "react-icons/go";
import QuestionDetails from "./QuestionDetails";
import { Reorder } from "framer-motion";
import { updateQuestionOrder } from "@/services/Questions";
import { handleReturnError } from "@/db/error-handling";
import AddEditQuestionModal from "./AddEditQuestionModal";
const toaster = createToaster({
  placement: "top-end",
});

const Details = ({
  questions: initialQuestions,
  unitId,
}: {
  unitId: string;
  questions: QuestionWithRelations[];
}) => {
  const { translate } = useUX();
  const questions = (initialQuestions || []).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  const [sortableQuestions, setSortableQuestions] = useState(questions);

  const handleReorder = async (newOrder: QuestionWithRelations[]) => {
    try {
      setSortableQuestions(newOrder);
      const sortedQuestions = newOrder.map((q, idx) => ({
        id: q.id,
        sortOrder: idx,
      }));
      await updateQuestionOrder(sortedQuestions);
    } catch (error) {
      const message = handleReturnError(error);
      toaster.error({
        title: translate(dictionary.error),
        description: message,
      });
    }
  };

  return (
    <VStack gap="2" alignItems="left">
      <Reorder.Group
        axis="y"
        values={sortableQuestions}
        onReorder={handleReorder}
        style={{ listStyle: "none", padding: 0, margin: 0 }}
      >
        {(sortableQuestions || []).map((question) => {
          const questionDetails = (question.details ||
            {}) as PrismaJson.QuestionDetail;
          return (
            <Reorder.Item
              key={question.id}
              value={question}
              style={{ marginBottom: "8px" }}
              whileDrag={{
                scale: 1.02,
                boxShadow: "0px 10px 30px rgba(0,0,0,0.15)",
                zIndex: 1000,
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Stack
                direction={{ base: "column", md: "row" }}
                key={question.id}
                fontSize="sm"
                p={1}
                bg="white"
                w="full"
                cursor="grab"
                _active={{ cursor: "grabbing" }}
                _hover={{ borderColor: "red.50" }}
              >
                <HStack>
                  <Icon
                    size="md"
                    fontWeight="bold"
                    verticalAlign="middle"
                    fontSize="md"
                    color="green.600"
                  >
                    <GoGrabber />
                  </Icon>
                  <Box fontSize="sm">
                    {translate(
                      question.title as PrismaJson.PartialTranslation[]
                    )}
                  </Box>
                </HStack>
                <HStack>
                  <Popover.Root>
                    <Popover.Trigger>
                      <Box as="span" fontSize="xs">
                        <Box as="span" display={{ md: "none" }} fontSize="xs">
                          {translate(dictionary.questionType)}: &nbsp;
                        </Box>
                        {questionDetails.type.toUpperCase()}
                      </Box>
                    </Popover.Trigger>
                    <Popover.Content>
                      <Popover.Arrow />
                      <Popover.CloseTrigger />
                      <Popover.Header>
                        {translate(dictionary.questionDetails)}
                      </Popover.Header>
                      <Popover.Body>
                        <QuestionDetails
                          title={translate(
                            question.title as PrismaJson.PartialTranslation[]
                          )}
                          details={questionDetails}
                        />
                      </Popover.Body>
                    </Popover.Content>
                  </Popover.Root>

                  <AddEditQuestionModal
                    question={question}
                    unitId={unitId}
                    questions={questions}
                  />
                  <HStack gap="0">
                    <Box as="span" display={{ md: "none" }} fontSize="xs">
                      {translate(dictionary.delete)}: &nbsp;
                    </Box>
                    <Icon
                      size="xs"
                      aria-label={translate(dictionary.deleteQuestion)}
                    >
                      <FaTimes />
                    </Icon>
                  </HStack>
                </HStack>
              </Stack>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      <AddEditQuestionModal unitId={unitId} questions={questions} />
    </VStack>
  );
};

export default Details