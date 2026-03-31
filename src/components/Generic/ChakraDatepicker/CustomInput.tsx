/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Input, Group, Icon, InputGroup } from "@chakra-ui/react";
import { LuCalendar } from "react-icons/lu";

interface CustomInputProps {
  variant?: string;
  [key: string]: any;
}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  (props, ref) => {
    return (
      <InputGroup
        w="full"
        startElement={<LuCalendar />}
        borderWidth="2px"
        borderRadius="xl"
      >
        <Input {...props} ref={ref} size="sm" border="none" />
      </InputGroup>
    );
  }
);

CustomInput.displayName = "CustomInput";

export default CustomInput;