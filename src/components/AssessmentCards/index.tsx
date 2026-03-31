"use client";
import { useUX } from "@/context/UXContext";
import {
  Box,
  Button,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { Questionnaire } from "@prisma/client";
import React from "react";
import { dictionary } from "./dictionary";
import { ucwords } from "@/utils/util";
import Link from "next/link";
import { MdHowToVote } from "react-icons/md";

type AssessmentProps = {
  assessments: Questionnaire[];
};

const Assessments = ({ assessments }: AssessmentProps) => {
  const { translate } = useUX();
  return (
    <VStack gap={4} p={4} alignItems="left" w="full">
      <SimpleGrid gap={4} columns={{ base: 1, md: 2, lg: 3 }}>
        {assessments.map((questionnaire) => {
          const isActive =
            new Date(questionnaire.startDate) <= new Date() &&
            new Date(questionnaire.endDate) >= new Date();
          return (
            <VStack
              alignContent="stretch"
              gap={2}
              alignItems="left"
              minH="150px"
              key={questionnaire.id}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={isActive ? "green.200" : "gray.200"}
              p={4}
            >
              <HStack justifyContent="space-between">
                <Text fontWeight="bold">
                  {ucwords(
                    translate(
                      questionnaire.title as PrismaJson.PartialTranslation[]
                    )
                  )}
                </Text>
                <Badge
                  colorPalette={isActive ? "green" : "gray"}
                  fontSize="xs"
                >
                  {isActive ? "Active" : "Closed"}
                </Badge>
              </HStack>
              <Text color="gray.400" fontSize="sm">
                {questionnaire.description
                  ? translate(
                      questionnaire.description as PrismaJson.PartialTranslation[]
                    )
                  : "No description provided"}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {new Date(questionnaire.startDate).toLocaleDateString()} -{" "}
                {new Date(questionnaire.endDate).toLocaleDateString()}
              </Text>
              <HStack w="full" mt="auto" pt={2}>
                {isActive && (
                  <Link href={`/assessments/${questionnaire.id}/quiz`}>
                    <Button
                      size="sm"
                      colorPalette="blue"
                    >
                      <MdHowToVote />
                      {translate(dictionary.assessment)}
                    </Button>
                  </Link>
                )}
                <Link href={`/election-results/${questionnaire.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    {translate(dictionary.reports)}
                  </Button>
                </Link>
              </HStack>
            </VStack>
          );
        })}
      </SimpleGrid>
    </VStack>
  );
};

export default Assessments;
