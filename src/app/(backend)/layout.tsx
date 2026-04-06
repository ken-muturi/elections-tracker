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
      <Box minH="100vh" bg="#f1f5f9">
        <Navigation />
        <Box
          ml={{ base: 0, md: "var(--sidebar-w, 240px)" }}
          pt={0}
          minH="100vh"
          as="main"
          transition="margin-left 0.2s ease"
          css={{ "--sidebar-w": "240px" }}
        >
          <Box p={{ base: 4, md: 6 }} minH="calc(100vh - 56px)">
            <ContentWrapper>{children}</ContentWrapper>
          </Box>
        </Box>
      </Box>
    </AuthProvider>
  );
};

export default ProtectedLayout;
