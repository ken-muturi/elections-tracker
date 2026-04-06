'use client'

import { BoxProps, VStack } from '@chakra-ui/react'
import React from 'react'
import NextBreadcrumb from '../Breadcrumb';

type ContentWrapperProps = {
  hasBreadCrumb?: boolean;
  children: React.ReactNode;
} & BoxProps

const ContentWrapper = ({ children, hasBreadCrumb = false, ...props }: ContentWrapperProps) => {
  const styles = hasBreadCrumb ? {
    borderWidth: "1px",
    borderColor: "gray.100",
    borderRadius: "xl",
    bg: "white",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)",
    alignContent: "start",
  } : {}

  // Filter out potentially problematic props
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { direction, ...stackProps } = props;

  return (
    <VStack
      w="full"
      h="full"
      borderRadius="xl"
      bg="transparent"
      alignItems="stretch"
      {...(hasBreadCrumb ? styles : {})}
      {...stackProps}
    >
      {hasBreadCrumb && (
        <VStack
          px={5}
          pt={4}
          pb={2}
          borderBottomWidth="1px"
          borderBottomColor="gray.100"
          alignItems="stretch"
        >
          <NextBreadcrumb capitalizeLinks />
        </VStack>
      )}
      <VStack
        px={hasBreadCrumb ? 5 : 0}
        pt={hasBreadCrumb ? 4 : 0}
        pb={hasBreadCrumb ? 6 : 0}
        alignItems="stretch"
        w="full"
      >
        {children}
      </VStack>
    </VStack>
  );
}

export default ContentWrapper
