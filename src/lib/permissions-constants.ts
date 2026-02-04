/**
 * Permission names as constants for type safety
 * This file contains only constants and can be imported in both client and server components
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

  // Audit Logs
  VIEW_AUDIT_LOGS: "view_audit_logs",
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
