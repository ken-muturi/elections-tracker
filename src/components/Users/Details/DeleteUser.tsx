'use client'

import { deleteUser } from "@/services/Users";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { FaTrash } from "react-icons/fa";
import StyledIconButton from "@/components/Generic/StyledIconButton";

type deleteUserProps = {
  id: string;
};
const DeleteUsers = ({ id }: deleteUserProps) => {
  const queryClient = useQueryClient();

  const deleteUserDetail = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }
    
    await deleteUser(id);

    queryClient.refetchQueries({ queryKey: ["users"] });

    toaster.create({
      title: "Success",
      description: "User deleted successfully",
      type: "success",
      duration: 5000,
    });
  };

  return (
    <StyledIconButton
      variant="delete"
      aria-label="Delete user"
      onClick={async () => {
        await deleteUserDetail(id.toString());
      }}
    >
      <FaTrash />
    </StyledIconButton>
  );
};

export default DeleteUsers