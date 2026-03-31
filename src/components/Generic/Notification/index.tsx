import { ucwords } from '@/utils/util';
import {
  Box,
  HStack,
  VStack,
  Icon,
  type BoxProps,
} from '@chakra-ui/react';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaTimes 
} from 'react-icons/fa';

export type NotificationStatus = 'success' | 'error' | 'warning' | 'info';

export type Notification = {
  message: string;
  type: NotificationStatus;
  hasTitle?: boolean;
  hasIcon?: boolean;
} & BoxProps;

const getStatusColor = (type: NotificationStatus) => {
  switch (type) {
    case 'success':
      return 'green.500';
    case 'error':
      return 'red.500';
    case 'warning':
      return 'orange.500';
    case 'info':
    default:
      return 'blue.500';
  }
};

const getStatusIcon = (type: NotificationStatus) => {
  switch (type) {
    case 'success':
      return (
        <Icon color="green.500">
          <FaCheckCircle />
        </Icon>
      );
    case 'error':
      return (
        <Icon color="red.500">
          <FaTimes />
        </Icon>
      );
    case 'warning':
      return (
        <Icon color="orange.500">
          <FaExclamationTriangle />
        </Icon>
      );
    case 'info':
    default:
      return (
        <Icon color="blue.500">
          <FaInfoCircle />
        </Icon>
      );
  }
};

const Index = ({
  message,
  hasTitle = true,
  hasIcon = true,
  type,
  ...boxProps
}: Notification) => {
  const statusColor = getStatusColor(type);
  
  return (
    <Box
      borderWidth="1px"
      borderColor={statusColor}
      borderRadius="md"
      bg={`${statusColor.split('.')[0]}.50`}
      p={4}
      {...boxProps}
    >
      <HStack gap={3} align="flex-start">
        {hasIcon && (
          <Box flexShrink={0} mt={hasTitle ? 0 : 0.5}>
            {getStatusIcon(type)}
          </Box>
        )}
        <VStack align="flex-start" gap={1} flex={1}>
          {hasTitle && (
            <Box
              fontWeight="semibold"
              color={statusColor}
              fontSize="sm"
            >
              {ucwords(type)}
            </Box>
          )}
          <Box
            color="gray.700"
            fontSize="sm"
            lineHeight="1.5"
          >
            {message}
          </Box>
        </VStack>
      </HStack>
    </Box>
  );
};

export default Index;
