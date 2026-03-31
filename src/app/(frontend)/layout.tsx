import React from 'react';
import { Flex, VStack } from "@chakra-ui/react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuthOptions } from "../auth";
import { AuthProvider } from "@/context/AuthContext";

const ProtectedLayout = async ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const session = await getServerSession(AuthOptions);
  // console.log("session", session);
  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider session={session}>
      <Flex
        as="main"
        w="full"
        h="full"
        minH="100vh"
        alignItems="start"
        justifyContent="start"
        flexDirection="column"
      >
        <VStack w="full" h="full" borderRadius="md" alignItems="left">
          {children}
        </VStack>
      </Flex>
    </AuthProvider>
  );
};

export default ProtectedLayout;