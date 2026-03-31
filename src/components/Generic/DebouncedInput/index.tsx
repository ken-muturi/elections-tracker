import { Input, InputProps } from '@chakra-ui/react';
import React, { useEffect } from 'react';
type DebouncedInputProps = {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<InputProps, 'onChange'>;

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  size = 'sm',
  ...props
}: DebouncedInputProps) => {
  const [value, setValue] = React.useState(initialValue);
  const [isError, setIsError] = React.useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, debounce, onChange]);

  // console.log('isError', isError);
  return (
    <Input
      {...props}
      size={size}
      data-invalid={isError}
      value={value}
      onChange={(e) => {
        if (props.min && Number(props.min) > Number(e.target.value)) {
          setIsError(true);
          console.log("here");
        } else {
          setIsError(false);
          setValue(e.target.value);
        }
      }}
      fontSize="lg"
      borderRadius="lg"
      borderWidth="2px"
    />
  );
};

export default React.memo(DebouncedInput);
