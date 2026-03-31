import { Box, Flex, VStack, Text, Heading, HStack, Icon } from "@chakra-ui/react";
import React from "react";
import GenericPage from "@/components/Generic/Page";
import { MdHowToVote } from "react-icons/md";
import { FaChartBar } from "react-icons/fa";

const page = () => {
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
      <VStack w="full" h="full" borderRadius="md" alignItems="left">
        <GenericPage title={"Election Results Tracker"}>
          <VStack gap={6} alignItems="start" w="full">
            <Text fontSize="lg" color="gray.600">
              A simple platform for collecting and tracking election results from polling stations across the country.
            </Text>
            <HStack gap={8} flexWrap="wrap">
              <Box
                p={6}
                borderWidth="1px"
                borderRadius="lg"
                bg="blue.50"
                minW="250px"
              >
                <HStack gap={3} mb={3}>
                  <Icon fontSize="2xl" color="blue.500">
                    <MdHowToVote />
                  </Icon>
                  <Heading size="md">Enter Results</Heading>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Polling station agents can submit election results in real-time using custom forms.
                </Text>
              </Box>
              <Box
                p={6}
                borderWidth="1px"
                borderRadius="lg"
                bg="green.50"
                minW="250px"
              >
                <HStack gap={3} mb={3}>
                  <Icon fontSize="2xl" color="green.500">
                    <FaChartBar />
                  </Icon>
                  <Heading size="md">View Dashboard</Heading>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Track live results with charts and breakdowns by polling station, constituency, and county.
                </Text>
              </Box>
            </HStack>
          </VStack>
        </GenericPage>
      </VStack>
    </Flex>
  );
};

export default page;
