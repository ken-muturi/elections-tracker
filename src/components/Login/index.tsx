/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Form, Formik, FormikProps } from "formik";
import * as Yup from "yup";
import FullPageLoader from "../Generic/FullPageLoader";
import {
  Button,
  Flex,
  VStack,
  createToaster,
} from "@chakra-ui/react";
import { ProgressCircle } from "@chakra-ui/react";
import { useState } from "react";
import CustomInput from "../Generic/Formik/CustomInput";
import CustomInputPassword from "../Generic/Formik/CustomInputPassword";
import { getSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { dictionary } from "./dictionary";
import { useUX } from "@/context/UXContext";

const loginValidationSchema = Yup.object().shape({
  email: Yup.string().email("invalid Email").required("Email is required"),
  password: Yup.string().required("Password is required").min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type FormValues = {
  email: string;
  password: string;
};
type FormikFormProps = FormikProps<FormValues>;

export default function FormPage() {
  const { translate } = useUX();
  const [loading, setLoading] = useState(false);
  // const router = useRouter();
  const toaster = createToaster({
    placement: "top-end",
  });
  const searchParams = useSearchParams();
  let callbackUrl = searchParams.get("callbackUrl");

  const submitLogin = async (data: FormValues) => {
    setLoading(true);
    try {
      const response = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      // console.log({ response });
      if (response?.ok === false) {
        console.log("Login Failed: ++++");
        throw new Error(
          "Could not login. check your email and password and try again"
        );
      }

      const session = await getSession();
      callbackUrl = ["admin", "super admin"].includes(
        session?.user.role.toLowerCase() || "ngo"
      )
        ? `/dashboard`
        : `/questionnaires`;
      // router.push(callbackUrl);
      window.location.href = callbackUrl;

      toaster.success({
        title: translate(dictionary.loginSuccessful),
        description: translate(dictionary.loginSuccessfulDesc),
      });
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.log("Login Failed: ----", error);
      // const message = handleReturnError(error);
      // console.log({ message })
      toaster.error({
        title: translate(dictionary.loginFailed),
        description: error.message,
      });
    }
  };

  console.log({ loading });
  return (
    <Flex
      align="center"
      justify="center"
      minH="calc(100vh - 300px)"
      w="100%" // Takes full width of parent container
      flex="1"
    >
      <Formik
        validationSchema={loginValidationSchema}
        onSubmit={submitLogin}
        validateOnChange={false}
        validateOnBlur={false}
        initialValues={{
          email: "",
          password: "",
        }}
      >
        {(props: FormikFormProps) => {
          return (
            <Form>
              {loading && !props.isSubmitting && <FullPageLoader />}
              <VStack
                gap="4"
                alignItems="left"
                p={10}
                px={8}
                mb={2}
                bg="white"
                shadow="base"
                w={{ base: "90%", md: "400px" }}
                h={{ base: "90%", md: "300px" }}
                borderWidth="1px"
                alignSelf={{ base: "center", lg: "flex-start" }}
                borderColor="gray.200"
                borderRadius="sm"
              >
                <CustomInput
                  name="email"
                  type="email"
                  label={translate(dictionary.email)}
                />
                <CustomInputPassword
                  name="password"
                  type="password"
                  label={translate(dictionary.password)}
                />
                <Button
                  variant="solid"
                  bg="warchild.sand.default"
                  color="white"
                  _hover={{
                    bg: "warchild.red.800",
                    color: "warchild.sand.default",
                  }}
                  type="submit"
                  size="sm"
                  px={4}
                >
                  {props.isSubmitting || loading ? (
                    <ProgressCircle.Root size="sm" colorPalette="blue">
                      <ProgressCircle.Circle />
                    </ProgressCircle.Root>
                  ) : (
                    "Login"
                  )}
                </Button>
              </VStack>
            </Form>
          );
        }}
      </Formik>
    </Flex>
  );
}
