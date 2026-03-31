import { handleReturnError } from '@/db/error-handling';
import { deleteTab } from '@/services/Tabs';
import { IconButton } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { FaTimesCircle } from "react-icons/fa";
import { dictionary } from "../dictionary";
import { useUX } from "@/context/UXContext";

type DeleteTabProps = {
  id: string;
};
const DeleteTab = ({ id }: DeleteTabProps) => {
  const queryClient = useQueryClient();
  const { translate } = useUX();

  const handleDeleteTabs = async (id: string) => {
    try {
      await deleteTab(id);
      await queryClient.refetchQueries({ queryKey: ["tabs"] });
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
    <IconButton
      size="sm"
      cursor={id ? "default" : "pointer"}
      color={id ? "red" : "gray"}
      as={FaTimesCircle}
      aria-label={translate(dictionary.deleteTab)}
      onClick={async () => {
        if (id) {
          toaster.create({
            title: translate(dictionary.error),
            description: translate(dictionary.deleteErrorDescription),
            type: "error",
            duration: 5000,
          });
        } else {
          await handleDeleteTabs(id);
        }
      }}
    />
  );
};

export default DeleteTab