import { db } from "@/db";
import { permissions, rolePermissions, roles, userRoles } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Permission names as constants for type safety
 */
export const PERMISSIONS = {
  // Navigation
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_TASKS: "view_tasks",
  VIEW_CLIENTS: "view_clients",
  VIEW_TEAM: "view_team",
  VIEW_SETTINGS: "view_settings",
  VIEW_ROLES: "view_roles",
  VIEW_PERMISSIONS: "view_permissions",
  VIEW_USERS: "view_users",

  // Tasks
  CREATE_TASKS: "create_tasks",
  EDIT_TASKS: "edit_tasks",
  DELETE_TASKS: "delete_tasks",
  SUBMIT_TASKS: "submit_tasks",
  COMPLETE_TASKS: "complete_tasks",
  RETURN_TASKS: "return_tasks",
  VIEW_ALL_TASKS: "view_all_tasks",

  // Clients
  CREATE_CLIENTS: "create_clients",
  EDIT_CLIENTS: "edit_clients",
  DELETE_CLIENTS: "delete_clients",
  VIEW_ALL_CLIENTS: "view_all_clients",

  // Users
  INVITE_USERS: "invite_users",
  EDIT_USERS: "edit_users",
  DELETE_USERS: "delete_users",
  MANAGE_USER_ROLES: "manage_user_roles",
  VIEW_ALL_USERS: "view_all_users",

  // Files
  UPLOAD_FILES: "upload_files",
  DELETE_FILES: "delete_files",
  APPROVE_FILES: "approve_files",
  REJECT_FILES: "reject_files",

  // Comments
  CREATE_COMMENTS: "create_comments",
  EDIT_COMMENTS: "edit_comments",
  DELETE_COMMENTS: "delete_comments",

  // Roles
  CREATE_ROLES: "create_roles",
  EDIT_ROLES: "edit_roles",
  DELETE_ROLES: "delete_roles",
  ASSIGN_PERMISSIONS: "assign_permissions",
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

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
