import { useUX } from '@/context/UXContext'
import { Badge, Box, HStack, IconButton } from "@chakra-ui/react";
import React from "react";
import Link from "next/link";
import { dictionary } from "../dictionary";
import Modal from "@/components/Generic/Modal";
import Form from "../Form";
import { MdModeEdit } from "react-icons/md";
import DeleteQuestionnaire from "./DeleteQuestionnaire";
import { QuestionnaireDetail } from "../type";

const Actions = ({ data }: { data: QuestionnaireDetail }) => {
  const { translate } = useUX();
  return (
    <HStack>
      <Box
        colorPalette="purple"
        _hover={{ colorPalette: "gray" }}
        px={2}
        py={1}
        borderRadius="md"
        cursor="pointer"
        asChild
      >
        <Link href={`/assessments/${data.id}/quiz`}>
          {translate(dictionary.view)}
        </Link>
      </Box>
      <Box
        bg="gray.50"
        _hover={{ bg: "blue.50", color: "blue.600" }}
        px={2}
        py={1}
        borderRadius="md"
        cursor="pointer"
        asChild
      >
        <Link href={`/questionnaires/${data.id}/sections`}>
          {translate(dictionary.editQuestions)}
        </Link>
      </Box>
      <Box
        bg="gray.50"
        _hover={{ bg: "blue.50", color: "blue.600" }}
        px={2}
        py={1}
        borderRadius="md"
        cursor="pointer"
        asChild
      >
        <Link href={`/questionnaires/${data.id}/answers`}>
          {translate(dictionary.answers)}
        </Link>
      </Box>
      <Modal
        size="lg"
        vh="75vh"
        title={`${translate(dictionary.editQuestionnaire)} ${translate(
          data.title
        )}`}
        mainContent={<Form questionnaire={data} />}
      >
        <Box>{translate(dictionary.editQuestionnaire)}</Box>
      </Modal>
      <DeleteQuestionnaire disabled={data.hasSections} id={data.id} />
    </HStack>
  );
};

export default Actions