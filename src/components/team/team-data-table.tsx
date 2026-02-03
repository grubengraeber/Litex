"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ColumnHeader } from "@/components/ui/column-filter";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  status: "pending" | "active" | "disabled";
  companyId: string | null;
  companyName: string | null;
  createdAt: string;
  roles: Role[];
}

const statusConfig = {
  active: { label: "Aktiv", variant: "default" as const },
  pending: { label: "Ausstehend", variant: "secondary" as const },
  disabled: { label: "Deaktiviert", variant: "destructive" as const },
};

export function TeamDataTable({
  members,
  onEdit,
  onToggleStatus,
}: {
  members: TeamMember[];
  onEdit?: (member: TeamMember) => void;
  onToggleStatus?: (member: TeamMember) => void;
}) {
  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Mitglied" filterType="text" />
      ),
      cell: ({ row }) => {
        const member = row.original;
        const initials = member.name
          ? member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          : member.email.slice(0, 2).toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={member.image || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {member.name || member.email.split("@")[0]}
              </div>
              <div className="text-sm text-slate-500">{member.email}</div>
            </div>
          </div>
        );
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
      id: "company",
      accessorFn: (row) => row.companyName || "Kanzlei",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Zugehörigkeit" filterType="text" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.original.companyName || "Kanzlei"}</div>
      ),
    },
    {
      id: "roles",
      header: "Rollen",
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
      accessorKey: "createdAt",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Seit" filterType="none" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return (
          <div className="text-sm text-slate-600">
            {formatDistanceToNow(new Date(date), {
              addSuffix: true,
              locale: de,
            })}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(member)}>
                  Bearbeiten
                </DropdownMenuItem>
              )}
              {onToggleStatus && (
                <DropdownMenuItem onClick={() => onToggleStatus(member)}>
                  {member.status === "active" ? "Deaktivieren" : "Aktivieren"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={members} pageSize={20} />;
}
