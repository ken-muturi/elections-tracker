/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Form, Formik, FormikProps } from "formik";
import * as Yup from "yup";
import FullPageLoader from "../Generic/FullPageLoader";
import {
  Button,
  Flex,
  VStack,
  Box,
  Text,
  Heading,
  HStack,
  createToaster,
  Separator,
} from "@chakra-ui/react";
import { ProgressCircle } from "@chakra-ui/react";
import { useState } from "react";
import CustomInput from "../Generic/Formik/CustomInput";
import CustomInputPassword from "../Generic/Formik/CustomInputPassword";
import { getSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { dictionary } from "./dictionary";
import { useUX } from "@/context/UXContext";
import { MdHowToVote } from "react-icons/md";
import { FiShield, FiBarChart2, FiUsers } from "react-icons/fi";

const loginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required").min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type FormValues = {
  email: string;
  password: string;
};
type FormikFormProps = FormikProps<FormValues>;

const features = [
  {
    icon: FiShield,
    label: "Secure & Audited",
    desc: "End-to-end encrypted results",
  },
  {
    icon: FiBarChart2,
    label: "Real-time Analytics",
    desc: "Live election dashboards",
  },
  {
    icon: FiUsers,
    label: "Multi-role Access",
    desc: "Granular permission control",
  },
];

export default function FormPage() {
  const { translate } = useUX();
  const [loading, setLoading] = useState(false);
  const toaster = createToaster({ placement: "top-end" });
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

      if (response?.ok === false) {
        throw new Error(
          "Could not login. Check your email and password and try again.",
        );
      }

      const session = await getSession();
      callbackUrl = ["admin", "super admin"].includes(
        session?.user.role.toLowerCase() || "ngo",
      )
        ? `/dashboard`
        : `/questionnaires`;
      window.location.href = callbackUrl;

      toaster.success({
        title: translate(dictionary.loginSuccessful),
        description: translate(dictionary.loginSuccessfulDesc),
      });
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toaster.error({
        title: translate(dictionary.loginFailed),
        description: error.message,
      });
    }
  };

  return (
    <Flex w="full" minH="100vh">
      {loading && <FullPageLoader />}

      {/* ── Left panel – branding ── */}
      <Box
        display={{ base: "none", lg: "flex" }}
        flexDir="column"
        w="55%"
        position="relative"
        overflow="hidden"
        bg="#0f172a"
        px={16}
        py={12}
        justifyContent="space-between"
      >
        {/* Decorative gradient blobs */}
        <Box
          position="absolute"
          top="-120px"
          right="-120px"
          w="400px"
          h="400px"
          borderRadius="full"
          bg="rgba(201, 217, 39, 0.08)"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-80px"
          left="-80px"
          w="300px"
          h="300px"
          borderRadius="full"
          bg="rgba(254, 142, 0, 0.07)"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          top="40%"
          left="30%"
          w="200px"
          h="200px"
          borderRadius="full"
          bg="rgba(201, 217, 39, 0.04)"
          pointerEvents="none"
        />

        {/* Logo */}
        <HStack gap={4} position="relative" zIndex={1}>
          <Flex
            w={12}
            h={12}
            borderRadius="xl"
            bg="brand.lime"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Box as={MdHowToVote} fontSize="1.5rem" color="#0f172a" />
          </Flex>
          <VStack alignItems="flex-start" gap={0}>
            <Text
              fontWeight="800"
              fontSize="lg"
              color="white"
              letterSpacing="tight"
            >
              ETS
            </Text>
            <Text fontSize="xs" color="slate.400" style={{ color: "#64748b" }}>
              Elections Tracking Tool
            </Text>
          </VStack>
        </HStack>

        {/* Hero copy */}
        <VStack alignItems="flex-start" gap={6} position="relative" zIndex={1}>
          <Box>
            <Text
              fontSize="3xl"
              fontWeight="800"
              color="white"
              lineHeight="1.15"
              mb={4}
            >
              Transparent Elections,{" "}
              <Box as="span" color="brand.lime">
                Trusted Results
              </Box>
            </Text>
            <Text fontSize="md" color="#94a3b8" lineHeight="1.7" maxW="420px">
              Manage polling stations, collect field data, and publish verified
              election results — all from one secure platform.
            </Text>
          </Box>

          <VStack alignItems="flex-start" gap={4} w="full">
            {features.map((f) => (
              <HStack key={f.label} gap={4}>
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg="rgba(201, 217, 39, 0.12)"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Box as={f.icon} fontSize="1.1rem" color="brand.lime" />
                </Flex>
                <VStack alignItems="flex-start" gap={0}>
                  <Text fontWeight="600" fontSize="sm" color="white">
                    {f.label}
                  </Text>
                  <Text fontSize="xs" color="#64748b">
                    {f.desc}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        </VStack>

        {/* Footer tagline */}
        <Text fontSize="xs" color="#334155" position="relative" zIndex={1}>
          &copy; {new Date().getFullYear()} ETS — Secure Electoral Management
          Platform
        </Text>
      </Box>

      {/* ── Right panel – form ── */}
      <Flex
        flex={1}
        align="center"
        justify="center"
        bg="white"
        px={{ base: 6, md: 12, lg: 16 }}
        py={12}
        position="relative"
      >
        {/* Subtle top stripe */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="3px"
          bgGradient="to-r"
          gradientFrom="brand.lime"
          gradientTo="brand.orange"
        />

        <VStack w="full" maxW="420px" gap={8} alignItems="stretch">
          {/* Mobile logo */}
          <HStack gap={3} display={{ base: "flex", lg: "none" }} mb={2}>
            <Flex
              w={10}
              h={10}
              borderRadius="xl"
              bg="#0f172a"
              align="center"
              justify="center"
            >
              <Box as={MdHowToVote} fontSize="1.25rem" color="brand.lime" />
            </Flex>
            <Text fontWeight="800" fontSize="lg" color="gray.900">
              ETS
            </Text>
          </HStack>

          {/* Heading */}
          <VStack alignItems="flex-start" gap={1}>
            <Heading
              fontFamily="heading"
              fontWeight="800"
              fontSize="2xl"
              color="gray.900"
              lineHeight="1.2"
            >
              Welcome back
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Sign in to access your election dashboard
            </Text>
          </VStack>

          <Separator borderColor="gray.100" />

          {/* Form */}
          <Formik
            validationSchema={loginValidationSchema}
            onSubmit={submitLogin}
            validateOnChange={false}
            validateOnBlur={false}
            initialValues={{ email: "", password: "" }}
          >
            {(props: FormikFormProps) => (
              <Form style={{ width: "100%" }}>
                <VStack gap={5} alignItems="stretch">
                  <CustomInput
                    name="email"
                    type="email"
                    label={translate(dictionary.email)}
                    placeholder="you@example.com"
                  />
                  <CustomInputPassword
                    name="password"
                    type="password"
                    label={translate(dictionary.password)}
                    placeholder="••••••••"
                  />

                  <Button
                    type="submit"
                    size="lg"
                    w="full"
                    bg="#C9D927"
                    color="#0f172a"
                    fontWeight="700"
                    fontSize="sm"
                    borderRadius="xl"
                    _hover={{
                      bg: "#b5c222",
                      transform: "translateY(-1px)",
                      boxShadow: "0 0 20px rgba(201,217,39,0.35)",
                    }}
                    _active={{ transform: "translateY(0)", bg: "#a1ae1f" }}
                    transition="all 0.2s ease"
                    mt={1}
                    h="48px"
                  >
                    {props.isSubmitting || loading ? (
                      <ProgressCircle.Root size="sm" colorPalette="green">
                        <ProgressCircle.Circle />
                      </ProgressCircle.Root>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </VStack>
              </Form>
            )}
          </Formik>

          {/* Footer */}
          <Text fontSize="xs" color="gray.400" textAlign="center">
            Having trouble signing in? Contact your system administrator.
          </Text>
        </VStack>
      </Flex>
    </Flex>
  );
}
