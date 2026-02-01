"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { PermissionKey } from "@/lib/permissions";

interface PermissionGateProps {
  children: ReactNode;
  permission?: PermissionKey;
  permissions?: PermissionKey[];
  requireAll?: boolean; // If true, all permissions must be granted (AND), otherwise any (OR)
  fallback?: ReactNode;
}

/**
 * PermissionGate - Conditionally renders children based on user permissions
 * 
 * Usage:
 * <PermissionGate permission="canViewTeam">
 *   <TeamSection />
 * </PermissionGate>
 * 
 * <PermissionGate permissions={["canEditTasks", "canDeleteTasks"]} requireAll>
 *   <AdminControls />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading } = usePermissions();

  // While loading, don't render anything (or could show skeleton)
  if (isLoading) {
    return null;
  }

  // Single permission check
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // No permission specified, render children
  return <>{children}</>;
}

/**
 * withPermission - HOC for permission-based component rendering
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: PermissionKey,
  Fallback?: React.ComponentType
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGate permission={permission} fallback={Fallback ? <Fallback /> : null}>
        <Component {...props} />
      </PermissionGate>
    );
  };
}
