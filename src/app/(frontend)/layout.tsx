import React from 'react';
import { Flex, VStack } from "@chakra-ui/react";

/**
 * Public layout — no authentication required.
 * Used for pages like election results that are accessible to everyone.
 */
const PublicLayout = ({
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
      bg="#f8fafc"
    >
      <VStack w="full" h="full" borderRadius="md" alignItems="left">
        {children}
      </VStack>
    </Flex>
  );
};

export default PublicLayout;