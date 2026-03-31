import { useUX } from '@/context/UXContext';
import { handleReturnError } from '@/db/error-handling';
import { deleteModule } from "@/services/Modules";
import { IconButton } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { FaTimesCircle } from "react-icons/fa";
import { dictionary } from "../dictionary";

type DeleteModuleProps = {
  id: string;
};
const DeleteModule = ({ id }: DeleteModuleProps) => {
  const queryClient = useQueryClient();
  const { translate } = useUX();
  const handleDeleteModule = async (id: string) => {
    try {
      await deleteModule(id);
      await queryClient.refetchQueries({ queryKey: ["modules"] });
      toaster.create({
        title: translate(dictionary.success),
        type: "success",
        duration: 5000,
      });
    } catch (error) {
      const message = handleReturnError(error);
      toaster.create({
        title: translate(dictionary.deleteError),
        description: message,
        type: "error",
        duration: 5000,
      });
    }
  };

  return (
    <IconButton
      size="sm"
      cursor={id ? "default" : "pointer"}
      color={id ? "red" : "gray"}
      as={FaTimesCircle}
      aria-label={translate(dictionary.deleteModule)}
      onClick={async () => {
        if (id) {
          toaster.create({
            title: translate(dictionary.error),
            description: translate(dictionary.deleteErrorDescription),
            type: "error",
            duration: 5000,
          });
        } else {
          await handleDeleteModule(id);
        }
      }}
    />
  );
};
export default DeleteModule