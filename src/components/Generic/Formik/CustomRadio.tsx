
import React, { FC, useState } from "react";
import { FieldHookConfig, useField } from "formik";
import {
  Field,
  VStack,
  HStack,
  RadioGroup,
  Button,
} from "@chakra-ui/react";
import { FaInfoCircle } from "react-icons/fa";

type IFormikFieldProps = {
  label?: string;
  value?: string;
  stack?: string;
  description?: string;
  note?: string;
  required?: boolean;
  options: { value: string | number; label: string }[];
  handleChange?: (value: string) => void;
};

const CustomRadio: FC<FieldHookConfig<string> & IFormikFieldProps> = ({
  label,
  options,
  stack = "row",
  required = false,
  handleChange,
  description,
  ...props
}) => {
  const [field, meta] = useField(props);
  const [showHelper, setShowHelper] = useState(false);

  return (
    <Field.Root required={required} invalid={meta.touched && !!meta.error}>
      {label && (
        <Field.Label
          htmlFor={`${field.name}`}
          id={`${label}-${field.name.replace(/[^a-z0-9]/gi, "")}-label`}
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
        </Field.Label>
      )}

      {showHelper && description && (
        <Field.HelperText
          bg="orange.50"
          color="gray.900"
          p={4}
          fontSize="xs"
          borderRadius="md"
          w="90%"
          mb={2}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

      <RadioGroup.Root
        value={field.value?.toString()?.toLowerCase()}
        onValueChange={(details) => {
          const newValue = details.value;
          field.onChange({ target: { name: field.name, value: newValue } });
          if (handleChange) {
            handleChange(newValue);
          }
        }}
      >
        {stack === "row" ? (
          <HStack gap={3}>
            {options.map((option: { value: string | number; label: string }, index: number) => (
              <RadioGroup.Item
                key={index}
                value={option.value.toString().toLowerCase()}
              >
                <RadioGroup.ItemControl />
                <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </HStack>
        ) : (
          <VStack align="start" gap={2}>
            {options.map((option: { value: string | number; label: string }, index: number) => (
              <RadioGroup.Item
                key={index}
                value={option.value.toString().toLowerCase()}
              >
                <RadioGroup.ItemControl />
                <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </VStack>
        )}
      </RadioGroup.Root>
      
      {meta.error && meta.touched && (
        <Field.ErrorText id={`${label}-${field.name}-message`}>
          {meta.error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
};

export default CustomRadio;
