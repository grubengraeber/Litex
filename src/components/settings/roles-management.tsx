"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  Save,
  X,
  Check,
  Loader2
} from "lucide-react";
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES, type PermissionKey } from "@/lib/permissions";
import type { RolePermissions } from "@/db/schema";
import { cn } from "@/lib/utils";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: RolePermissions;
  isSystem: boolean;
  userCount: number;
}

export function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: {} as RolePermissions,
  });

  // Fetch roles
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) return;
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });
      
      if (res.ok) {
        await fetchRoles();
        setIsCreating(false);
        setNewRole({ name: "", description: "", permissions: {} });
      }
    } catch (error) {
      console.error("Error creating role:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingRole.name,
          description: editingRole.description,
          permissions: editingRole.permissions,
        }),
      });
      
      if (res.ok) {
        await fetchRoles();
        setEditingRole(null);
      }
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Möchten Sie diese Rolle wirklich löschen?")) return;
    
    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchRoles();
      }
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  const togglePermission = (
    permissions: RolePermissions,
    setPermissions: (p: RolePermissions) => void,
    key: PermissionKey
  ) => {
    setPermissions({
      ...permissions,
      [key]: !permissions[key],
    });
  };

  // Group permissions by category
  const permissionsByCategory = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS[number][]>);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-base">Rollen & Berechtigungen</CardTitle>
          </div>
          {!isCreating && !editingRole && (
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Neue Rolle
            </Button>
          )}
        </div>
        <CardDescription>
          Verwalten Sie Rollen und deren Berechtigungen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new role form */}
        {isCreating && (
          <div className="p-4 border rounded-lg bg-slate-50 space-y-4">
            <h4 className="font-medium">Neue Rolle erstellen</h4>
            <div className="grid gap-3">
              <Input
                placeholder="Rollenname"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              />
              <Input
                placeholder="Beschreibung (optional)"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              />
            </div>
            
            {/* Permissions grid */}
            <div className="space-y-4 mt-4">
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <div key={category}>
                  <h5 className="text-sm font-medium text-slate-600 mb-2">
                    {PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES]?.label || category}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((perm) => (
                      <button
                        key={perm.key}
                        onClick={() => togglePermission(
                          newRole.permissions,
                          (p) => setNewRole({ ...newRole, permissions: p }),
                          perm.key as PermissionKey
                        )}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md border transition-colors",
                          newRole.permissions[perm.key as PermissionKey]
                            ? "bg-blue-100 border-blue-300 text-blue-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {newRole.permissions[perm.key as PermissionKey] && (
                          <Check className="w-3 h-3 inline mr-1" />
                        )}
                        {perm.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleCreateRole} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Erstellen
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>
                <X className="w-4 h-4 mr-1" />
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* Edit role form */}
        {editingRole && (
          <div className="p-4 border rounded-lg bg-blue-50 space-y-4">
            <h4 className="font-medium">Rolle bearbeiten: {editingRole.name}</h4>
            <div className="grid gap-3">
              <Input
                placeholder="Rollenname"
                value={editingRole.name}
                onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                disabled={editingRole.isSystem}
              />
              <Input
                placeholder="Beschreibung (optional)"
                value={editingRole.description || ""}
                onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
              />
            </div>
            
            {/* Permissions grid */}
            <div className="space-y-4 mt-4">
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <div key={category}>
                  <h5 className="text-sm font-medium text-slate-600 mb-2">
                    {PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES]?.label || category}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((perm) => (
                      <button
                        key={perm.key}
                        onClick={() => togglePermission(
                          editingRole.permissions,
                          (p) => setEditingRole({ ...editingRole, permissions: p }),
                          perm.key as PermissionKey
                        )}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md border transition-colors",
                          editingRole.permissions[perm.key as PermissionKey]
                            ? "bg-blue-100 border-blue-300 text-blue-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {editingRole.permissions[perm.key as PermissionKey] && (
                          <Check className="w-3 h-3 inline mr-1" />
                        )}
                        {perm.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleUpdateRole} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Speichern
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingRole(null)}>
                <X className="w-4 h-4 mr-1" />
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* Roles list */}
        {!isCreating && !editingRole && (
          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{role.name}</span>
                    {role.isSystem && (
                      <Badge variant="secondary" className="text-xs">System</Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{role.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {role.userCount} Benutzer
                    </span>
                    <span>
                      {Object.values(role.permissions).filter(Boolean).length} Berechtigungen
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingRole(role)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {!role.isSystem && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {roles.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Keine Rollen vorhanden. Erstellen Sie eine neue Rolle.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
