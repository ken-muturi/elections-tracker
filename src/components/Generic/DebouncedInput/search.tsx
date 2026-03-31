import { Icon, Input, Group, InputProps } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { GrSearch } from "react-icons/gr";
import { HiXCircle } from "react-icons/hi2";

type DebouncedInputProps = {
  title: string;
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
  closeButton?: boolean;
} & Omit<InputProps, "onChange">;

const DebouncedSearchInput = ({
  title,
  value: initialValue,
  onChange,
  size = "sm",
  debounce = 500,
  placeholder,
  closeButton = false,
  ...props
}: DebouncedInputProps) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  const [textWidth, setTextWidth] = useState(0);
  const [value, setValue] = useState(initialValue);

  const getTextWidthInPixels = (ref: HTMLSpanElement) =>
    ref.getBoundingClientRect().width;

  useEffect(() => {
    if (title && spanRef.current) {
      setTextWidth(getTextWidthInPixels(spanRef.current!));
    }
  }, [spanRef, title]);

  // useEffect(() => {
  //   setValue(initialValue);
  // }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, debounce, onChange]);

  return (
    <Group w="full" position="relative">
      <Icon
        position="absolute"
        left={4}
        zIndex={2}
        mr={2}
        as={GrSearch}
        size="sm"
        color="gray.700"
      />
      <span
        ref={spanRef}
        style={{
          position: "absolute",
          left: `${32}px`,
          zIndex: 2,
          pointerEvents: "none",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "12px",
        }}
      >
        {title}
      </span>
      <Input
        {...props}
        value={value}
        autoFocus={true}
        size={size}
        pl={`${textWidth + 50}px`}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Search ${title} ${placeholder}`}
        fontSize="sm"
        borderRadius="lg"
        borderWidth="2px"
      />
      {closeButton && (
        <Icon
          size="sm"
          color="gray.700"
          position="absolute"
          right={4}
          zIndex={2}
          cursor="pointer"
          onClick={() => setValue("")}
        >
          <HiXCircle />
        </Icon>
      )}
    </Group>
  );
};

export default React.memo(DebouncedSearchInput);
