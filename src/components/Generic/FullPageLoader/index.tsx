import React from 'react';
import { Flex, Spinner, Text } from '@chakra-ui/react';
import { dictionary } from './dictionary';
import { useUX } from '../../../context/UXContext';

const FullPageLoader = () => {
  const { translate } = useUX();
  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      width="100%"
      height="100%"
      alignItems="center"
      justifyContent="center"
      backgroundColor="rgba(255, 255, 255, 0.8)"
      zIndex="1000"
    >
      <Spinner size="xl" /> &nbsp;&nbsp;&nbsp;
      <Text>{translate(dictionary.pleaseWait)}</Text>
    </Flex>
  );
};

export default FullPageLoader;
