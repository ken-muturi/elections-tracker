"use server"

import { getCurrentUser } from "./UserSessison"

export async function requireAdmin() {
  const user = await getCurrentUser()
  const role = (user.role ?? "").toLowerCase()
  if (role !== "admin" && role !== "super admin")
    throw new Error("Only administrators can perform this action.")
  return user
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser()
  const role = (user.role ?? "").toLowerCase()
  if (role !== "super admin")
    throw new Error("Only super admins can perform this action.")
  return user
}
