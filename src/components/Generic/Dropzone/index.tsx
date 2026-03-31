import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Button,
  Box,
  CenterProps,
  HStack,
  Icon,
  Square,
  Text,
  VStack,
  createToaster,
} from "@chakra-ui/react";
import { FiUploadCloud } from "react-icons/fi";
import { dictionary } from "./dictionary";
import { useUX } from "@/context/UXContext";

type DropzoneProps = {
  isInline?: boolean;
  setSelectedFile: (file: File) => void;
  maxSize?: number;
} & CenterProps;

const Dropzone = ({
  setSelectedFile,
  isInline,
  maxSize,
  ...props
}: DropzoneProps) => {
  const toaster = createToaster({
    placement: "top-end",
  });
  const { translate } = useUX();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (maxSize && acceptedFiles[0].size > maxSize) {
        toaster.error({
          title: "File size too large",
          description: `File size should be smaller than ${Math.round(
            maxSize / 1024 / 1024
          )}MB`,
        });
        return;
      }
      setSelectedFile(acceptedFiles[0]);
    },
    [maxSize, setSelectedFile, toaster]
  );
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      w="full"
      px="6"
      py={isInline ? 1 : 4}
      bg="gray.50"
      {...props}
    >
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <VStack gap="3" w="full" alignItems="left">
          {!isInline && (
            <Square size="10" bg="bg-subtle" borderRadius="lg">
              <Icon as={FiUploadCloud} boxSize="5" color="muted" />
            </Square>
          )}
          <VStack gap="1">
            <HStack gap="1" whiteSpace="nowrap">
              <Button variant="ghost" colorScheme="blue" size="sm">
                {translate(dictionary.clickToUploadFile)}
              </Button>
              <Text fontSize="sm" color="muted">
                {translate(dictionary.dragAndDrop)}
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </div>
    </Box>
  );
};

export default Dropzone;
