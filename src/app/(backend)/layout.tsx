import React from 'react';
import { Box } from "@chakra-ui/react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Navigation from "@/components/Menus/Navigation";
import { AuthProvider } from "@/context/AuthContext";
import ContentWrapper from "@/components/Generic/ContentWrapper";
import { AuthOptions } from "@/app/auth";

const ProtectedLayout = async ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const session = await getServerSession(AuthOptions);
  if (
    !session ||
    !["admin", "super admin"].includes(
      session.user?.role?.toLowerCase() || "ngo"
    )
  ) {
    redirect("/");
  }

  return (
    <AuthProvider session={session}>
      <Box minH="100vh" bg="gray.200">
        <Navigation />
        <Box
          p={3}
          ml={{ base: 2, md: 60 }}
          as="main"
          overflowX="auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#aab7cf transparent",
          }}
          h="fit-content"
        >
          <ContentWrapper bg="whiteAlpha.800">{children}</ContentWrapper>
        </Box>
      </Box>
    </AuthProvider>
  );
};

export default ProtectedLayout;