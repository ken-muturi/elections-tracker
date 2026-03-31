/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldHookConfig, useField } from 'formik';
import {
  Field,
} from '@chakra-ui/react';
import { FC } from 'react';
import {
  Select as CharkaReactSelect,
  Options,
  ActionMeta,
  MultiValue,
} from 'chakra-react-select';
import { uniq } from 'lodash';

export interface Option {
  label: string;
  value: string;
}
type selectIsMulti = boolean;
interface IFormikFieldProps {
  label: string;
  setFieldValue: (field: string, values: MultiValue<Option>) => void;
  options: Options<Option>;
  value?: Options<Option>;
  isMulti?: selectIsMulti;
  closeMenuOnSelect?: boolean;
  required?: boolean;
  handleChange?: () => void;
}

const ReactSelect: FC<FieldHookConfig<string> & IFormikFieldProps> = ({
  label,
  isMulti,
  options,
  closeMenuOnSelect = true,
  required = false,
  setFieldValue,
  handleChange,

  ...props
}) => {
  const [field, meta] = useField(props);

  const getValue = () => {
    if (options) {
      let selectedValues: string[] = [];
      if ((!field.value || !field.value.length) && props.value) {
        selectedValues = Array.isArray(props.value)
          ? props.value.map((d: Option) => d.value)
          : [props.value];
      } else {
        selectedValues = Array.isArray(field.value)
          ? field.value.map((d: Option) => d.value)
          : [field.value];
      }

      return isMulti
        ? options.filter((option: Option) => {
          return selectedValues.includes(option.value);
        })
        : options.find((option: Option) => option.value === field.value);
    } else {
      return isMulti ? [] : ('' as any);
    }
  };

  const onChange = (
    options: MultiValue<Option>,
    actionMeta: ActionMeta<Option>
  ) => {
    if (actionMeta?.action === 'select-option' && actionMeta?.option?.value) {
      setFieldValue(field.name, uniq([...options, actionMeta?.option]));
    }

    if (
      actionMeta?.action === 'remove-value' &&
      actionMeta?.removedValue?.value
    ) {
      setFieldValue(field.name, [
        ...options.filter(d => d.value !== actionMeta.removedValue.value),
      ]);
    }
    if (handleChange) handleChange();
  };

  return (
    <Field.Root required={required} invalid={meta.touched && !!meta.error}>
      {label && (
        <Field.Label
          htmlFor={`${field.name}`}
          id={`${label}-${field.name.replace(/[^a-z0-9]/gi, '')}-label`}
        >
          {label}
        </Field.Label>
      )}
      <CharkaReactSelect
        menuPosition="fixed"
        isMulti
        size="sm"
        id={`${props.id}-input`}
        instanceId={`${props.id}-input`}
        closeMenuOnSelect={closeMenuOnSelect}
        selectedOptionStyle="check"
        {...field}
        options={options}
        value={getValue()}
        onChange={onChange}
      />
      {meta.error && meta.touched && (
        <Field.ErrorText id={`${label}-${field.name}-message`}>
          {meta.error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
};

export default ReactSelect;
