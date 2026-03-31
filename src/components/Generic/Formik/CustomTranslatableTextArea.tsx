import React, { type FC } from 'react';
import { type FieldHookConfig, useField, useFormikContext } from 'formik';
import {
  Field,
  Textarea,
  type BoxProps,
} from '@chakra-ui/react';
import { useUX } from '@/context/UXContext';
import { TranslationText } from '@/types';
import { useMultilingualForm } from '@/hooks/useMultilingualForm';

type TranslatableTextAreaProps = {
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: string;
  placeholder?: string;
  rows?: number;
  fieldName: string; // The field name for translation (e.g., "description")
} & BoxProps;

const CustomTranslatableTextArea: FC<FieldHookConfig<TranslationText[]> & TranslatableTextAreaProps> = ({
  label,
  hint,
  placeholder,
  disabled = false,
  required = false,
  rows = 5,
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
      <Textarea
        disabled={disabled}
        id={`${label ?? ""}-${field.name.replace(/[^a-z0-9]/gi, "")}-textarea`}
        size={size}
        placeholder={placeholder || `Enter ${label?.toLowerCase()} in ${currentLanguage}`}
        value={currentValue}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
          handleInputChange(e.target.value)
        }
        rows={rows}
        borderRadius="xl"
        borderWidth="2px"
        resize="none"
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

export default CustomTranslatableTextArea;