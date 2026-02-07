"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ColumnHeader } from "@/components/ui/column-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Shield, ShieldAlert } from "lucide-react";

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

export function RolesDataTable({
  roles,
  onEdit,
  onDelete,
}: {
  roles: Role[];
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
}) {
  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Rolle" filterType="text" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Beschreibung" filterType="text" />
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground max-w-md truncate">
          {row.getValue("description") || "-"}
        </div>
      ),
    },
    {
      id: "permissions",
      header: "Berechtigungen",
      cell: ({ row }) => {
        const role = row.original;
        return (
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
            {role.permissions.length === 0 && (
              <span className="text-sm text-muted-foreground">Keine</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isSystem",
      header: ({ column }) => (
        <ColumnHeader
          column={column}
          title="Typ"
          filterType="select"
          filterOptions={[
            { label: "System", value: "true" },
            { label: "Custom", value: "false" },
          ]}
        />
      ),
      cell: ({ row }) => {
        const isSystem = row.getValue("isSystem") as boolean;
        return isSystem ? (
          <Badge variant="default" className="gap-1">
            <ShieldAlert className="w-3 h-3" />
            System
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <Shield className="w-3 h-3" />
            Custom
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(role)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {!role.isSystem && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(role)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={roles} pageSize={20} />;
}
