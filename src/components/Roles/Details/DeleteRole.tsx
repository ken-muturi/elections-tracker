import { handleReturnError } from '@/db/error-handling';
import { deleteRole } from "@/services/Roles";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { FaTrash } from "react-icons/fa";
import { dictionary } from "../dictionary";
import { useUX } from "@/context/UXContext";
import StyledIconButton from "@/components/Generic/StyledIconButton";

type DeleteRoleProps = {
  id: string;
};
const DeleteRole = ({ id }: DeleteRoleProps) => {
  const { translate } = useUX();
  const queryClient = useQueryClient();

  const handleDeleteRoles = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) {
      return;
    }

    try {
      await deleteRole(id);
      await queryClient.refetchQueries({ queryKey: ["roles"] });
      toaster.create({
        title: translate(dictionary.success),
        description: "Role deleted successfully",
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
    <StyledIconButton
      variant="delete"
      aria-label={translate(dictionary.deleteRole)}
      onClick={async () => {
        if (id) {
          await handleDeleteRoles(id);
        } else {
          toaster.create({
            title: "Error",
            description: translate(dictionary.deleteErrorDescription),
            type: "error",
            duration: 5000,
          });
        }
      }}
    >
      <FaTrash />
    </StyledIconButton>
  );
};

export default DeleteRole;