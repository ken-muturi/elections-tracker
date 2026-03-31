/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useCallback, useMemo } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { es as spanish, ar as arabic, enGB as english, fr as french } from 'date-fns/locale'
import {
  IconButton,
  Box,
  BoxProps,
  HStack,
} from '@chakra-ui/react';
import {
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi';
import { ClassNames } from '@emotion/react';
import { range } from 'lodash';
import { useUX } from '@/context/UXContext';
import { ucwords } from '@/utils/util';
import { dictionary } from './dictionary';
import CustomInput from './CustomInput';

const monthsEn = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]
const monthsFr = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]
const monthsEs = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]
const monthsAr = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
]

const getYear = (date: Date) => date.getFullYear();
const getMonth = (date: Date) => date.getMonth();

const renderMonthContent = (monthIndex: number, shortMonthText: string, fullMonthText: string) => {
  console.log({ fullMonthText })
  return <span>{ucwords(shortMonthText)}</span>;
};

function useDatePickerStyles() {
  return useMemo(() => {
    return {};
  }, []);
}

export type DatePickerProps = {
  value: string;
  name: string;
  disabled?: boolean
  dateFormat?: string
  handleChange?: (value: string) => void
  size?: string
} & BoxProps

export const DatePicker: FC<DatePickerProps> = ({
  value,
  handleChange,
  disabled = false,
  dateFormat = "yyyy-MM-dd",
  size = "md",
  ...props
}) => {
  const { translate, locale } = useUX();
  registerLocale(
    "vi",
    locale == "fr"
      ? french
      : locale == "es"
      ? spanish
      : locale == "ar"
      ? arabic
      : english
  );
  const styles = useDatePickerStyles();
  const render = useCallback(
    ({ css }: { css: any }) => {
      if (dateFormat === "MMMM yyyy") {
        return (
          <ReactDatePicker
            locale="vi"
            disabled={disabled}
            dateFormat={dateFormat}
            showPopperArrow={false}
            wrapperClassName={css({
              width: "100%",
              display: "block",
            })}
            popperClassName={css({
              marginTop: "0px!important",
              marginLeft: "30px",
            })}
            calendarClassName={css(styles)}
            selected={value ? new Date(value) : null}
            onChange={(date) => {
              if (handleChange && date) {
                return Array.isArray(date)
                  ? handleChange(
                      new Intl.DateTimeFormat("sv-SE", {
                        dateStyle: "short",
                      }).format(date[0])
                    )
                  : handleChange(
                      new Intl.DateTimeFormat("sv-SE", {
                        dateStyle: "short",
                      }).format(date)
                    );
              }
            }}
            showMonthYearPicker
            customInput={<CustomInput size={size} />}
            renderMonthContent={renderMonthContent}
          />
        );
      }

      return (
        <Box w="full">
          <ReactDatePicker
            // dateFormat="dd MMMM, yyyy"
            // dateFormat="yyyy-MM-dd"
            locale="vi"
            disabled={disabled}
            dateFormat={dateFormat}
            showPopperArrow={false}
            wrapperClassName={css({
              width: "100%",
              display: "block",
            })}
            popperClassName={css({
              marginTop: "0px!important",
              marginLeft: "30px",
            })}
            calendarClassName={css(styles)}
            selected={value ? new Date(value) : null}
            onChange={(date) => {
              if (handleChange && date) {
                return handleChange(
                  new Intl.DateTimeFormat("sv-SE", {
                    dateStyle: "short",
                  }).format(date)
                );
              }
            }}
            customInput={<CustomInput {...props} />}
            renderCustomHeader={({
              date,
              changeYear,
              changeMonth,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            }) => {
              const years = range(1900, getYear(new Date()) + 5);
              const datei8n =
                locale === "en"
                  ? "en-GB"
                  : locale === "fr"
                  ? "fr-CA"
                  : locale === "es"
                  ? "es-ES"
                  : locale;
              const months =
                locale === "en"
                  ? monthsEn
                  : locale === "fr"
                  ? monthsFr
                  : locale === "es"
                  ? monthsEs
                  : monthsAr;
              const formattedDate = new Intl.DateTimeFormat(datei8n, {
                dateStyle: "full",
              }).format(date);
              return (
                <>
                  <Box
                    color="gray.700"
                    flex={1}
                    fontSize="sm"
                    fontWeight="medium"
                  >
                    {formattedDate}
                  </Box>
                  <HStack
                    pb={1}
                    w="full"
                    alignItems="center"
                    textAlign="left"
                    pl={4}
                    pr={2}
                  >
                    <IconButton
                      borderRadius="full"
                      size="sm"
                      variant="ghost"
                      aria-label={translate(dictionary.previousMonth)}
                      onClick={decreaseMonth}
                      disabled={prevMonthButtonDisabled}
                    >
                      <HiChevronLeft />
                    </IconButton>
                    <select
                      style={{ fontSize: "12px", padding: "2px" }}
                      value={getYear(date)}
                      onChange={({ target: { value } }) =>
                        changeYear(Number(value))
                      }
                    >
                      {years.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <select
                      style={{ fontSize: "12px", padding: "2px" }}
                      value={months[getMonth(date)]}
                      onChange={({ target: { value } }) =>
                        changeMonth(months.indexOf(value))
                      }
                    >
                      {months.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <IconButton
                      borderRadius="full"
                      size="sm"
                      variant="ghost"
                      aria-label={translate(dictionary.nextMonth)}
                      onClick={increaseMonth}
                      disabled={nextMonthButtonDisabled}
                    >
                      <HiChevronRight />
                    </IconButton>
                  </HStack>
                </>
              );
            }}
          />
        </Box>
      );
    },
    [
      styles,
      value,
      dateFormat,
      disabled,
      handleChange,
      locale,
      props,
      translate,
    ]
  );

  return <ClassNames>{render}</ClassNames>;
};