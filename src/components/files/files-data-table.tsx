"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ColumnHeader } from "@/components/ui/column-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileIcon, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface FileRecord {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  storageKey: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  task: {
    id: string;
    bookingText: string | null;
    company: {
      name: string;
    };
  } | null;
}

const statusConfig = {
  pending: { label: "Ausstehend", icon: Clock, color: "text-yellow-700" },
  approved: { label: "Freigegeben", icon: CheckCircle2, color: "text-green-700" },
  rejected: { label: "Abgelehnt", icon: XCircle, color: "text-red-700" },
};

export function FilesDataTable({
  files,
  onPreview,
}: {
  files: FileRecord[];
  onPreview: (file: FileRecord) => void;
}) {
  const columns: ColumnDef<FileRecord>[] = [
    {
      accessorKey: "fileName",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Dateiname" filterType="text" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue("fileName")}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <ColumnHeader
          column={column}
          title="Status"
          filterType="select"
          filterOptions={[
            { label: "Ausstehend", value: "pending" },
            { label: "Freigegeben", value: "approved" },
            { label: "Abgelehnt", value: "rejected" },
          ]}
        />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusConfig;
        const config = statusConfig[status];
        const Icon = config.icon;
        return (
          <Badge variant="outline" className={config.color}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: "task",
      accessorFn: (row) => row.task?.bookingText || "-",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Aufgabe" filterType="text" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="truncate">
            {row.original.task?.bookingText || "Keine Aufgabe"}
          </div>
          {row.original.task && (
            <div className="text-xs text-muted-foreground truncate">
              {row.original.task.company.name}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "fileSize",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Größe" filterType="none" />
      ),
      cell: ({ row }) => {
        const size = row.getValue("fileSize") as number | null;
        return size ? formatFileSize(size) : "-";
      },
    },
    {
      id: "uploadedBy",
      accessorFn: (row) => row.user.name || row.user.email,
      header: ({ column }) => (
        <ColumnHeader column={column} title="Hochgeladen von" filterType="text" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.user.name || row.original.user.email}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Datum" filterType="none" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return formatDistanceToNow(new Date(date), {
          addSuffix: true,
          locale: de,
        });
      },
    },
    {
      id: "actions",
      header: "Aktionen",
      cell: ({ row }) => {
        const file = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPreview(file)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a href={`/api/files/${file.id}/download`} download>
                <Download className="w-4 h-4" />
              </a>
            </Button>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={files} pageSize={15} />;
}
