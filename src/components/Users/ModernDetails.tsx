"use client"

import { useState, useMemo } from "react"
import {
  Box, Heading, Text, VStack, HStack, SimpleGrid, Flex, Badge, Input, Button,
} from "@chakra-ui/react"
import { FiUsers, FiSearch, FiMail, FiPhone, FiShield, FiEdit, FiUserPlus } from "react-icons/fi"
import { UserWithRelations } from "./type"
import { Role } from "@prisma/client"
import Modal from "@/components/Generic/Modal"
import Form from "./Form"
import { useQuery } from "@tanstack/react-query"
import { getUsers } from "@/services/Users"
import DeleteUser from "./Details/DeleteUser"

type Props = {
  users: UserWithRelations[]
  roles: Role[]
}

export default function ModernUserDetails({ users: initialUsers, roles }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")

  const { data: users = initialUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      return (await getUsers()) as unknown as UserWithRelations[]
    },
    placeholderData: initialUsers,
  })

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.othernames?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = selectedRole === "all" || user.roleId === selectedRole

      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, selectedRole])

  // Calculate stats
  const stats = useMemo(() => {
    const total = users.length
    const roleBreakdown = users.reduce((acc, user) => {
      const roleTitle = user.role?.title || "No Role"
      acc[roleTitle] = (acc[roleTitle] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return { total, roleBreakdown }
  }, [users])

  return (
    <VStack gap={6} alignItems="stretch" w="full">
      {/* Header */}
      <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
        <VStack alignItems="flex-start" gap={0.5}>
          <Heading fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} color="gray.900" lineHeight="1.2">
            Users Management
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Manage system users and their access levels
          </Text>
        </VStack>
        <Modal title="Add User" size="lg" vh="90vh" mainContent={<Form roles={roles} />}>
          <Button colorPalette="blue" size="sm">
            <HStack gap={1.5}>
              <FiUserPlus fontSize="0.85rem" />
              <span>Add User</span>
            </HStack>
          </Button>
        </Modal>
      </HStack>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
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
            Total Users
          </Text>
          <Text fontSize="3xl" fontWeight="800" color="gray.900" lineHeight="1.1">
            {stats.total}
          </Text>
        </Box>
        {Object.entries(stats.roleBreakdown).slice(0, 3).map(([role, count]) => (
          <Box
            key={role}
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
              {role}
            </Text>
            <Text fontSize="3xl" fontWeight="800" color="#0ea5e9" lineHeight="1.1">
              {count as number}
            </Text>
          </Box>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <HStack
        gap={3}
        bg="white"
        p={4}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.100"
        flexWrap="wrap"
      >
        <HStack flex={1} minW="250px" pos="relative">
          <Box pos="absolute" left={3} pointerEvents="none">
            <FiSearch fontSize="0.9rem" color="#9ca3af" />
          </Box>
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            pl={9}
            borderColor="gray.200"
            _focus={{ borderColor: "#0ea5e9", boxShadow: "0 0 0 1px #0ea5e9" }}
          />
        </HStack>
        <HStack gap={2} flexWrap="wrap">
          <Button
            size="sm"
            variant={selectedRole === "all" ? "solid" : "outline"}
            colorPalette={selectedRole === "all" ? "blue" : "gray"}
            onClick={() => setSelectedRole("all")}
          >
            All Roles
          </Button>
          {roles.map((role) => (
            <Button
              key={role.id}
              size="sm"
              variant={selectedRole === role.id ? "solid" : "outline"}
              colorPalette={selectedRole === role.id ? "blue" : "gray"}
              onClick={() => setSelectedRole(role.id)}
            >
              {role.title}
            </Button>
          ))}
        </HStack>
      </HStack>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Box
          bg="white"
          borderRadius="xl"
          p={12}
          textAlign="center"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor="gray.200"
        >
          <Flex w={16} h={16} borderRadius="2xl" bg="#e0e7ff" align="center" justify="center" mx="auto" mb={4}>
            <FiUsers fontSize="2rem" color="#4f46e5" />
          </Flex>
          <Text fontWeight="700" fontSize="lg" color="gray.700" mb={1}>
            No users found
          </Text>
          <Text fontSize="sm" color="gray.400">
            {searchQuery || selectedRole !== "all"
              ? "Try adjusting your filters"
              : "Add your first user to get started"}
          </Text>
        </Box>
      ) : (
        <Box bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100" overflow="hidden">
          <VStack gap={0} alignItems="stretch">
            {filteredUsers.map((user, index) => (
              <HStack
                key={user.id}
                px={5}
                py={4}
                gap={4}
                borderBottomWidth={index < filteredUsers.length - 1 ? "1px" : 0}
                borderBottomColor="gray.100"
                _hover={{ bg: "#f8fafc" }}
                transition="background 0.15s"
                flexWrap="wrap"
              >
                {/* Avatar */}
                <Flex
                  w={12}
                  h={12}
                  borderRadius="full"
                  bg="#e0e7ff"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  fontSize="md"
                  fontWeight="700"
                  color="#4f46e5"
                >
                  {user.firstname?.[0]}{user.othernames?.[0]}
                </Flex>

                {/* User Info */}
                <VStack gap={1} alignItems="flex-start" flex={1} minW="200px">
                  <Text fontSize="md" fontWeight="700" color="gray.900">
                    {user.firstname} {user.othernames}
                  </Text>
                  <HStack gap={3} flexWrap="wrap">
                    <HStack gap={1}>
                      <FiMail fontSize="0.75rem" color="#9ca3af" />
                      <Text fontSize="xs" color="gray.500">
                        {user.email}
                      </Text>
                    </HStack>
                    {user.phone && (
                      <HStack gap={1}>
                        <FiPhone fontSize="0.75rem" color="#9ca3af" />
                        <Text fontSize="xs" color="gray.500">
                          {user.phone}
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                </VStack>

                {/* Role Badge */}
                <HStack gap={2}>
                  {user.role && (
                    <Badge
                      px={3}
                      py={1.5}
                      borderRadius="full"
                      bg="#eff6ff"
                      color="#1e40af"
                      fontSize="xs"
                      fontWeight="700"
                    >
                      <HStack gap={1}>
                        <FiShield fontSize="0.7rem" />
                        <span>{user.role.title}</span>
                      </HStack>
                    </Badge>
                  )}
                </HStack>

                {/* Actions */}
                <HStack gap={2}>
                  <Modal
                    title="Edit User"
                    size="lg"
                    vh="90vh"
                    mainContent={<Form roles={roles} user={user} />}
                  >
                    <Box
                      as="button"
                      p={2}
                      borderRadius="lg"
                      cursor="pointer"
                      _hover={{ bg: "#e0e7ff" }}
                      transition="all 0.15s"
                    >
                      <FiEdit fontSize="0.9rem" color="#4f46e5" />
                    </Box>
                  </Modal>
                  <Box
                    as="button"
                    p={2}
                    borderRadius="lg"
                    cursor="pointer"
                    _hover={{ bg: "#fee" }}
                    transition="all 0.15s"
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this user?')) {
                        // Delete user logic handled by DeleteUser component internally
                      }
                    }}
                  >
                    <DeleteUser id={user.id} />
                  </Box>
                </HStack>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {/* Results count */}
      <Text fontSize="sm" color="gray.500" textAlign="center">
        Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? "s" : ""}
      </Text>
    </VStack>
  )
}
