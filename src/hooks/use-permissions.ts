"use client";

import { createContext, useContext } from "react";
import type { RolePermissions } from "@/db/schema";
import type { PermissionKey } from "@/lib/permissions";

interface PermissionsContextType {
  permissions: RolePermissions;
  roles: { id: string; name: string }[];
  isLoading: boolean;
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;
  hasAllPermissions: (permissions: PermissionKey[]) => boolean;
}

const defaultPermissions: RolePermissions = {
  canViewDashboard: true,
  canViewTasks: true,
  canViewSettings: true,
  canComment: true,
  canUploadFiles: true,
};

export const PermissionsContext = createContext<PermissionsContextType>({
  permissions: defaultPermissions,
  roles: [],
  isLoading: true,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
});

export function usePermissions() {
  return useContext(PermissionsContext);
}

// Convenience hook for checking a single permission
export function useHasPermission(permission: PermissionKey): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

// Component wrapper for permission-based rendering
export function useCanView(permission: PermissionKey): boolean {
  const { permissions, isLoading } = usePermissions();
  if (isLoading) return false;
  return permissions[permission] === true;
}
