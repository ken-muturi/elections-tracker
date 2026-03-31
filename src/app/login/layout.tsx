import React from 'react';
import { Flex, VStack } from "@chakra-ui/react";
const ProtectedLayout = async ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <Flex
      as="main"
      w="full"
      h="full"
      minH="100vh"
      alignItems="start"
      justifyContent="start"
      flexDirection="column"
    >
      <VStack
        w="full"
        h="full"
        borderRadius="md"
        // shadow="base"
        alignItems="left"
      >
        {children}
      </VStack>
    </Flex>
  );
};

export default ProtectedLayout;