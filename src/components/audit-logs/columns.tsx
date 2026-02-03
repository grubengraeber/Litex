"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronDown, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string | null;
  userEmail: string;
  userIpAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  changes: string | null;
  metadata: string | null;
  status: "success" | "failed" | "error";
  errorMessage: string | null;
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 border-green-200",
  READ: "bg-blue-100 text-blue-800 border-blue-200",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
  LOGIN: "bg-purple-100 text-purple-800 border-purple-200",
  LOGOUT: "bg-slate-100 text-slate-800 border-slate-200",
  UPLOAD: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DOWNLOAD: "bg-orange-100 text-orange-800 border-orange-200",
  APPROVE: "bg-green-100 text-green-800 border-green-200",
  REJECT: "bg-red-100 text-red-800 border-red-200",
};

const statusColors = {
  success: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels = {
  success: "Erfolg",
  failed: "Fehlgeschlagen",
  error: "Fehler",
};

export const columns: ColumnDef<AuditLog>[] = [
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => {
      const hasDetails = row.original.metadata || row.original.changes || row.original.errorMessage;

      if (!hasDetails) return null;

      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => row.toggleExpanded()}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Zeitstempel
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm">
          <div className="font-medium">
            {formatDistanceToNow(date, {
              addSuffix: true,
              locale: de,
            })}
          </div>
          <div className="text-xs text-slate-500">
            {date.toLocaleString("de-DE")}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "userEmail",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Benutzer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const email = row.getValue("userEmail") as string;
      const userId = row.original.userId;
      return (
        <div className="text-sm">
          <div className="font-medium">{email}</div>
          {userId && (
            <div className="text-xs text-slate-500 truncate max-w-[200px]">
              ID: {userId}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "action",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Aktion
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const action = row.getValue("action") as string;
      return (
        <Badge
          variant="outline"
          className={actionColors[action] || ""}
        >
          {action}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "entityType",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Entität
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const entityType = row.getValue("entityType") as string;
      const entityId = row.original.entityId;
      return (
        <div className="text-sm">
          <div className="font-medium capitalize">{entityType}</div>
          {entityId && (
            <div className="text-xs text-slate-500 truncate max-w-[150px]">
              {entityId}
            </div>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "userIpAddress",
    header: "IP-Adresse",
    cell: ({ row }) => {
      const ip = row.getValue("userIpAddress") as string | null;
      return <div className="text-sm text-slate-600">{ip || "-"}</div>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as "success" | "failed" | "error";
      return (
        <Badge
          variant="outline"
          className={statusColors[status]}
        >
          {statusLabels[status]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
];
