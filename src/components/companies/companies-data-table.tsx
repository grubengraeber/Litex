"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ColumnHeader } from "@/components/ui/column-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, FileText, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Company {
  id: string;
  name: string;
  bmdId: string | null;
  finmaticsId: string | null;
  isActive: boolean;
  userCount?: number;
  taskCount?: number;
  openTaskCount?: number;
}

export function CompaniesDataTable({
  companies,
  onEdit,
  onToggleStatus,
}: {
  companies: Company[];
  onEdit?: (company: Company) => void;
  onToggleStatus?: (company: Company) => void;
}) {
  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Mandant" filterType="text" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <div className="font-medium">{row.getValue("name")}</div>
            {row.original.bmdId && (
              <div className="text-sm text-slate-500">{row.original.bmdId}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <ColumnHeader
          column={column}
          title="Status"
          filterType="select"
          filterOptions={[
            { label: "Aktiv", value: "true" },
            { label: "Inaktiv", value: "false" },
          ]}
        />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "outline"}>
            {isActive ? "Aktiv" : "Inaktiv"}
          </Badge>
        );
      },
    },
    {
      id: "users",
      accessorKey: "userCount",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Benutzer" filterType="none" />
      ),
      cell: ({ row }) => {
        const count = row.original.userCount ?? 0;
        return (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      id: "tasks",
      accessorKey: "taskCount",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Aufgaben" filterType="none" />
      ),
      cell: ({ row }) => {
        const total = row.original.taskCount ?? 0;
        const open = row.original.openTaskCount ?? 0;
        return (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>{total}</span>
            {open > 0 && (
              <span className="text-xs text-orange-600 font-medium">
                ({open} offen)
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => {
        const company = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(company)}>
                  Bearbeiten
                </DropdownMenuItem>
              )}
              {onToggleStatus && (
                <DropdownMenuItem onClick={() => onToggleStatus(company)}>
                  {company.isActive ? "Deaktivieren" : "Aktivieren"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={companies} pageSize={20} />;
}
