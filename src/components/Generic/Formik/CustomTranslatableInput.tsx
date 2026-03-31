
import React, { type FC } from 'react';
import { type FieldHookConfig, useField, useFormikContext } from 'formik';
import {
  Field,
  Input,
  type BoxProps,
} from '@chakra-ui/react';
import { useUX } from '@/context/UXContext';
import { TranslationText } from '@/types';
import { useMultilingualForm } from '@/hooks/useMultilingualForm';

type TranslatableFormikFieldProps = {
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: string;
  placeholder?: string;
  fieldName: string; // The field name for translation (e.g., "title")
} & BoxProps;

const CustomTranslatableInput: FC<FieldHookConfig<TranslationText[]> & TranslatableFormikFieldProps> = ({
  label,
  hint,
  placeholder,
  disabled = false,
  required = false,
  size = "lg",
  fieldName,
  ...props
}) => {
  const [field, meta] = useField(props);
  const { values, setFieldValue } = useFormikContext<{ [key: string]: TranslationText[] }>();
  const { supportedLocales: languages } = useUX();
  
  const multilingualForm = useMultilingualForm<{ [K in string]: TranslationText[] }>(
    "en",
    languages,
    [fieldName]
  );

  const {
    currentLanguage,
    getCurrentText,
    updateTranslation,
  } = multilingualForm;

  const handleInputChange = (value: string) => {
    updateTranslation(
      fieldName,
      value,
      values,
      setFieldValue
    );
  };

  // Get the current translated value
  const currentValue = getCurrentText(fieldName, values);
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
        type="text"
        disabled={disabled}
        id={`${label ?? ""}-${field.name.replace(/[^a-z0-9]/gi, "")}-input`}
        size={size}
        placeholder={placeholder || `Enter ${label?.toLowerCase()} in ${currentLanguage}`}
        value={currentValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
          handleInputChange(e.target.value)
        }
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

export default CustomTranslatableInput;
