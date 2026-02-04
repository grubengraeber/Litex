import { db } from "@/db";
import { permissions, rolePermissions, roles, userRoles } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { PERMISSIONS as PERMS, type PermissionName as PN } from "./permissions-constants";

// Re-export constants from the shared file with proper types
export const PERMISSIONS = PERMS;
export type PermissionName = PN;

/**
 * Get all permissions for a user by their ID
 */
export async function getUserPermissions(userId: string): Promise<Set<string>> {
  const userPermissions = await db
    .select({
      permissionName: permissions.name,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  return new Set(userPermissions.map((p) => p.permissionName));
}

/**
 * Check if a user has a specific permission
 */
export async function userHasPermission(
  userId: string,
  permission: PermissionName
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return userPermissions.has(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export async function userHasAnyPermission(
  userId: string,
  permissionsList: PermissionName[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissionsList.some((p) => userPermissions.has(p));
}

/**
 * Check if a user has all of the specified permissions
 */
export async function userHasAllPermissions(
  userId: string,
  permissionsList: PermissionName[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissionsList.every((p) => userPermissions.has(p));
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string) {
  return await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      isSystem: roles.isSystem,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));
}

/**
 * Check if a user is an administrator (has all permissions)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const userRolesList = await getUserRoles(userId);
  return userRolesList.some((role) => role.name === "Administrator");
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
  const rolePerms = await db
    .select({
      permissionName: permissions.name,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));

  return rolePerms.map((p) => p.permissionName);
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string,
  assignedBy?: string
) {
  return await db.insert(userRoles).values({
    userId,
    roleId,
    assignedBy,
  });
}

/**
 * Remove a role from a user
 */
export async function removeRoleFromUser(userId: string, roleId: string) {
  return await db
    .delete(userRoles)
    .where(
      eq(userRoles.userId, userId) && eq(userRoles.roleId, roleId)
    );
}

/**
 * Add permissions to a role
 */
export async function addPermissionsToRole(
  roleId: string,
  permissionIds: string[]
) {
  const values = permissionIds.map((permissionId) => ({
    roleId,
    permissionId,
  }));
  return await db.insert(rolePermissions).values(values);
}

/**
 * Remove permissions from a role
 */
export async function removePermissionsFromRole(
  roleId: string,
  permissionIds: string[]
) {
  return await db
    .delete(rolePermissions)
    .where(
      eq(rolePermissions.roleId, roleId) &&
        inArray(rolePermissions.permissionId, permissionIds)
    );
}
