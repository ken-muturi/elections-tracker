import { Box } from "@chakra-ui/react"
import { getUsers } from "@/services/Users"
import { getRoles } from "@/services/Roles"
import Details from "@/components/Users/Details"
import { UserWithRelations } from "@/components/Users/type"

import { Role } from "@prisma/client"

export default async function UsersPage() {
  let users: UserWithRelations[] = []
  let roles: Role[] = []

  try {
    ;[users, roles] = await Promise.all([
      getUsers() as unknown as Promise<UserWithRelations[]>,
      getRoles() as Promise<Role[]>,
    ])
  } catch (error) {
    return (
      <Box p={6} color="red.500">
        Failed to load users: {error instanceof Error ? error.message : "Unknown error"}
      </Box>
    )
  }

  return <Details users={users} roles={roles} />
}
