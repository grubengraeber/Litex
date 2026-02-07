"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  MoreVertical,
  ExternalLink,
  MessageSquare,
  Edit,
} from "lucide-react";
import { TRAFFIC_LIGHT_CONFIG, TASK_STATUS } from "@/lib/constants";

interface Task {
  id: string;
  bookingText: string | null;
  bmdBookingId: string | null;
  amount: string | null;
  period: string | null;
  dueDate: string | null;
  status: "open" | "submitted" | "completed";
  trafficLight: "green" | "yellow" | "red";
  createdAt: Date;
  company: {
    id: string;
    name: string;
  };
  commentCount?: number;
}

interface TasksTableProps {
  tasks: Task[];
}

type SortField = "trafficLight" | "status" | "bookingText" | "company" | "period" | "amount" | "dueDate";
type SortDirection = "asc" | "desc";

export function TasksTable({ tasks }: TasksTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("trafficLight");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let compareResult = 0;

    switch (sortField) {
      case "trafficLight": {
        const order = { green: 0, yellow: 1, red: 2 };
        compareResult = order[a.trafficLight] - order[b.trafficLight];
        break;
      }
      case "status": {
        const order = { open: 0, submitted: 1, completed: 2 };
        compareResult = order[a.status] - order[b.status];
        break;
      }
      case "bookingText":
        compareResult = (a.bookingText || "").localeCompare(b.bookingText || "");
        break;
      case "company":
        compareResult = a.company.name.localeCompare(b.company.name);
        break;
      case "period":
        compareResult = (a.period || "").localeCompare(b.period || "");
        break;
      case "amount": {
        const amountA = parseFloat(a.amount || "0");
        const amountB = parseFloat(b.amount || "0");
        compareResult = amountA - amountB;
        break;
      }
      case "dueDate": {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        compareResult = dateA - dateB;
        break;
      }
    }

    return sortDirection === "asc" ? compareResult : -compareResult;
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground"
    >
      {children}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <SortButton field="trafficLight">Status</SortButton>
          </TableHead>
          <TableHead className="w-32">
            <SortButton field="status">Workflow</SortButton>
          </TableHead>
          <TableHead>
            <SortButton field="bookingText">Beschreibung</SortButton>
          </TableHead>
          <TableHead>
            <SortButton field="company">Mandant</SortButton>
          </TableHead>
          <TableHead className="w-24">
            <SortButton field="period">Periode</SortButton>
          </TableHead>
          <TableHead className="w-24 text-right">
            <SortButton field="amount">Betrag</SortButton>
          </TableHead>
          <TableHead className="w-28">
            <SortButton field="dueDate">Fälligkeit</SortButton>
          </TableHead>
          <TableHead className="w-16 text-right">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTasks.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              Keine Aufgaben gefunden
            </TableCell>
          </TableRow>
        ) : (
          sortedTasks.map((task) => {
            const trafficConfig = TRAFFIC_LIGHT_CONFIG[task.trafficLight];
            const statusConfig = TASK_STATUS[task.status];

            return (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted"
                onClick={() => router.push(`/tasks/${task.id}`)}
              >
                <TableCell>
                  <span
                    className={`w-3 h-3 rounded-full block ${trafficConfig.color}`}
                    title={trafficConfig.label}
                  />
                </TableCell>
                <TableCell>
                  <Badge className={`${statusConfig.color} border-0`}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium text-sm">
                        {task.bookingText || "Keine Beschreibung"}
                      </div>
                      {task.bmdBookingId && (
                        <div className="text-xs text-muted-foreground">
                          BMD: {task.bmdBookingId}
                        </div>
                      )}
                    </div>
                    {task.commentCount !== undefined && task.commentCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {task.commentCount}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{task.company.name}</TableCell>
                <TableCell className="text-sm">{task.period || "-"}</TableCell>
                <TableCell className="text-sm text-right font-medium">
                  {task.amount ? `€ ${task.amount}` : "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "-"}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/tasks/${task.id}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Öffnen
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/chats/${task.id}`}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/tasks/${task.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Bearbeiten
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
