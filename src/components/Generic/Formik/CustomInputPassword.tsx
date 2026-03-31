
import React, { FC, useState } from 'react';
import { FieldHookConfig, useField } from 'formik';
import {
  Input,
  Field,
  InputGroup,
  Button,
  type BoxProps,
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

type IFormikFieldProps = {
  label?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  hideText?: boolean;
} & BoxProps;

const ChakraInputPassword: FC<FieldHookConfig<string> & IFormikFieldProps> = ({
  label,
  placeholder,
  disabled = false,
  required = false,
  hideText = false,
  size = "sm",
  ...props
}) => {
  const [passwordField, setPasswordField] = useState<boolean>(true);
  const [field, meta] = useField({ ...props, value: props.value ?? "" });

  return (
    <Field.Root required={required} invalid={meta.touched && !!meta.error}>
      {label && (
        <Field.Label
          htmlFor={`${field.name}`}
          id={`${label}-${field.name.replace(/[^a-z0-9]/gi, "")}-label`}
        >
          {label}
        </Field.Label>
      )}
      <InputGroup
        width="full"
        endElement={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPasswordField(!passwordField)}
            color={passwordField ? "gray.400" : "gray.600"}
          >
            {passwordField ? <FaEye /> : <FaEyeSlash />}
          </Button>
        }
      >
        <Input
          disabled={disabled}
          type={passwordField ? "password" : "text"}
          id={`${label}-${field.name.replace(/[^a-z0-9]/gi, "")}-input`}
          size={size}
          borderRadius="xl"
          borderWidth="2px"
          placeholder={placeholder}
          {...field}
        />
      </InputGroup>

      {meta.error && meta.touched && (
        <Field.ErrorText
          id={`${label}-${field.name.replace(/[^a-z0-9]/gi, "")}-message`}
        >
          {meta.error}
        </Field.ErrorText>
      )}

      {meta.error && meta.touched && hideText && (
        <Field.HelperText>
          Minimum of 6 characters, and have 1 Special Character, 1 Uppercase, 1
          Number and 1 Lowercase
        </Field.HelperText>
      )}
    </Field.Root>
  );
};

export default ChakraInputPassword;
