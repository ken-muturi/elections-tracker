
import React, { useEffect, useState, type FC } from 'react';
import { type FieldHookConfig, useField } from 'formik';
import {
  Text,
  Flex,
  Field,
  Input,
  Select,
  createListCollection,
  Portal,
  type BoxProps,
} from "@chakra-ui/react";
import { useUX } from "@/context/UXContext";
import { dictionary } from "./dictionary";

type FormikFieldProps = {
  label?: string;
  hasOther?: boolean;
  name?: string;
  required?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  options: { value: string | number; label: string }[];
  handleChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
} & BoxProps;

const CustomSelect: FC<FieldHookConfig<string> & FormikFieldProps> = ({
  label,
  handleChange,
  required = false,
  isDisabled = false,
  isReadOnly = false,
  hasOther = false,
  size = "md",
  options,
  ...props
}) => {
  const { translate } = useUX();
  const [field, meta, helpers] = useField(props);
  const [otherValue, setOtherValue] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  // Effect to detect and handle pre-existing "Other" values
  useEffect(() => {
    // Check if the current value is not in the original options
    const currentOptions = options || [];
    const isValueInOptions =
      field.value &&
      currentOptions.some(
        (opt: { value: string | number; label: string }) =>
          opt.value.toString() === field.value.toString()
      );

    if (field.value && typeof field.value === "string" && !isValueInOptions) {
      setIsOtherSelected(true);
      setOtherValue(field.value);
    } else if (field.value === "other") {
      setIsOtherSelected(true);
    } else {
      setIsOtherSelected(false);
    }
  }, [field.value, options]);

  const handleSelectChange = (details: { value: string[] }) => {
    const selectedValue = details.value[0] || "";

    helpers.setValue(selectedValue);
    setIsOtherSelected(selectedValue === "other");

    if (selectedValue !== "other") {
      setOtherValue("");
    }

    // Create a synthetic event for backward compatibility
    if (handleChange) {
      const syntheticEvent = {
        target: { value: selectedValue },
      } as React.ChangeEvent<HTMLSelectElement>;
      handleChange(syntheticEvent);
    }
  };

  const handleOtherInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherValue(value);
    if (isOtherSelected) {
      helpers.setValue(value.trim());
    }
  };

  const selectOptions = [
    ...(options || []),
    ...(hasOther ? [{ value: "other", label: "Other" }] : []),
  ];

  const selectItems = selectOptions.map((option) => ({
    label: option.label,
    value: option.value.toString(),
  }));

  const collection = createListCollection({ items: selectItems });

  return (
    <Field.Root
      invalid={meta.touched && Boolean(meta.error)}
      required={required}
      disabled={isDisabled}
      readOnly={isReadOnly}
    >
      {label && (
        <Field.Label
          htmlFor={`${field.name}`}
          id={`${label}-${field.name.replace(/[^a-z0-9]/gi, "")}-label`}
        >
          {label}
        </Field.Label>
      )}
      <Select.Root
        collection={collection}
        value={field.value ? [field.value] : []}
        onValueChange={handleSelectChange}
        disabled={isDisabled || isReadOnly}
        size={size}
        color="gray.400"
        positioning={{ strategy: "fixed", gutter: 4 }}
      >
        <Select.HiddenSelect />
        <Select.Control borderRadius="xl" borderWidth="2px">
          <Select.Trigger border="none">
            <Select.ValueText
              placeholder={translate(dictionary.selectOption)}
            />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner zIndex={9999}>
            <Select.Content
              py={2}
              px={3}
              w="full"
              zIndex={9999}
              position="relative"
            >
              {selectItems.map((item, index) => (
                <Select.Item key={index} item={item.value}>
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      {isOtherSelected && (
        <Flex align="center" width="full" my={2} fontSize="sm">
          <Text>{translate(dictionary.other)}</Text>
          <Input
            ml={2}
            size="sm"
            width="auto"
            flex={1}
            value={otherValue}
            onChange={handleOtherInputChange}
          />
        </Flex>
      )}
      {meta.error && meta.touched && (
        <Field.ErrorText
          id={`${label}-${field.name.replace(/[^a-z0-9]/gi, "")}-message`}
        >
          {meta.error}
        </Field.ErrorText>
      )}
    </Field.Root>
  );
};

export default CustomSelect;
