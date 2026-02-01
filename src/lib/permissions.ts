import type { RolePermissions } from "@/db/schema";

// All available permissions
export const ALL_PERMISSIONS = [
  // Navigation/View permissions
  { key: "canViewDashboard", label: "Dashboard anzeigen", category: "navigation" },
  { key: "canViewTasks", label: "Aufgaben anzeigen", category: "navigation" },
  { key: "canViewClients", label: "Mandanten anzeigen", category: "navigation" },
  { key: "canViewTeam", label: "Team anzeigen", category: "navigation" },
  { key: "canViewSettings", label: "Einstellungen anzeigen", category: "navigation" },
  { key: "canViewRoles", label: "Rollen anzeigen", category: "navigation" },
  // Task permissions
  { key: "canCreateTasks", label: "Aufgaben erstellen", category: "tasks" },
  { key: "canEditTasks", label: "Aufgaben bearbeiten", category: "tasks" },
  { key: "canDeleteTasks", label: "Aufgaben löschen", category: "tasks" },
  { key: "canSubmitTasks", label: "Aufgaben einreichen", category: "tasks" },
  { key: "canCompleteTasks", label: "Aufgaben abschließen", category: "tasks" },
  { key: "canReturnTasks", label: "Aufgaben zurückgeben", category: "tasks" },
  // Client permissions
  { key: "canCreateClients", label: "Mandanten erstellen", category: "clients" },
  { key: "canEditClients", label: "Mandanten bearbeiten", category: "clients" },
  { key: "canDeleteClients", label: "Mandanten löschen", category: "clients" },
  // User permissions
  { key: "canInviteUsers", label: "Benutzer einladen", category: "users" },
  { key: "canEditUsers", label: "Benutzer bearbeiten", category: "users" },
  { key: "canDeleteUsers", label: "Benutzer löschen", category: "users" },
  { key: "canManageRoles", label: "Rollen verwalten", category: "users" },
  // File permissions
  { key: "canUploadFiles", label: "Dateien hochladen", category: "files" },
  { key: "canDeleteFiles", label: "Dateien löschen", category: "files" },
  // Comment permissions
  { key: "canComment", label: "Kommentieren", category: "comments" },
  { key: "canDeleteComments", label: "Kommentare löschen", category: "comments" },
] as const;

export type PermissionKey = keyof RolePermissions;

export const PERMISSION_CATEGORIES = {
  navigation: { label: "Navigation", icon: "LayoutDashboard" },
  tasks: { label: "Aufgaben", icon: "FileText" },
  clients: { label: "Mandanten", icon: "Building2" },
  users: { label: "Benutzer", icon: "Users" },
  files: { label: "Dateien", icon: "Upload" },
  comments: { label: "Kommentare", icon: "MessageSquare" },
} as const;

// Default role configurations
export const DEFAULT_ROLES: { name: string; description: string; permissions: RolePermissions; isSystem: boolean }[] = [
  {
    name: "Administrator",
    description: "Vollzugriff auf alle Funktionen",
    isSystem: true,
    permissions: {
      canViewDashboard: true,
      canViewTasks: true,
      canViewClients: true,
      canViewTeam: true,
      canViewSettings: true,
      canViewRoles: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canSubmitTasks: true,
      canCompleteTasks: true,
      canReturnTasks: true,
      canCreateClients: true,
      canEditClients: true,
      canDeleteClients: true,
      canInviteUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canManageRoles: true,
      canUploadFiles: true,
      canDeleteFiles: true,
      canComment: true,
      canDeleteComments: true,
    },
  },
  {
    name: "Mitarbeiter",
    description: "Standard-Mitarbeiter mit Zugriff auf Mandanten und Aufgaben",
    isSystem: true,
    permissions: {
      canViewDashboard: true,
      canViewTasks: true,
      canViewClients: true,
      canViewTeam: true,
      canViewSettings: true,
      canViewRoles: false,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: false,
      canSubmitTasks: false,
      canCompleteTasks: true,
      canReturnTasks: true,
      canCreateClients: false,
      canEditClients: true,
      canDeleteClients: false,
      canInviteUsers: true,
      canEditUsers: false,
      canDeleteUsers: false,
      canManageRoles: false,
      canUploadFiles: true,
      canDeleteFiles: true,
      canComment: true,
      canDeleteComments: false,
    },
  },
  {
    name: "Kunde",
    description: "Mandant mit eingeschränktem Zugriff auf eigene Aufgaben",
    isSystem: true,
    permissions: {
      canViewDashboard: true,
      canViewTasks: true,
      canViewClients: false,
      canViewTeam: false,
      canViewSettings: true,
      canViewRoles: false,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canSubmitTasks: true,
      canCompleteTasks: false,
      canReturnTasks: false,
      canCreateClients: false,
      canEditClients: false,
      canDeleteClients: false,
      canInviteUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canManageRoles: false,
      canUploadFiles: true,
      canDeleteFiles: false,
      canComment: true,
      canDeleteComments: false,
    },
  },
  {
    name: "Betrachter",
    description: "Nur-Lese-Zugriff",
    isSystem: true,
    permissions: {
      canViewDashboard: true,
      canViewTasks: true,
      canViewClients: true,
      canViewTeam: true,
      canViewSettings: false,
      canViewRoles: false,
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canSubmitTasks: false,
      canCompleteTasks: false,
      canReturnTasks: false,
      canCreateClients: false,
      canEditClients: false,
      canDeleteClients: false,
      canInviteUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canManageRoles: false,
      canUploadFiles: false,
      canDeleteFiles: false,
      canComment: false,
      canDeleteComments: false,
    },
  },
];

// Helper to check if a user has a specific permission
export function hasPermission(
  userPermissions: RolePermissions | null | undefined,
  permission: PermissionKey
): boolean {
  if (!userPermissions) return false;
  return userPermissions[permission] === true;
}

// Helper to merge multiple role permissions (union of all permissions)
export function mergePermissions(rolePermissions: RolePermissions[]): RolePermissions {
  const merged: RolePermissions = {};
  for (const perms of rolePermissions) {
    for (const key of Object.keys(perms) as PermissionKey[]) {
      if (perms[key] === true) {
        merged[key] = true;
      }
    }
  }
  return merged;
}
