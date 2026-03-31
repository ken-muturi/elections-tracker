'use client';

import React from "react";
import {
  HStack,
  Text,
  Box,
  Spacer,
  BoxProps,
  Container,
} from "@chakra-ui/react";
import { dictionary } from "./dictionary";
import { useUX } from "@/context/UXContext";

import { signOut, useSession } from "next-auth/react";
import LanguageButton from "./LanguageButton";
const TopNav = (props: BoxProps) => {
  const { data: session } = useSession();
  console.log("session", session);
  // const user = session ? session.user : undefined;
  const { translate } = useUX();
  return (
    <Box w="full" {...props}>
      <Container maxW="container.xl" px={4} py={2}>
        <HStack color="orange.50" fontWeight="bold">
          <HStack gap={2} alignItems="center">
            <Box w={8} h={8} bg="orange.50" borderRadius="full" />
            <Text fontSize="2xl" textTransform="uppercase">
              {process.env.NEXT_PUBLIC_APP ?? "Election Results Tracker"}
            </Text>
          </HStack>
          <Spacer />
          <LanguageButton language="en" />
          <LanguageButton language="ar" />
          <LanguageButton language="fr" />
          <Box
            p={1}
            fontSize="md"
            fontWeight={500}
            onClick={async () => {
              await signOut({
                callbackUrl: `/`,
              });
              console.log("sign out");
            }}
          >
            {translate(dictionary.logout)}
          </Box>
        </HStack>
      </Container>
    </Box>
  );
};

export default TopNav;