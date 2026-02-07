"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ColumnHeader } from "@/components/ui/column-filter";
import { Badge } from "@/components/ui/badge";

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
  createdAt: string;
  roles: Array<{ id: string; name: string }>;
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

const categoryColors: Record<string, string> = {
  navigation: "bg-primary/10 text-foreground border-primary/20",
  tasks: "bg-green-100 text-green-800 border-green-200",
  clients: "bg-purple-100 text-purple-800 border-purple-200",
  users: "bg-orange-100 text-orange-800 border-orange-200",
  files: "bg-yellow-100 text-yellow-800 border-yellow-200",
  comments: "bg-pink-100 text-pink-800 border-pink-200",
  roles: "bg-red-100 text-red-800 border-red-200",
};

export function PermissionsDataTable({
  permissions,
}: {
  permissions: Permission[];
}) {
  const columns: ColumnDef<Permission>[] = [
    {
      accessorKey: "category",
      header: ({ column }) => (
        <ColumnHeader
          column={column}
          title="Kategorie"
          filterType="select"
          filterOptions={Object.entries(categoryLabels).map(([value, label]) => ({
            label,
            value,
          }))}
        />
      ),
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return (
          <Badge
            variant="outline"
            className={categoryColors[category] || ""}
          >
            {categoryLabels[category] || category}
          </Badge>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Berechtigung" filterType="text" />
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
        <div className="text-muted-foreground max-w-md">
          {row.getValue("description") || "-"}
        </div>
      ),
    },
    {
      id: "roles",
      header: "Zugeordnete Rollen",
      cell: ({ row }) => {
        const roles = row.original.roles;
        return (
          <div className="flex flex-wrap gap-1">
            {roles.length > 0 ? (
              roles.map((role) => (
                <Badge key={role.id} variant="default" className="text-xs">
                  {role.name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                Keine Rolle zugewiesen
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={permissions} pageSize={20} />;
}
