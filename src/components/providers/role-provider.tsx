"use client";

import { ReactNode, useMemo } from "react";
import { RoleContext } from "@/hooks/use-role";
import type { UserRole } from "@/lib/constants";
import { ROLE_PERMISSIONS } from "@/lib/constants";

interface RoleProviderProps {
  children: ReactNode;
  role?: UserRole;
}

export function RoleProvider({ children, role = "customer" }: RoleProviderProps) {
  const value = useMemo(() => ({
    role,
    isEmployee: role === "employee",
    isCustomer: role === "customer",
    permissions: ROLE_PERMISSIONS[role],
  }), [role]);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}
