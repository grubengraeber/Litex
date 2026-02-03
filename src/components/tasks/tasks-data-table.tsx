"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ColumnHeader } from "@/components/ui/column-filter";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Task {
  id: string;
  bookingText: string | null;
  amount: string | null;
  period: string | null;
  status: "open" | "submitted" | "completed";
  trafficLight: "green" | "yellow" | "red";
  createdAt: Date;
  company: {
    id: string;
    name: string;
  };
  commentCount?: number;
}

const statusLabels = {
  open: "Offen",
  submitted: "Eingereicht",
  completed: "Erledigt",
};

const statusVariants = {
  open: "default" as const,
  submitted: "secondary" as const,
  completed: "outline" as const,
};

const trafficLightColors = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

export function TasksDataTable({
  tasks,
  showCompanyColumn = false,
}: {
  tasks: Task[];
  showCompanyColumn?: boolean;
}) {
  const router = useRouter();

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "trafficLight",
      header: ({ column }) => (
        <ColumnHeader
          column={column}
          title="Ampel"
          filterType="select"
          filterOptions={[
            { label: "Neu (0-30 Tage)", value: "green" },
            { label: "Warnung (>30 Tage)", value: "yellow" },
            { label: "Dringend (>60 Tage)", value: "red" },
          ]}
        />
      ),
      cell: ({ row }) => {
        const trafficLight = row.getValue("trafficLight") as keyof typeof trafficLightColors;
        return (
          <div className="flex items-center">
            <span
              className={`w-3 h-3 rounded-full ${trafficLightColors[trafficLight]}`}
            />
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
            { label: "Offen", value: "open" },
            { label: "Eingereicht", value: "submitted" },
            { label: "Erledigt", value: "completed" },
          ]}
        />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusLabels;
        return (
          <Badge variant={statusVariants[status]}>
            {statusLabels[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "bookingText",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Buchungstext" filterType="text" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[400px] truncate">
          {row.getValue("bookingText") || "Keine Beschreibung"}
        </div>
      ),
    },
    ...(showCompanyColumn
      ? ([
          {
            accessorKey: "company.name",
            header: ({ column }) => (
              <ColumnHeader
                column={column}
                title="Mandant"
                filterType="text"
              />
            ),
            cell: ({ row }) => (
              <div className="font-medium">{row.original.company.name}</div>
            ),
          },
        ] as ColumnDef<Task>[])
      : []),
    {
      accessorKey: "period",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Periode" filterType="text" />
      ),
      cell: ({ row }) => row.getValue("period") || "-",
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Betrag" filterType="text" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue("amount") as string | null;
        return amount ? `€ ${amount}` : "-";
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Erstellt" filterType="none" />
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
      id: "comments",
      header: "Kommentare",
      cell: ({ row }) => {
        const count = row.original.commentCount || 0;
        return (
          <div className="text-center">
            <Badge variant="outline">{count}</Badge>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tasks}
      pageSize={20}
      onRowClick={(task) => router.push(`/tasks/${task.id}`)}
    />
  );
}
