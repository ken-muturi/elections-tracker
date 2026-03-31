
import React, { type FC } from 'react';
import { type FieldHookConfig, useField } from 'formik';
import {
  Field,
  Textarea,
  type BoxProps,
} from '@chakra-ui/react';

type FormikFieldProps = {
  label?: string;
  required?: boolean;
  handleBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
} & BoxProps;

const CustomTextarea: FC<FieldHookConfig<string> & FormikFieldProps> = ({
  label,
  required = false,
  handleBlur,
  ...props
}) => {
  const [field, meta] = useField(props);
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
      <Textarea
        size="lg"
        borderRadius="xl"
        borderWidth="2px"
        {...field}
        {...(handleBlur ? { onBlurCapture: handleBlur } : {})}
      />
      {meta.error && meta.touched && (
        <Field.ErrorText id={`${label}-${field.name}-message`}>
          {meta.error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
};

export default CustomTextarea;
