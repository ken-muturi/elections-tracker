/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC } from 'react';
import { FieldHookConfig, useField } from 'formik';
import {
  Input,
  Field,
  Image,
  type BoxProps,
} from '@chakra-ui/react';
import { omit } from 'lodash';

type IFormikFieldProps = {
  label?: string;
  name?: string;
  setFieldValue: (field: string, values: any) => void;
} & BoxProps;

const ChakraInput: FC<FieldHookConfig<string> & IFormikFieldProps> = ({
  label,
  setFieldValue,
  ...props
}) => {
  const [field, meta] = useField(props);
  const showThumbNail = () => {
    return <Image src={field.value} alt={field.name} boxSize="50px" />;
  };

  const customInput = () => {
    return (
      <Field.Root invalid={meta.touched && !!meta.error}>
        {label && (
          <Field.Label
            htmlFor={`${field.name}`}
            id={`${label}-${field.name.replace(/[^a-z0-9]/gi, '')}-label`}
          >
            {label}
          </Field.Label>
        )}
        <Input
          accept="image/*"
          type="file"
          id={`${label}-${field.name.replace(/[^a-z0-9]/gi, '')}-input`}
          size="sm"
          placeholder={label}
          {...omit(field, ['value'])}
          onChange={event => {
            setFieldValue(field.name, event.currentTarget.files);
          }}
        />
        {meta.error && meta.touched && (
          <Field.ErrorText
            id={`${label}-${field.name.replace(/[^a-z0-9]/gi, '')}-message`}
          >
            {meta.error}
          </Field.ErrorText>
        )}
      </Field.Root>
    );
  }

  if (field.value && !meta.error && showThumbNail()) {
    return (<>
      {customInput()}
      {showThumbNail()}
    </>)
  }

  return customInput()
};

export default ChakraInput;
