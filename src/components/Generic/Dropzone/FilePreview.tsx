import React from 'react';
import {
  IconButton,
  Center,
  Icon,
  Square,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FaFileImage, FaTimesCircle } from 'react-icons/fa';
import type { CenterProps } from '@chakra-ui/react';
import { dictionary } from './dictionary';
import { useUX } from '@/context/UXContext';

type FilePreviewProps = {
  file: File;
  isInline?: boolean;
  onRemove: () => void;
} & CenterProps;

const FilePreview = ({ file, isInline, onRemove, ...props }: FilePreviewProps) => {
  const { translate } = useUX();
  return (
    <Center
      borderWidth="1px"
      borderRadius="lg"
      // px="6"
      px={isInline ? 2 : 6}
      py={isInline ? 2 : 4}
      bg={'gray.50'}
      {...props}
    >
      <VStack gap={2}>
        {isInline ? (
          <>
            <Text fontSize="xs" color="muted">
              {`${file.name}`}
            </Text>
          </>
        ) : (
          <>
            <Square size="10" bg="bg-subtle" borderRadius="lg">
              <Icon as={FaFileImage} boxSize="5" color="muted" />
            </Square>
            <Text>{file.name}</Text>
            <Text fontSize="sm" color="muted">
              {`${file.type} (${file.size} bytes)`}
            </Text>
          </>
        )}
      </VStack>
      <IconButton
        variant="ghost"
        size="sm"
        onClick={onRemove}
        aria-label={translate(dictionary.removeFile)}
        pos="absolute"
        top={8}
        right={1}
      >
        <Icon as={FaTimesCircle} />
      </IconButton>
    </Center>
  );
};

export default FilePreview;
