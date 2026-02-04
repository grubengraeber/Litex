"use client";

import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions-constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ViewToggle } from "@/components/tasks/view-toggle";
import { UsersDataTable } from "@/components/users/users-data-table";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ShieldCheck,
  UserCog,
  X,
  Ban,
  CheckCircle,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  status: "pending" | "active" | "disabled";
  role: "customer" | "employee";
  companyId: string | null;
  createdAt: string;
  roles: Role[];
}

export default function UsersPage() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [view, setView] = useState<"grid" | "table">("table");

  // Check permissions for user actions
  const canInviteUsers = hasPermission(PERMISSIONS.INVITE_USERS);
  const canEditUsers = hasPermission(PERMISSIONS.EDIT_USERS);
  const canDeleteUsers = hasPermission(PERMISSIONS.DELETE_USERS);
  const canManageRoles = hasPermission(PERMISSIONS.MANAGE_USER_ROLES);

  useEffect(() => {
    const savedView = localStorage.getItem("users-view");
    if (savedView === "grid" || savedView === "table") {
      setView(savedView);
    }
  }, []);

  const handleViewChange = (newView: "grid" | "table") => {
    setView(newView);
    localStorage.setItem("users-view", newView);
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Fehler beim Laden der Benutzer");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoles() {
    try {
      const response = await fetch("/api/roles");
      if (response.ok) {
        const data = await response.json();
        setAllRoles(data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  }

  function openRoleDialog(user: User) {
    setSelectedUser(user);
    setSelectedRoleId("");
    setDialogOpen(true);
  }

  async function handleAssignRole() {
    if (!selectedUser || !selectedRoleId) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });

      if (response.ok) {
        toast.success("Rolle zugewiesen");
        setDialogOpen(false);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Fehler beim Zuweisen");
      }
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Fehler beim Zuweisen");
    }
  }

  async function handleRemoveRole(userId: string, roleId: string) {
    try {
      const response = await fetch(
        `/api/users/${userId}/roles?roleId=${roleId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Rolle entfernt");
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Fehler beim Entfernen");
      }
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Fehler beim Entfernen");
    }
  }

  async function handleToggleStatus(user: User) {
    const newStatus = user.status === "active" ? "disabled" : "active";
    const action = newStatus === "disabled" ? "deaktivieren" : "aktivieren";

    if (!confirm(`Möchten Sie ${user.name || user.email} ${action}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Benutzer ${action}t`);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || `Fehler beim ${action.slice(0, -2)}en`);
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Fehler beim Aktualisieren");
    }
  }

  async function handleDeleteUser(user: User) {
    const confirmation = prompt(
      `WARNUNG: Dies löscht den Benutzer "${user.name || user.email}" PERMANENT.\n\nAlle Daten dieses Benutzers werden unwiderruflich gelöscht.\n\nGeben Sie "LÖSCHEN" ein, um fortzufahren:`
    );

    if (confirmation !== "LÖSCHEN") {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Benutzer gelöscht");
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Fehler beim Löschen");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Fehler beim Löschen");
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.roles.some((role) => role.name.toLowerCase().includes(query))
    );
  });

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const statusConfig = {
    active: { label: "Aktiv", variant: "default" as const },
    pending: { label: "Ausstehend", variant: "secondary" as const },
    disabled: { label: "Deaktiviert", variant: "destructive" as const },
  };

  const roleTypeConfig = {
    employee: { label: "Mitarbeiter", variant: "default" as const },
    customer: { label: "Kunde", variant: "secondary" as const },
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">Benutzer-Verwaltung</h1>
          <p className="text-slate-500 mt-1">{filteredUsers.length} Benutzer</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ViewToggle view={view} onViewChange={handleViewChange} />
          {canInviteUsers && (
            <>
              {/* Desktop: Full button with text */}
              <div className="hidden sm:block">
                <InviteUserDialog
                  buttonText="Benutzer einladen"
                  buttonVariant="default"
                  buttonClassName="bg-blue-600 hover:bg-blue-700"
                  onInviteSuccess={fetchUsers}
                />
              </div>
              {/* Mobile: Icon only */}
              <div className="sm:hidden">
                <InviteUserDialog
                  buttonVariant="default"
                  buttonClassName="bg-blue-600 hover:bg-blue-700"
                  iconOnly
                  onInviteSuccess={fetchUsers}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="search"
          placeholder="Benutzer durchsuchen..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Users Content */}
      {view === "table" ? (
        <UsersDataTable
          users={filteredUsers}
          onAssignRole={canManageRoles ? openRoleDialog : undefined}
          onToggleStatus={canEditUsers ? handleToggleStatus : undefined}
          onDelete={canDeleteUsers ? handleDeleteUser : undefined}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Alle Benutzer</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Benutzer</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Zugewiesene Rollen</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const statusBadge = statusConfig[user.status];
                const roleTypeBadge = roleTypeConfig[user.role];
                const initials = getInitials(user.name, user.email);

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.name || user.email.split("@")[0]}
                          </div>
                          <div className="text-sm text-slate-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleTypeBadge.variant}>
                        {roleTypeBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <div key={role.id} className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {role.name}
                            </Badge>
                            {canManageRoles && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 hover:bg-red-100"
                                onClick={() => handleRemoveRole(user.id, role.id)}
                              >
                                <X className="h-3 w-3 text-red-600" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {user.roles.length === 0 && (
                          <span className="text-sm text-slate-400">
                            Keine Rollen
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManageRoles && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleDialog(user)}
                            className="gap-2"
                          >
                            <UserCog className="w-4 h-4" />
                            Rolle zuweisen
                          </Button>
                        )}
                        {(canEditUsers || canDeleteUsers) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditUsers && (
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(user)}
                                >
                                  {user.status === "active" ? (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Deaktivieren
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Aktivieren
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              {canEditUsers && canDeleteUsers && <DropdownMenuSeparator />}
                              {canDeleteUsers && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Löschen
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}

      {/* Assign Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rolle zuweisen</DialogTitle>
            <DialogDescription>
              Weisen Sie {selectedUser?.name || selectedUser?.email} eine neue
              Rolle zu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Rolle auswählen</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Rolle wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {allRoles
                    .filter(
                      (role) =>
                        !selectedUser?.roles.some((ur) => ur.id === role.id)
                    )
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          {role.name}
                          {role.description && (
                            <span className="text-slate-500 text-sm">
                              - {role.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAssignRole} disabled={!selectedRoleId}>
              Zuweisen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
