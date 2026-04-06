'use client'

import React, { createContext, useContext, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { Session } from "next-auth"

interface AuthContextType {
  role: string
  user: { id: string; names: string }
}

const AuthContext = createContext<AuthContextType>({
  role: "",
  user: { id: "", names: "" },
})

export const AuthProvider: React.FC<{
  children: ReactNode
  session?: Session | null
}> = ({ children, session: serverSession }) => {
  const { data: clientSession } = useSession()
  const session = serverSession || clientSession

  return (
    <AuthContext.Provider
      value={{
        role: session?.user.role ?? "",
        user: {
          id: session?.user.id || "",
          names: session?.user.name || "",
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const usePermissions = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("usePermissions must be used within an AuthProvider")
  }
  return context
}

// Keep PermissionsWithRelation as empty type for any remaining imports
export type PermissionsWithRelation = Record<string, never>
