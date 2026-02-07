"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ColumnHeader } from "@/components/ui/column-filter";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserCog, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  role: "admin" | "employee" | "customer";
  companyId: string | null;
  createdAt: string;
  roles: Role[];
}

const statusConfig = {
  active: { label: "Aktiv", variant: "default" as const },
  pending: { label: "Ausstehend", variant: "secondary" as const },
  disabled: { label: "Deaktiviert", variant: "destructive" as const },
};

const roleConfig = {
  admin: { label: "Administrator", variant: "default" as const },
  employee: { label: "Mitarbeiter", variant: "default" as const },
  customer: { label: "Kunde", variant: "secondary" as const },
};

export function UsersDataTable({
  users,
  onAssignRole,
  onToggleStatus,
  onDelete,
}: {
  users: User[];
  onAssignRole?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  onDelete?: (user: User) => void;
}) {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Benutzer" filterType="text" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const initials = user.name
          ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          : user.email.slice(0, 2).toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {user.name || user.email.split("@")[0]}
              </div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <ColumnHeader
          column={column}
          title="Typ"
          filterType="select"
          filterOptions={[
            { label: "Administrator", value: "admin" },
            { label: "Mitarbeiter", value: "employee" },
            { label: "Kunde", value: "customer" },
          ]}
        />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        const config = roleConfig[role as keyof typeof roleConfig];

        if (!config) {
          return <Badge variant="outline">{role}</Badge>;
        }

        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <ColumnHeader
          column={column}
          title="Status"
          filterType="select"
          filterOptions={[
            { label: "Aktiv", value: "active" },
            { label: "Ausstehend", value: "pending" },
            { label: "Deaktiviert", value: "disabled" },
          ]}
        />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusConfig;
        const config = statusConfig[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: "roles",
      header: "Zugewiesene Rollen",
      cell: ({ row }) => {
        const roles = row.original.roles;
        return (
          <div className="flex flex-wrap gap-1">
            {roles.length > 0 ? (
              roles.map((role) => (
                <Badge key={role.id} variant="outline" className="text-xs">
                  {role.name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Keine Rollen</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            {onAssignRole && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignRole(user)}
              >
                <UserCog className="w-4 h-4 mr-1" />
                Rolle
              </Button>
            )}
            {(onToggleStatus || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onToggleStatus && (
                    <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                      {user.status === "active" ? "Deaktivieren" : "Aktivieren"}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(user)}
                      className="text-red-600"
                    >
                      Löschen
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={users} pageSize={20} />;
}
