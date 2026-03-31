'use client'

import { BoxProps, VStack } from '@chakra-ui/react'
import React from 'react'
import NextBreadcrumb from '../Breadcrumb';

type ContentWrapperProps = {
  hasBreadCrumb?: boolean;
  children: React.ReactNode;
} & BoxProps

const ContentWrapper = ({ children, hasBreadCrumb = false, ...props }: ContentWrapperProps) => {
  const borderColor = 'white.200'; // Using static value instead of useColorModeValue
  const styles = hasBreadCrumb ? {
    borderWidth: "thin",
    bg: "gray.200",
    borderColor,
    borderRadius: 'sm',
    alignContent: "start"
  } : {}
  
  // Filter out potentially problematic props
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { direction, ...stackProps } = props;
  
  return (
    <VStack
      px={4}
      pt={2}
      pb={6}
      w="full"
      h="full"
      borderRadius="md"
      bg="whiteAlpha.800"
      alignItems="left"
      {...(hasBreadCrumb ? styles : {})}
      {...stackProps}
    >
      {hasBreadCrumb && <NextBreadcrumb capitalizeLinks />}
      {children}
    </VStack>
  );
}

export default ContentWrapper
