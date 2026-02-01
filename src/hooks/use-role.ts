"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "@/lib/constants";
import { ROLE_PERMISSIONS } from "@/lib/constants";

interface RoleContextType {
  role: UserRole;
  isEmployee: boolean;
  isCustomer: boolean;
  permissions: typeof ROLE_PERMISSIONS.customer | typeof ROLE_PERMISSIONS.employee;
}

export const RoleContext = createContext<RoleContextType>({
  role: "customer",
  isEmployee: false,
  isCustomer: true,
  permissions: ROLE_PERMISSIONS.customer,
});

export function useRole() {
  return useContext(RoleContext);
}
