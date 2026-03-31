/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { type FC } from 'react';
import { type FieldHookConfig, useField, FormikErrors } from 'formik';
import {
  Field,
  type BoxProps,
} from '@chakra-ui/react';
import { DatePicker } from '../ChakraDatepicker/formik';

type FormikFieldProps = {
  label?: string;
  type?: string;
  dateFormat?: string;
  required?: boolean;
  disabled?: boolean;
  handleChange?: (
    field: string,
    value: any,
    shouldValidate?: boolean
  ) => Promise<void | FormikErrors<any>>;
} & BoxProps;

const CustomDatePicker: FC<FieldHookConfig<string> & FormikFieldProps> = ({
  label,
  handleChange,
  required = false,
  dateFormat = 'yyyy-MM-dd',
  ...props
}) => {
  const [field, meta] = useField(props);
  return (
    <Field.Root required={required} invalid={Boolean(meta.error)}>
      {label && (
        <Field.Label>
          {label}
        </Field.Label>
      )}

      <DatePicker
        {...field}
        variant={props.variant || "outline"}
        value={field.value}
        name={field.name}
        dateFormat={dateFormat}
        handleChange={handleChange}
      />
      {meta.error && (
        <Field.ErrorText>
          {meta.error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
};

export default CustomDatePicker;
