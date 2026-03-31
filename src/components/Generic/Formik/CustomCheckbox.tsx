import React, { FC, useEffect, useState } from 'react';
import { FieldHookConfig, useField } from 'formik';
import {
    Checkbox,
    Flex,
    Input,
    Field,
    VStack,
} from '@chakra-ui/react';

type IFormikFieldProps = {
    required?: boolean;
    hasOther?: boolean;
    label?: string;
    options: { value: string | number; label: string }[];
    handleChange?: (e: string[]) => void;
    colorScheme?: string;
};

const CustomCheckbox: FC<FieldHookConfig<string> & IFormikFieldProps> = ({
    label,
    hasOther = false,
    options,
    handleChange,
    ...props
}) => {
    const [field, meta, helpers] = useField<(string | number)[]>(props as FieldHookConfig<(string | number)[]>);

    const [otherValue, setOtherValue] = useState('');
    const [isOtherChecked, setIsOtherChecked] = useState(false);

    // Effect to detect and handle pre-existing "Other" values
    useEffect(() => {
        // Find values not in the original options
        const currentValues = Array.isArray(field.value) ? field.value : [field.value]
        const customValues = currentValues.filter(
            val => typeof val === 'string' &&
                !options.some((opt: { value: { toString: () => string; }; }) => opt.value.toString() === val.toString())
        );

        // If custom values exist, set other checkbox and value
        if (customValues.length > 0) {
            setIsOtherChecked(true);
            setOtherValue(customValues[0] as string);
        }
    }, [field.value, options]);

    const handleOptionChange = (values: string[]) => {
        // Remove 'other' from values if it exists
        const filteredValues: string[] = values.filter(val => val !== 'other' && options.some((opt: { value: string; }) => opt.value === val));

        // Check if 'other' is selected
        const otherSelected = values.includes('other');
        setIsOtherChecked(otherSelected);

        // If other input has a value and is checked, add it to values
        if (otherSelected && otherValue.trim()) {
            filteredValues.push(otherValue.trim());
        }

        // Update Formik field value
        helpers.setValue(filteredValues);
        if (handleChange) {
            handleChange(filteredValues)
        }
    };

    const handleOtherInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setOtherValue(value);

        // If 'other' is checked and input has a value, update selected options
        if (isOtherChecked) {
            // Remove previous other value and add new value
            const currentOptions = field.value.filter(
                opt => options.some((o: { value: string | number; }) => o.value === opt)
            );

            if (value.trim()) {
                currentOptions.push(value.trim());
            }
            helpers.setValue(currentOptions);
        }
    };

    return (
        <Field.Root invalid={meta.touched && Boolean(meta.error)}>
            {label && (
                <Field.Label
                    id={`${label}-${field.name.replace(
                        /[^a-z0-9]/gi,
                        ''
                    )}-label`}
                >
                    {label}
                </Field.Label>
            )}
            
            <VStack align="start" gap={2}>
                {options.map((option: { value: string | number; label: string }) => {
                    const isChecked = Array.isArray(field.value) 
                        ? field.value.includes(option.value.toString())
                        : field.value === option.value.toString();
                    
                    return (
                        <Checkbox.Root
                            key={option.value}
                            checked={isChecked}
                            onCheckedChange={(details) => {
                                const currentValues = Array.isArray(field.value) ? field.value : [field.value];
                                const stringValue = option.value.toString();
                                
                                let newValues;
                                if (details.checked) {
                                    newValues = [...currentValues.filter(v => v !== stringValue), stringValue];
                                } else {
                                    newValues = currentValues.filter(v => v !== stringValue);
                                }
                                
                                handleOptionChange(newValues.map(v => v.toString()));
                            }}
                        >
                            <Checkbox.Control />
                            <Checkbox.Label>{option.label}</Checkbox.Label>
                        </Checkbox.Root>
                    );
                })}

                {hasOther && (
                    <Flex align="center" width="full" gap={2}>
                        <Checkbox.Root
                            checked={isOtherChecked}
                            onCheckedChange={(details) => {
                                const currentValues = Array.isArray(field.value) ? field.value : [field.value];
                                const filteredValues = currentValues.filter(val => 
                                    val !== 'other' && options.some((opt: { value: string; }) => opt.value === val)
                                );
                                
                                setIsOtherChecked(details.checked === true);
                                
                                if (details.checked && otherValue.trim()) {
                                    filteredValues.push(otherValue.trim());
                                }
                                
                                helpers.setValue(filteredValues);
                                if (handleChange) {
                                    handleChange(filteredValues);
                                }
                            }}
                        >
                            <Checkbox.Control />
                            <Checkbox.Label>Other</Checkbox.Label>
                        </Checkbox.Root>
                        {isOtherChecked && (
                            <Input
                                width="auto"
                                flex={1}
                                size="sm"
                                placeholder="Specify other"
                                value={otherValue}
                                onChange={handleOtherInputChange}
                            />
                        )}
                    </Flex>
                )}
            </VStack>
            
            {meta.error && meta.touched && (
                <Field.ErrorText id={`${label}-${field.name}-message`}>
                    {meta.error}
                </Field.ErrorText>
            )}
        </Field.Root>
    );
};

export default CustomCheckbox;
