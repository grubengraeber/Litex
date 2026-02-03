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

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  status: "pending" | "active" | "disabled";
  role: "customer" | "employee";
  roles: Array<{ id: string; name: string }>;
}

const statusConfig = {
  active: { label: "Aktiv", variant: "default" as const },
  pending: { label: "Ausstehend", variant: "secondary" as const },
  disabled: { label: "Deaktiviert", variant: "destructive" as const },
};

const roleConfig = {
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
  onAssignRole: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
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
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {user.name || user.email.split("@")[0]}
              </div>
              <div className="text-sm text-slate-500">{user.email}</div>
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
            { label: "Mitarbeiter", value: "employee" },
            { label: "Kunde", value: "customer" },
          ]}
        />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as keyof typeof roleConfig;
        const config = roleConfig[role];
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
              <span className="text-sm text-slate-400">Keine Rollen</span>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAssignRole(user)}
            >
              <UserCog className="w-4 h-4 mr-1" />
              Rolle
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                  {user.status === "active" ? "Deaktivieren" : "Aktivieren"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="text-red-600"
                >
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={users} pageSize={20} />;
}
