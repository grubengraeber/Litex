"use client";

import { useState, useEffect, useCallback } from "react";
import type { PermissionName } from "@/lib/permissions-constants";

interface UsePermissionsReturn {
  permissions: Set<string>;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: PermissionName) => boolean;
  hasAnyPermission: (permissionsList: PermissionName[]) => boolean;
  hasAllPermissions: (permissionsList: PermissionName[]) => boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and check user permissions
 *
 * Usage:
 * const { permissions, loading, hasPermission } = usePermissions();
 *
 * if (loading) return <Spinner />;
 * if (hasPermission(PERMISSIONS.CREATE_TASKS)) {
 *   return <CreateButton />;
 * }
 */
export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/permissions");

      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }

      const data = await response.json();
      setPermissions(new Set(data.permissions));
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setPermissions(new Set()); // Empty permissions on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (permission: PermissionName): boolean => {
      return permissions.has(permission);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (permissionsList: PermissionName[]): boolean => {
      return permissionsList.some((p) => permissions.has(p));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (permissionsList: PermissionName[]): boolean => {
      return permissionsList.every((p) => permissions.has(p));
    },
    [permissions]
  );

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
  };
}
