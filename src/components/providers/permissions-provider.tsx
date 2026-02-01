"use client";

import { ReactNode, useMemo, useEffect, useState } from "react";
import { PermissionsContext } from "@/hooks/use-permissions";
import type { RolePermissions } from "@/db/schema";
import type { PermissionKey } from "@/lib/permissions";

interface PermissionsProviderProps {
  children: ReactNode;
  initialPermissions?: RolePermissions;
  initialRoles?: { id: string; name: string }[];
}

export function PermissionsProvider({ 
  children, 
  initialPermissions,
  initialRoles = []
}: PermissionsProviderProps) {
  const [permissions, setPermissions] = useState<RolePermissions>(initialPermissions || {});
  const [roles, setRoles] = useState<{ id: string; name: string }[]>(initialRoles);
  const [isLoading, setIsLoading] = useState(!initialPermissions);

  useEffect(() => {
    // If no initial permissions, fetch from API
    if (!initialPermissions) {
      fetch("/api/auth/permissions")
        .then(res => res.json())
        .then(data => {
          setPermissions(data.permissions || {});
          setRoles(data.roles || []);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [initialPermissions]);

  const value = useMemo(() => ({
    permissions,
    roles,
    isLoading,
    hasPermission: (permission: PermissionKey) => permissions[permission] === true,
    hasAnyPermission: (perms: PermissionKey[]) => perms.some(p => permissions[p] === true),
    hasAllPermissions: (perms: PermissionKey[]) => perms.every(p => permissions[p] === true),
  }), [permissions, roles, isLoading]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}
