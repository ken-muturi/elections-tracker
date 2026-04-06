"use client"

import { Box, Flex, HStack, VStack, Text, Avatar } from "@chakra-ui/react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { MdHowToVote } from "react-icons/md"
import { FiLogIn, FiLogOut, FiLayout } from "react-icons/fi"

export default function PublicTopNav() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"
  const role = session?.user?.role?.toLowerCase() || ""
  const isAdmin = ["admin", "super admin"].includes(role)

  return (
    <Box position="sticky" top={0} zIndex={20} w="full">
      <Flex
        w="full" mx="auto" h="56px" px={{ base: 4, md: 8 }}
        alignItems="center" justifyContent="space-between"
        bg="rgba(255,255,255,0.8)" backdropFilter="blur(20px) saturate(1.8)"
        borderBottomWidth="1px" borderBottomColor="rgba(0,0,0,0.06)"
        boxShadow="0 1px 3px rgba(0,0,0,0.04)"
      >
        {/* Left — Logo */}
        <Link href="/election-results">
          <HStack gap={3} cursor="pointer">
            <Flex
              w={9} h={9} borderRadius="xl"
              bg="linear-gradient(135deg, #0f172a, #1e293b)"
              align="center" justify="center"
              boxShadow="0 2px 8px rgba(15,23,42,0.25)"
            >
              <MdHowToVote fontSize="1rem" color="#C9D927" />
            </Flex>
            <VStack alignItems="flex-start" gap={0}>
              <Text fontWeight="800" fontSize="sm" color="#0f172a" lineHeight="1.2" letterSpacing="tight">
                Election Tracking System
              </Text>
              <Text fontSize="9px" color="#94a3b8" lineHeight="1" fontWeight="600" letterSpacing="widest" textTransform="uppercase">
                Public Results Portal
              </Text>
            </VStack>
          </HStack>
        </Link>
        {/* Right — Auth links */}
        <HStack gap={3} ml="auto">
          {/* Live badge */}
          <HStack
            gap={2} px={3.5} py={1.5} borderRadius="full"
            bg="#ecfdf5" borderWidth="1px" borderColor="#a7f3d0"
            display={{ base: "none", sm: "flex" }}
          >
            <Box
              w="7px" h="7px" borderRadius="full" bg="#10b981"
              boxShadow="0 0 6px rgba(16,185,129,0.5)"
              css={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            <Text fontSize="xs" color="#059669" fontWeight="700">Live</Text>
          </HStack>

          {isLoggedIn ? (
            <HStack gap={2}>
              {/* Logged-in user */}
              <HStack gap={2} display={{ base: "none", md: "flex" }}>
                <Avatar.Root bg="#0f172a" size="xs">
                  <Avatar.Fallback color="#C9D927" fontWeight="700" fontSize="2xs">
                    {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </Avatar.Fallback>
                </Avatar.Root>
                <Text fontSize="xs" fontWeight="600" color="gray.700">
                  {session?.user?.name ?? "User"}
                </Text>
              </HStack>

              {/* Dashboard link for admin, Enter Results for agents */}
              <Link href={isAdmin ? "/dashboard" : "/enter-results"}>
                <HStack
                  gap={1.5} px={3} py={1.5} borderRadius="lg"
                  borderWidth="1px" borderColor="gray.200" bg="white"
                  fontSize="xs" fontWeight="600" color="gray.600" cursor="pointer"
                  _hover={{ borderColor: "gray.300", bg: "gray.50" }}
                  transition="all 0.15s"
                >
                  <FiLayout fontSize="0.8rem" />
                  <Text display={{ base: "none", sm: "block" }}>
                    {isAdmin ? "Dashboard" : "Enter Results"}
                  </Text>
                </HStack>
              </Link>

              {/* Logout */}
              <Box
                as="button"
                onClick={() => signOut({ callbackUrl: "/election-results" })}
                display="flex" alignItems="center" gap={1.5}
                px={3} py={1.5} borderRadius="lg"
                bg="#0f172a" color="white"
                fontSize="xs" fontWeight="600" cursor="pointer"
                _hover={{ bg: "#1e293b" }}
                transition="all 0.15s"
              >
                <FiLogOut fontSize="0.8rem" />
                <Text display={{ base: "none", sm: "block" }}>Logout</Text>
              </Box>
            </HStack>
          ) : (
            <Link href="/login">
              <HStack
                gap={1.5} px={4} py={1.5} borderRadius="lg"
                bg="#0f172a" color="white"
                fontSize="xs" fontWeight="700" cursor="pointer"
                _hover={{ bg: "#1e293b" }}
                transition="all 0.15s"
              >
                <FiLogIn fontSize="0.8rem" />
                <Text>Login</Text>
              </HStack>
            </Link>
          )}
        </HStack>
      </Flex>
    </Box>
  )
}
