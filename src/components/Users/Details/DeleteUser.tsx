'use client'

import { deleteUser } from "@/services/Users";
import { IconButton } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { FaTimesCircle } from "react-icons/fa";

type deleteUserProps = {
  id: string;
};
const DeleteUsers = ({ id }: deleteUserProps) => {
  const queryClient = useQueryClient();

  const deleteUserDetail = async (id: string) => {
    await deleteUser(id);

    queryClient.refetchQueries({ queryKey: ["users"] });

    toaster.create({
      title: "Success",
      description: "User deleted",
      type: "success",
      duration: 5000,
    });
  };

  return (
    <IconButton
      size="sm"
      cursor="pointer"
      color="red.500"
      as={FaTimesCircle}
      aria-label="delete product"
      onClick={async () => {
        await deleteUserDetail(id.toString());
      }}
    />
  );
};

export default DeleteUsers