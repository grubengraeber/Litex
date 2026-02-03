"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TASK_STATUS,
  TRAFFIC_LIGHT_CONFIG,
  calculateTrafficLight,
  type TaskStatus,
} from "@/lib/constants";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Paperclip,
  ExternalLink,
} from "lucide-react";

export interface TableTask {
  id: string;
  title: string;
  createdAt: Date;
  status: TaskStatus;
  companyName?: string;
  amount?: string;
  period?: string;
  commentCount: number;
  fileCount: number;
}

type SortField = "title" | "status" | "createdAt" | "amount" | "companyName";
type SortDirection = "asc" | "desc";

interface TaskTableProps {
  tasks: TableTask[];
  showCompanyName?: boolean;
}

export function TaskTable({ tasks, showCompanyName = false }: TaskTableProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          const statusOrder = { open: 0, submitted: 1, completed: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "createdAt":
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case "amount":
          const amountA = parseFloat(a.amount?.replace(",", ".") || "0");
          const amountB = parseFloat(b.amount?.replace(",", ".") || "0");
          comparison = amountA - amountB;
          break;
        case "companyName":
          comparison = (a.companyName || "").localeCompare(b.companyName || "");
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [tasks, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                <button
                  onClick={() => handleSort("title")}
                  className="flex items-center hover:text-slate-900"
                >
                  Beschreibung
                  <SortIcon field="title" />
                </button>
              </th>
              {showCompanyName && (
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  <button
                    onClick={() => handleSort("companyName")}
                    className="flex items-center hover:text-slate-900"
                  >
                    Mandant
                    <SortIcon field="companyName" />
                  </button>
                </th>
              )}
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center hover:text-slate-900"
                >
                  Status
                  <SortIcon field="status" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center hover:text-slate-900"
                >
                  Alter
                  <SortIcon field="createdAt" />
                </button>
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">
                <button
                  onClick={() => handleSort("amount")}
                  className="flex items-center justify-end hover:text-slate-900 ml-auto"
                >
                  Betrag
                  <SortIcon field="amount" />
                </button>
              </th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">
                Anhänge
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">
                Aktion
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedTasks.map((task) => {
              const daysSinceCreation = Math.floor(
                (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
              );
              const trafficLight = calculateTrafficLight(daysSinceCreation);
              const trafficConfig = TRAFFIC_LIGHT_CONFIG[trafficLight];
              const statusConfig = TASK_STATUS[task.status];

              return (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${trafficConfig.color}`}
                        title={trafficConfig.label}
                      />
                      <span className="font-medium text-slate-900 truncate max-w-[250px]">
                        {task.title}
                      </span>
                    </div>
                  </td>
                  {showCompanyName && (
                    <td className="px-4 py-3">
                      <span className="text-blue-600 truncate max-w-[150px] block">
                        {task.companyName || "—"}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${statusConfig.color} border-0`}>
                      {statusConfig.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${trafficConfig.text}`}>
                      {daysSinceCreation === 0
                        ? "Heute"
                        : `${daysSinceCreation} Tage`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium">
                      {task.amount && task.amount !== "0,00"
                        ? `€ ${task.amount}`
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3 text-slate-500">
                      {task.fileCount > 0 && (
                        <span className="flex items-center gap-1" title="Dateien">
                          <Paperclip className="w-4 h-4" />
                          {task.fileCount}
                        </span>
                      )}
                      {task.commentCount > 0 && (
                        <span className="flex items-center gap-1" title="Kommentare">
                          <MessageCircle className="w-4 h-4" />
                          {task.commentCount}
                        </span>
                      )}
                      {task.fileCount === 0 && task.commentCount === 0 && "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/tasks/${task.id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedTasks.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          Keine Aufgaben gefunden.
        </div>
      )}
    </div>
  );
}
