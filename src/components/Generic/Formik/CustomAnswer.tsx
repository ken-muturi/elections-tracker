/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { FC, useState } from "react";
import { Field, FieldHookConfig } from "formik";
import {
  Field as ChakraField,
  Button,
  BoxProps,
  HStack,
  Icon,
  Box,
} from "@chakra-ui/react";
import { FaCheckCircle, FaInfoCircle } from "react-icons/fa";

type IFormikFieldProps = {
  name: string;
  label?: string;
  value: string;
  description?: string;
  note?: string;
  required?: boolean;
  options?: { value: string | number; label: string }[];
} & BoxProps;

const CustomAnswer: FC<FieldHookConfig<string> & IFormikFieldProps> = ({
  name,
  label,
  options,
  value,
  required = false,
  description,
}) => {
  const [showHelper, setShowHelper] = useState(false);

  return (
    <ChakraField.Root required={required}>
      {label && (
        <ChakraField.Label
          htmlFor={name}
          id={`${label}-${name.replace(/[^a-z0-9]/gi, "")}-label`}
        >
          {label}
          {description && (
            <Button
              size="xs"
              variant="ghost"
              color="red.500"
              onClick={() => setShowHelper(!showHelper)}
              ml={2}
            >
              <FaInfoCircle />
            </Button>
          )}
        </ChakraField.Label>
      )}

      {showHelper && description && (
        <ChakraField.HelperText
          bg="orange.50"
          color="gray.900"
          p={4}
          fontSize="sm"
          borderRadius="md"
          mb={2}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

      <HStack
        p={3}
        borderRadius="md"
        borderWidth="2px"
        borderColor="red.300"
        fontSize="sm"
        fontWeight="bold"
      >
        <Icon
          boxSize={5}
          fontWeight="bold"
          as={FaCheckCircle}
          color="red.500"
        />
        {options && options.length > 0 ? (
          <Box>
            {
              options.find((f: any) => String(f.value) === value?.toString())
                ?.label
            }
          </Box>
        ) : (
          <Box>{value}</Box>
        )}

        <Field
          type="hidden"
          className="form-control"
          value={value}
          name={name}
        ></Field>
      </HStack>
    </ChakraField.Root>
  );
};

export default CustomAnswer;
