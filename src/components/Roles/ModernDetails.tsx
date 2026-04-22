"use client"

import { useState, useMemo } from "react"
import {
  Box, Heading, Text, VStack, HStack, SimpleGrid, Flex, Input, Button,
} from "@chakra-ui/react"
import { FiShield, FiSearch, FiEdit, FiPlus } from "react-icons/fi"
import { RoleDetail } from "./type"
import Modal from "@/components/Generic/Modal"
import Form from "./Form"
import { useQuery } from "@tanstack/react-query"
import { getRoles } from "@/services/Roles"
import DeleteRole from "./Details/DeleteRole"

export default function ModernRoleDetails() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      return await getRoles()
    },
  })

  // Filter roles
  const filteredRoles = useMemo(() => {
    return roles.filter((role: RoleDetail) => {
      const matchesSearch =
        searchQuery === "" ||
        role.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSearch
    })
  }, [roles, searchQuery])

  const roleIcons: Record<string, string> = {
    admin: "#ef4444",
    "super admin": "#7c3aed",
    agent: "#0ea5e9",
  }

  const roleBackgrounds: Record<string, string> = {
    admin: "#fee2e2",
    "super admin": "#ede9fe",
    agent: "#e0f2fe",
  }

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Header */}
      <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
        <VStack alignItems="flex-start" gap={0.5}>
          <Heading fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} color="gray.900" lineHeight="1.2">
            User Roles & Access
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Define user permissions and access levels
          </Text>
        </VStack>
        <Modal size="lg" vh="40vh" title="Create Role" mainContent={<Form />}>
          <Button colorPalette="purple" size="sm">
            <HStack gap={1.5}>
              <FiPlus fontSize="0.85rem" />
              <span>Create Role</span>
            </HStack>
          </Button>
        </Modal>
      </HStack>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 3 }} gap={4}>
        <Box
          bg="white"
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        >
          <Text
            fontSize="xs"
            color="gray.500"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={1}
          >
            Total Roles
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">
            {roles.length}
          </Text>
        </Box>
        <Box
          bg="white"
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        >
          <Text
            fontSize="xs"
            color="gray.500"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={1}
          >
            System Roles
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="#7c3aed" lineHeight="1.1">
            {roles.filter((r: RoleDetail) => ["admin", "super admin", "agent"].includes(r.title?.toLowerCase() || "")).length}
          </Text>
        </Box>
        <Box
          bg="white"
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.100"
          boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
        >
          <Text
            fontSize="xs"
            color="gray.500"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={1}
          >
            Custom Roles
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="#0ea5e9" lineHeight="1.1">
            {roles.filter((r: RoleDetail) => !["admin", "super admin", "agent"].includes(r.title?.toLowerCase() || "")).length}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Search */}
      <HStack
        gap={3}
        bg="white"
        p={4}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.100"
      >
        <HStack flex={1} pos="relative">
          <Box pos="absolute" left={3} pointerEvents="none">
            <FiSearch fontSize="0.9rem" color="#9ca3af" />
          </Box>
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            pl={9}
            borderColor="gray.200"
            _focus={{ borderColor: "#7c3aed", boxShadow: "0 0 0 1px #7c3aed" }}
          />
        </HStack>
      </HStack>

      {/* Roles Grid */}
      {filteredRoles.length === 0 ? (
        <Box
          bg="white"
          borderRadius="xl"
          p={12}
          textAlign="center"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor="gray.200"
        >
          <Flex w={16} h={16} borderRadius="2xl" bg="#ede9fe" align="center" justify="center" mx="auto" mb={4}>
            <FiShield fontSize="2rem" color="#7c3aed" />
          </Flex>
          <Text fontWeight="700" fontSize="lg" color="gray.700" mb={1}>
            No roles found
          </Text>
          <Text fontSize="sm" color="gray.400">
            {searchQuery ? "Try adjusting your search" : "Create your first role to get started"}
          </Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {filteredRoles.map((role: RoleDetail) => {
            const roleLower = role.title?.toLowerCase() || ""
            const iconColor = roleIcons[roleLower] || "#6b7280"
            const bgColor = roleBackgrounds[roleLower] || "#f3f4f6"

            return (
              <Box
                key={role.id}
                bg="white"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="gray.100"
                overflow="hidden"
                boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
                _hover={{ boxShadow: "0 4px 12px 0 rgba(0,0,0,0.1)", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                {/* Header */}
                <HStack px={5} py={4} bg="#f8fafc" borderBottomWidth="1px" borderBottomColor="gray.100" gap={3}>
                  <Flex w={12} h={12} borderRadius="xl" bg={bgColor} align="center" justify="center" flexShrink={0}>
                    <FiShield fontSize="1.3rem" color={iconColor} />
                  </Flex>
                  <VStack gap={0} alignItems="flex-start" flex={1}>
                    <Text fontWeight="700" fontSize="md" color="gray.900">
                      {role.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Role
                    </Text>
                  </VStack>
                </HStack>

                {/* Description */}
                <Box px={5} py={4}>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.6" minH="60px">
                    {role.description || "No description provided"}
                  </Text>
                </Box>

                {/* Actions */}
                <HStack px={5} py={3} bg="#fafbfc" borderTopWidth="1px" borderTopColor="gray.100" justify="flex-end">
                  <HStack gap={2}>
                    <Modal
                      title="Edit Role"
                      size="lg"
                      vh="40vh"
                      mainContent={<Form role={role} />}
                    >
                      <Box
                        as="button"
                        p={2}
                        borderRadius="lg"
                        cursor="pointer"
                        _hover={{ bg: "#ede9fe" }}
                        transition="all 0.15s"
                      >
                        <FiEdit fontSize="0.9rem" color="#7c3aed" />
                      </Box>
                    </Modal>
                    <Box
                      as="button"
                      p={2}
                      borderRadius="lg"
                      cursor="pointer"
                      _hover={{ bg: "#fee" }}
                      transition="all 0.15s"
                    >
                      <DeleteRole id={role.id} />
                    </Box>
                  </HStack>
                </HStack>
              </Box>
            )
          })}
        </SimpleGrid>
      )}

      {/* Results count */}
      <Text fontSize="sm" color="gray.500" textAlign="center">
        Showing {filteredRoles.length} of {roles.length} role{roles.length !== 1 ? "s" : ""}
      </Text>
    </VStack>
  )
}
