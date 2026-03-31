import {
  Box,
  HStack,
  Icon,
  IconButton,
  Tooltip,
  Select,
  createListCollection,
  Portal,
} from "@chakra-ui/react";
import React, { useEffect, useState, useMemo } from "react";
import { GrSearch } from "react-icons/gr";
import { HiXCircle } from "react-icons/hi2";
import { dictionary } from "./dictionary";
import { useUX } from "@/context/UXContext";

type Option = { value: string; label: string };

type DebouncedInputProps = {
  title: string;
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  value: Option[];
  onChange: (str: string[] | string) => void;
  debounce?: number;
  options: Option[];
  clearColumns: () => void;
  isMulti?: boolean;
};

const DebouncedSelect = ({
  title,
  value: initialValues,
  onChange,
  clearColumns,
  options,
  isMulti = true,
  ...props
}: DebouncedInputProps) => {
  const [values, setValues] = useState<string[]>(
    initialValues ? initialValues.map((v) => v.value) : []
  );
  const { translate } = useUX();
  const collection = useMemo(
    () =>
      createListCollection({
        items: options,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
      }),
    [options]
  );

  useEffect(() => {
    setValues(initialValues ? initialValues.map((v) => v.value) : []);
  }, [initialValues]);

  return (
    <HStack
      gap="2"
      h="32px"
      px="3"
      w="full"
      fontSize="sm"
      fontWeight="semibold"
      borderWidth="thin"
      borderColor="gray.200"
      color="gray.700"
      borderRadius="lg"
    >
      <Box>
        <Icon mt="1" as={GrSearch} size="md" />
      </Box>
      <Box>{title}:</Box>
      <Box flex={1}>
        <Select.Root
          size="xs"
          fontSize="sm"
          variant="subtle"
          multiple={isMulti}
          value={values}
          collection={collection}
          onValueChange={(details) => {
            setValues(details.value);
            onChange(details.value);
          }}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText
                placeholder={props.placeholder || "Select options"}
              />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {collection.items.map((option) => (
                  <Select.Item key={option.value} item={option}>
                    {option.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Box>
      <Box>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <IconButton
              variant="ghost"
              aria-label="clear"
              size="xs"
              color="gray.500"
              onClick={() => {
                setValues([]);
                onChange("");
              }}
              onDoubleClick={() => clearColumns()}
            >
              <HiXCircle />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>
              {translate(dictionary.clickToClear)}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </Box>
    </HStack>
  );
};

export default React.memo(DebouncedSelect);
