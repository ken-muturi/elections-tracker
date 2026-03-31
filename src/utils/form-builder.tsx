/* eslint-disable @typescript-eslint/no-explicit-any */
import CustomInput from "@/components/Generic/Formik/CustomInput";
import CustomDatePicker from "@/components/Generic/Formik/CustomDatePicker";
import { Button, VStack } from "@chakra-ui/react";
import { Formik, Form } from "formik";

import * as Yup from "yup";
import CustomTextarea from "@/components/Generic/Formik/CustomTextarea";
import CustomRadio from "@/components/Generic/Formik/CustomRadio";
import CustomCheckbox from "@/components/Generic/Formik/CustomCheckbox";
import CustomSelect from "@/components/Generic/Formik/CustomSelect";
import CustomReactSelect from "@/components/Generic/Formik/CustomReactSelect";
import CustomInputPassword from "@/components/Generic/Formik/CustomInputPassword";
import React from "react";
import CustomAnswer from "@/components/Generic/Formik/CustomAnswer";
import { PartialTranslation, TranslationText } from "@/types";

export type FieldConfig = {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  note?: string;
  answer?: string | boolean | number;
  description?: string;
  options?: PrismaJson.Option[];
  conditions?: PrismaJson.Condition[];
  dynamicOptions?: PrismaJson.DynamicOptionsConfig;
};

export const generateValidationSchema = (fields: FieldConfig[]) => {
  const shape: Record<string, any> = {};

  fields.forEach((field) => {
    // Base validator based on field type
    let validator: Yup.Schema = Yup.mixed();

    // Set appropriate validator based on type
    switch (field.type) {
      case "email":
        validator = Yup.string().email("Invalid email format");
        break;
      case "number":
        validator = Yup.number().typeError("Must be a number");
        break;
      case "checkbox":
        validator = Yup.boolean();
        break;
      case "multi-select":
        validator = Yup.array();
        break;
      default:
        validator = Yup.string();
    }

    // Handle conditional validation
    if (field.conditions && field.conditions.length > 0) {
      // Create a condition that checks if this field should be required
      validator = validator.when(
        // Get all questionIds that this field depends on
        field.conditions.map((condition) => condition.questionId),
        // Create a function that evaluates if the field is required based on values
        (...dependencies: any[]) => {
          // The last param is options object, so remove it to get just the values
          const values = dependencies.slice(0, dependencies.length - 1);
          // const options = dependencies[dependencies.length - 1];

          // Create a values object with question IDs as keys
          const valuesObj: Record<string, any> = {};
          field.conditions?.forEach((condition, idx) => {
            valuesObj[condition.questionId] = values[idx];
          });

          // Check if all conditions are met
          const conditionsMet = field.conditions?.every((condition) =>
            evaluateCondition(condition, valuesObj)
          );

          // If conditions are met and field is required, then require it
          if (conditionsMet && field.required) {
            let schema = validator;
            schema = schema.required("This field is required");
            return schema;
          }

          // If conditions aren't met, make the field optional
          return validator.notRequired();
        }
      );
    } else if (field.required) {
      // Simple required validation if no conditions
      validator = validator.required("This field is required");
    }

    shape[field.name] = validator;
  });

  return Yup.object().shape(shape);
};

// Function to evaluate if a condition is met
const evaluateCondition = (
  condition: PrismaJson.Condition,
  values: Record<string, any>
): boolean => {
  const { questionId, operator, value } = condition;
  const answer = values[questionId];

  if (answer === undefined) return false;

  switch (operator) {
    case "equals":
      return answer === value;
    case "notEquals":
      return answer !== value;
    case "contains":
      return Array.isArray(answer)
        ? answer.includes(value)
        : String(answer).includes(String(value));
    case "notContains":
      return Array.isArray(answer)
        ? !answer.includes(value)
        : !String(answer).includes(String(value));
    case "greaterThan":
      return Number(answer) > Number(value);
    case "lessThan":
      return Number(answer) < Number(value);
    default:
      return false;
  }
};

const getOptionsForField = (
  values: any,
  field: FieldConfig,
  translate: (
    text:
      | TranslationText
      | PartialTranslation
      | PartialTranslation[]
      | undefined
  ) => string
) => {
  if (field.dynamicOptions) {
    const { sourceQuestionId, mapping } = field.dynamicOptions;
    const sourceValue = values[sourceQuestionId];

    if (sourceValue && mapping[sourceValue]) {
      return mapping[sourceValue];
    }
    return [];
  }

  if (!field.options || field.options.length === 0) return [];
  return field.options.map((option) => {
    return {
      ...option,
      label: translate(option.label),
    };
  });
};

export const DynamicForm = ({
  fields,
  onSubmit,
  buttonText = "Submit",
  translate,
  isReadOnly = false,
}: {
  isReadOnly?: boolean;
  buttonText?: string;
  onSubmit: (values: any) => void;
  fields: FieldConfig[];
  translate: (
    text:
      | TranslationText
      | PartialTranslation
      | PartialTranslation[]
      | undefined
  ) => string;
}) => {
  const initialValues = fields.reduce((acc, field) => {
    acc[field.name] = field.answer;
    return acc;
  }, {} as Record<string, any>);

  const validationSchema = generateValidationSchema(fields);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {(formProps) => {
        // Determine which fields should be visible based on conditions
        const visibleFields = fields.filter((field) => {
          if (!field.conditions || field.conditions.length === 0) {
            return true;
          }
          return field.conditions.every((condition) =>
            evaluateCondition(condition, formProps.values)
          );
        });
        // console.log("Visible Fields:", visibleFields);
        // console.log("Fields:", fields);
        return (
          <Form>
            <VStack alignItems="left" gap={6}>
              {visibleFields.map((field) => (
                <React.Fragment key={field.name}>
                  {field.answer !== "" ? (
                    <CustomAnswer
                      name={field.name}
                      label={field.label}
                      value={field.answer}
                      description={field.description}
                      note={field.note}
                      options={getOptionsForField(
                        formProps.values,
                        field,
                        translate
                      )}
                    />
                  ) : (
                    <>
                      {["text", "email", "numeric"].includes(field.type) && (
                        <CustomInput
                          key={field.name}
                          disabled={isReadOnly}
                          name={field.name}
                          description={field.description}
                          note={field.note}
                          label={field.label}
                          type={field.type}
                          required={field.required}
                        />
                      )}

                      {["password"].includes(field.type) && (
                        <CustomInputPassword
                          key={field.name}
                          name={field.name}
                          description={field.description}
                          note={field.note}
                          label={field.label}
                          type={field.type}
                          required={field.required}
                          disabled={isReadOnly}
                        />
                      )}

                      {field.type === "date" && (
                        <CustomDatePicker
                          key={field.name}
                          name={field.name}
                          description={field.description}
                          note={field.note}
                          label={field.label}
                          required={field.required}
                          handleChange={formProps.setFieldValue}
                          disabled={isReadOnly}
                        />
                      )}

                      {field.type === "textarea" && (
                        <CustomTextarea
                          key={field.name}
                          description={field.description}
                          note={field.note}
                          name={field.name}
                          label={field.label}
                          required={field.required}
                          disabled={isReadOnly}
                        />
                      )}

                      {field.type === "radio" && (
                        <CustomRadio
                          key={field.name}
                          name={field.name}
                          description={field.description}
                          note={field.note}
                          label={field.label}
                          required={field.required}
                          stack="column"
                          isReadOnly={isReadOnly}
                          options={getOptionsForField(
                            formProps.values,
                            field,
                            translate
                          )}
                        />
                      )}

                      {field.type === "checkbox" && (
                        <CustomCheckbox
                          key={field.name}
                          name={field.name}
                          description={field.description}
                          note={field.note}
                          label={field.label}
                          required={field.required}
                          disabled={isReadOnly}
                          options={getOptionsForField(
                            formProps.values,
                            field,
                            translate
                          )}
                        />
                      )}

                      {field.type === "select" && (
                        <CustomSelect
                          key={field.name}
                          description={field.description}
                          note={field.note}
                          name={field.name}
                          label={field.label}
                          required={field.required}
                          disabled={isReadOnly}
                          options={getOptionsForField(
                            formProps.values,
                            field,
                            translate
                          )}
                        />
                      )}

                      {field.type === "multi-select" && (
                        <CustomReactSelect
                          key={field.name}
                          description={field.description}
                          note={field.note}
                          name={field.name}
                          label={field.label}
                          required={field.required}
                          disabled={isReadOnly}
                          options={getOptionsForField(
                            formProps.values,
                            field,
                            translate
                          )}
                        />
                      )}
                    </>
                  )}
                </React.Fragment>
              ))}

              <Button
                type="submit"
                bg="green.600"
                color="white"
                _hover={{
                  bg: "green.700",
                }}
              >
                {buttonText}
              </Button>
            </VStack>
          </Form>
        );
      }}
    </Formik>
  );
};