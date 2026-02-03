"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldAlert,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
}

interface CategorizedPermissions {
  [category: string]: Permission[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [categorizedPermissions, setCategorizedPermissions] = useState<CategorizedPermissions>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissionIds: [] as string[],
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  async function fetchRoles() {
    try {
      const response = await fetch("/api/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Fehler beim Laden der Rollen");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPermissions() {
    try {
      const response = await fetch("/api/permissions");
      if (response.ok) {
        const data = await response.json();
        setCategorizedPermissions(data.categorized);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  }

  function openCreateDialog() {
    setEditingRole(null);
    setFormData({ name: "", description: "", permissionIds: [] });
    setDialogOpen(true);
  }

  function openEditDialog(role: Role) {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissionIds: role.permissions.map((p) => p.id),
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(role: Role) {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      const url = editingRole
        ? `/api/roles/${editingRole.id}`
        : "/api/roles";
      const method = editingRole ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingRole ? "Rolle aktualisiert" : "Rolle erstellt"
        );
        setDialogOpen(false);
        fetchRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || "Fehler beim Speichern");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("Fehler beim Speichern");
    }
  }

  async function handleDelete() {
    if (!roleToDelete) return;

    try {
      const response = await fetch(`/api/roles/${roleToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Rolle gelöscht");
        setDeleteDialogOpen(false);
        fetchRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || "Fehler beim Löschen");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Fehler beim Löschen");
    }
  }

  function togglePermission(permissionId: string) {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  }

  function toggleAllInCategory(category: string) {
    const categoryPerms = categorizedPermissions[category] || [];
    const categoryIds = categoryPerms.map((p) => p.id);
    const allSelected = categoryIds.every((id) =>
      formData.permissionIds.includes(id)
    );

    setFormData((prev) => {
      if (allSelected) {
        return {
          ...prev,
          permissionIds: prev.permissionIds.filter((id) => !categoryIds.includes(id)),
        };
      } else {
        const uniqueIds = Array.from(new Set([...prev.permissionIds, ...categoryIds]));
        return {
          ...prev,
          permissionIds: uniqueIds,
        };
      }
    });
  }

  const filteredRoles = roles.filter((role) => {
    const query = searchQuery.toLowerCase();
    return (
      role.name.toLowerCase().includes(query) ||
      role.description?.toLowerCase().includes(query) ||
      role.permissions.some((p) => p.name.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Laden...</div>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    navigation: "Navigation",
    tasks: "Aufgaben",
    clients: "Mandanten",
    users: "Benutzer",
    files: "Dateien",
    comments: "Kommentare",
    roles: "Rollen",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rollen-Verwaltung</h1>
          <p className="text-slate-500 mt-1">
            {roles.length} Rollen definiert
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neue Rolle
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="search"
          placeholder="Rollen durchsuchen..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Rollen</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rolle</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead>Berechtigungen</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead className="w-24">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-slate-600">
                    {role.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {role.permissions.slice(0, 3).map((perm) => (
                        <Badge key={perm.id} variant="outline" className="text-xs">
                          {perm.name}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{role.permissions.length - 3} mehr
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Badge variant="default" className="gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        System
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="w-3 h-3" />
                        Custom
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!role.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(role)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Rolle bearbeiten" : "Neue Rolle erstellen"}
            </DialogTitle>
            <DialogDescription>
              {editingRole?.isSystem &&
                "Hinweis: System-Rollen können nicht umbenannt werden."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={editingRole?.isSystem}
                placeholder="z.B. Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Kurze Beschreibung der Rolle"
              />
            </div>
            <div className="space-y-2">
              <Label>Berechtigungen</Label>
              <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(categorizedPermissions).map(
                  ([category, perms]) => {
                    const allSelected = perms.every((p) =>
                      formData.permissionIds.includes(p.id)
                    );
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={() =>
                              toggleAllInCategory(category)
                            }
                          />
                          <Label className="font-semibold">
                            {categoryLabels[category] || category}
                          </Label>
                        </div>
                        <div className="ml-6 space-y-2">
                          {perms.map((perm) => (
                            <div
                              key={perm.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                checked={formData.permissionIds.includes(
                                  perm.id
                                )}
                                onCheckedChange={() =>
                                  togglePermission(perm.id)
                                }
                              />
                              <Label className="text-sm font-normal">
                                {perm.name}
                                {perm.description && (
                                  <span className="text-slate-500 ml-2">
                                    - {perm.description}
                                  </span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit}>
              {editingRole ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rolle löschen?</DialogTitle>
            <DialogDescription>
              Möchten Sie die Rolle &quot;{roleToDelete?.name}&quot; wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
