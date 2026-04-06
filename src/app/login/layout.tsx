import React from 'react';
import { Box } from "@chakra-ui/react";

const LoginLayout = async ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <Box as="main" w="full" minH="100vh">
      {children}
    </Box>
  );
};

export default LoginLayout;
