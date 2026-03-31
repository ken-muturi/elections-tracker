import { handleReturnError } from '@/db/error-handling';
import { deleteRole } from '@/services/Roles';
import { IconButton } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { FaTimesCircle } from "react-icons/fa";
import { dictionary } from "../dictionary";
import { useUX } from "@/context/UXContext";

type DeleteRoleProps = {
  id: string;
};
const DeleteRole = ({ id }: DeleteRoleProps) => {
  const { translate } = useUX();
  const queryClient = useQueryClient();

  const handleDeleteRoles = async (id: string) => {
    try {
      await deleteRole(id);
      await queryClient.refetchQueries({ queryKey: ["roles"] });
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
      aria-label={translate(dictionary.deleteRole)}
      onClick={async () => {
        if (id) {
          await handleDeleteRoles(id);
        } else {
          toaster.create({
            title: "error.",
            description: translate(dictionary.deleteErrorDescription),
            type: "error",
            duration: 5000,
          });
        }
      }}
    />
  );
};
export default DeleteRole