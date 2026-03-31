import { useUX } from '@/context/UXContext';
import { handleReturnError } from '@/db/error-handling';
import { deleteQuestionnaire } from "@/services/Questionnaires";
import { IconButton, createToaster } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react'
import { FaTimes } from "react-icons/fa";
import { dictionary } from "../dictionary";

type DeleteModuleProps = {
  id: string;
  disabled: boolean;
};
const DeleteQuestionnaire = ({ id, disabled }: DeleteModuleProps) => {
  const toaster = createToaster({
    placement: "top-end",
  });
  const queryClient = useQueryClient();
  const { translate } = useUX();
  const handleDeleteQuestionnaire = async (id: string) => {
    try {
      await deleteQuestionnaire(id);
      await queryClient.refetchQueries({ queryKey: ["modules"] });
      
      toaster.success({
        title: translate(dictionary.success),
        description: translate(dictionary.deleteQuestionnaire),
      });
      
    } catch (error) {
      const message = handleReturnError(error);
      
      toaster.error({
        title: translate(dictionary.error),
        description: translate(dictionary.deleteErrorDescription),
      });
      console.error("Delete error:", message);
    }
  };

  return (
    <IconButton
      size="xs"
      disabled={disabled}
      cursor="pointer"
      borderRadius="full"
      color="gray.600"
      _hover={{ bg: "orange.50", color: "warchild.white.default" }}
      aria-label={translate(dictionary.deleteModule)}
      onClick={async () => {
        if (!id) {
          toaster.error({
            title: translate(dictionary.error),
            description: translate(dictionary.deleteErrorDescription),
          });
        } else {
          await handleDeleteQuestionnaire(id);
        }
      }}
    >
      <FaTimes />
    </IconButton>
  );
};
export default DeleteQuestionnaire