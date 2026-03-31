import { useUX } from '@/context/UXContext'
import { Box, VStack } from '@chakra-ui/react'
import React from 'react'
import { dictionary } from './dictionary'

const Popover = ({
  title,
  details,
}: {
  title: string;
  details: PrismaJson.QuestionDetail;
}) => {
  const { translate } = useUX();
  return (
    <VStack p={2} alignItems="left" fontSize="sm">
      <Box fontWeight="bold">{title}</Box>
      <Box>
        {translate(dictionary.questionType)}: &nbsp;
        <Box as="span" fontStyle="italic">
          {details.type}
        </Box>
      </Box>
      <Box>
        {translate(dictionary.options)}: &nbsp;
        {details?.options?.map((o, index) => (
          <Box px={2} fontStyle="italic" key={index}>
            {o.value} - {translate(o.label)}
          </Box>
        ))}
      </Box>
      <Box>
        {translate(dictionary.required)}: &nbsp;
        <Box as="span" fontStyle="italic">
          {details.required ? "true" : "false"}
        </Box>
      </Box>
    </VStack>
  );
};

export default Popover