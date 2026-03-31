'use client'

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { Prisma } from "@prisma/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPermissionByRole } from "@/services/Permissions";
import { useSession } from "next-auth/react";
// import { ucwords } from '@/utils/util';
import { groupBy } from "lodash";
import { Session } from "next-auth";

export type PermissionsWithRelation = Prisma.PermissionGetPayload<{
  select: {
    action: true;
    tab: { select: { title: true; id: true } };
    module: { select: { title: true; id: true } };
    role: { select: { title: true; id: true } };
  };
}>;

interface AuthContextType {
  permissions: Record<string, PermissionsWithRelation[]>;
  role: string;
  user: {
    id: string;
    names: string;
  };
  removePermissionsQuery: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  permissions: {},
  role: "",
  user: {
    id: "",
    names: "",
  },
  removePermissionsQuery: async () => {},
});

export const AuthProvider: React.FC<{
  children: ReactNode;
  session?: Session | null;
}> = ({ children, session: serverSession }) => {
  const { data: clientSession } = useSession();
  console.log({ clientSession });

  // Use server session if available, otherwise use client session
  const session = serverSession || clientSession;

  const role = session?.user.role ?? "";

  const queryClient = useQueryClient();

  const removePermissionsQuery = useCallback(async () => {
    return await queryClient.removeQueries({
      queryKey: ["role-permissions", { role }],
    });
  }, [queryClient, role]);

  const { data: permissions } = useQuery({
    queryKey: ["role-permissions", { role }],
    queryFn: async () => {
      return (await getPermissionByRole(role!)) as PermissionsWithRelation[];
    },
    // enabled: role !== ucwords("admin"),
    enabled: role !== "",
  });

  // Group permissions by tab for easier lookup
  const permissionsByTab = groupBy(permissions || [], (p) =>
    p.tab.title.toLowerCase()
  );

  return (
    <AuthContext.Provider
      value={{
        permissions: permissionsByTab,
        role,
        removePermissionsQuery,
        user: {
          id: session?.user.id || "",
          names: session?.user.name || "",
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const usePermissions = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a AuthProvider');
    }
    return context;
};