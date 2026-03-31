
import React, { type FC } from 'react';
import { type FieldHookConfig, useField } from 'formik';
import {
  Field,
  Input,
  type BoxProps,
} from '@chakra-ui/react';

type FormikFieldProps = {
  label?: string;
  type?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: string;
  placeholder?: string;
  value?: string;
  handleBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
} & BoxProps;

const CustomInput: FC<FieldHookConfig<string> & FormikFieldProps> = ({
  label,
  hint,
  placeholder,
  disabled = false,
  required = false,
  type = "text",
  handleBlur,
  size = "lg",
  ...props
}) => {
  const [field, meta] = useField({ ...props, value: props.value ?? "" });
  return (
    <Field.Root
      required={required}
      invalid={meta.touched && Boolean(meta.error)}
    >
      {label && (
        <Field.Label
          htmlFor={`${field.name}`}
          id={`${label}-${field.name.replace(/[^a-z0-9]/gi, "")}-label`}
        >
          {label}
        </Field.Label>
      )}
      <Input
        type={type}
        disabled={disabled}
        id={`${label ?? ""}-${field.name.replace(/[^a-z0-9]/gi, "")}-input`}
        size={size}
        {...(handleBlur ? { onBlurCapture: handleBlur } : {})}
        placeholder={placeholder}
        {...field}
        borderRadius="xl"
        borderWidth="2px"
      />
      {meta.error && meta.touched && (
        <Field.ErrorText
          id={`${label ?? ""}-${field.name.replace(/[^a-z0-9]/gi, "")}-message`}
        >
          {meta.error}
        </Field.ErrorText>
      )}
      {hint && <Field.HelperText>{hint}</Field.HelperText>}
    </Field.Root>
  );
};

export default CustomInput;
