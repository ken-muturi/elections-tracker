import { AuthOptions } from "@/app/auth"
import { getServerSession } from "next-auth"

export async function getCurrentUser() {
  const session = await getServerSession(AuthOptions)
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session.user
}