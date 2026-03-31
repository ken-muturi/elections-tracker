import React, { FC } from "react";
import "react-datepicker/dist/react-datepicker.css";
import ReactDatePicker, { registerLocale } from "react-datepicker";
import {
  es as spanish,
  ar as arabic,
  enGB as english,
  fr as french,
} from "date-fns/locale";
import { FormikErrors } from "formik";
import CustomInput from "./CustomInput";
import { Box } from "@chakra-ui/react";

// Register locales
registerLocale("en", english);
registerLocale("fr", french);
registerLocale("es", spanish);
registerLocale("ar", arabic);

export interface DatePickerProps {
  value: string;
  name: string;
  disabled?: boolean;
  dateFormat?: string;
  variant: string;
  handleChange?: (
    field: string,
    value: string | Date | null,
    shouldValidate?: boolean
  ) => Promise<void | string | FormikErrors<string>>;
}

export const DatePicker: FC<DatePickerProps> = ({
  name,
  value,
  handleChange,
  disabled = false,
  dateFormat = "yyyy-MM-dd",
  variant = "outline",
}) => {
  const locale = "en"; // Default to English, can be made configurable

  return (
    <Box w="full">
      <ReactDatePicker
        locale={locale}
        disabled={disabled}
        dateFormat={dateFormat}
        showPopperArrow={false}
        selected={value ? new Date(value) : null}
        onChange={(date) => {
          if (handleChange && date) {
            const dt = Array.isArray(date) ? date[0] : date;
            const formattedDate = new Intl.DateTimeFormat("sv-SE", {
              dateStyle: "short",
            }).format(dt);
            return handleChange(name, formattedDate);
          }
        }}
        customInput={<CustomInput variant={variant} />}
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        yearDropdownItemNumber={15}
        scrollableYearDropdown
      />
    </Box>
  );
};
