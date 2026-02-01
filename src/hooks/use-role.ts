"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "@/lib/constants";

interface RoleContextType {
  role: UserRole;
  isEmployee: boolean;
  isCustomer: boolean;
}

export const RoleContext = createContext<RoleContextType>({
  role: "customer",
  isEmployee: false,
  isCustomer: true,
});

export function useRole() {
  return useContext(RoleContext);
}
