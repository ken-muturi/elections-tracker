'use client';

import {  useUX } from '@/context/UXContext';
import { Text as TextTranslation, PartialTranslation } from '@/types';
import { Box, Container, Heading } from "@chakra-ui/react";
import React from "react";
import Footer from "../Footer";
import Navigation from "@/components/Menus/Horizontal/Menu";
type PageProps = {
  minH?: string | number;
  title:
    | string
    | TextTranslation
    | PartialTranslation
    | PartialTranslation[]
    | undefined
    | React.ReactNode;
  children: React.ReactNode;
};

const Page = ({ children, title, minH = "35vh" }: PageProps) => {
  const { translate } = useUX();
  return (
    <>
      <Box
        bgGradient="to-b"
        gradientFrom="brand.lime"
        gradientTo="brand.olive"
        minH={minH}
        w="full"
      >
        {/* Navigation */}
        <Box maxW="7xl" mx="auto" px={0}>
          <Navigation />
        </Box>

        {/* Title Section */}
        {title && (
          <Box maxW="7xl" mx="auto" px={4} py={4}>
            {React.isValidElement(title) ? (
              <Box w="full">{title}</Box>
            ) : (
              <Box textAlign="center" w="full">
                <Heading
                  fontWeight="bold"
                  fontSize={{ base: "xl", md: "3xl" }}
                  color="primary.100"
                  px={3}
                  mt={3}
                >
                  {typeof title === "string"
                    ? title
                    : (title as
                        | TextTranslation
                        | PartialTranslation
                        | PartialTranslation[]) &&
                      translate(
                        title as
                          | TextTranslation
                          | PartialTranslation
                          | PartialTranslation[]
                      )}
                </Heading>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Main Content Section */}
      <Box mt="-100px" minH="calc(100vh - 250px)" w="full">
        <Container
          maxW="7xl"
          mx="auto"
          p={6}
          bgGradient="to-b"
          gradientFrom="white"
          gradientVia="brand.light"
          gradientTo="gray.50"
        >
          {children}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default Page