import { Box, HStack } from '@chakra-ui/react'
import React from 'react'

const Footer = () => {
  return (
    <Box
      as="footer"
      w="full"
      // bg="orange.50"
      // color="warchild.white.default"
      textAlign="center"
      py={5}
    >
      <HStack alignItems="center" justifyContent="center" gap={2}>
        <Box fontSize="sm">
          &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP}. All
          rights reserved.
        </Box>
      </HStack>
    </Box>
  );
}

export default Footer