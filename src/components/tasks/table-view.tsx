"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TASK_STATUS, TRAFFIC_LIGHT_CONFIG, calculateTrafficLight } from "@/lib/constants";
import type { Task } from "./types";

interface TableViewProps {
  tasks: Task[];
  showCompanyName?: boolean;
}

type SortField = "title" | "status" | "dueDate" | "createdAt" | "companyName" | "amount";
type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField;
  direction: SortDirection;
}

export function TableView({ tasks, showCompanyName }: TableViewProps) {
  const [sort, setSort] = useState<SortState>({ field: "createdAt", direction: "desc" });

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;
      
      switch (sort.field) {
        case "title":
          comparison = a.title.localeCompare(b.title, "de");
          break;
        case "status":
          const statusOrder = { open: 0, submitted: 1, completed: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "dueDate":
          comparison = a.dueDate.localeCompare(b.dueDate, "de");
          break;
        case "createdAt":
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case "companyName":
          comparison = a.companyName.localeCompare(b.companyName, "de");
          break;
        case "amount":
          const amountA = parseFloat(a.amount.replace(".", "").replace(",", ".")) || 0;
          const amountB = parseFloat(b.amount.replace(".", "").replace(",", ".")) || 0;
          comparison = amountA - amountB;
          break;
      }

      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [tasks, sort]);

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 hover:bg-transparent font-medium"
      onClick={() => handleSort(field)}
    >
      {children}
      {sort.field === field ? (
        sort.direction === "asc" ? (
          <ArrowUp className="ml-1 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-1 h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
      )}
    </Button>
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-medium text-slate-700">
          Keine Aufgaben gefunden
        </h3>
        <p className="text-slate-500 mt-1">
          Versuchen Sie einen anderen Filter.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <SortButton field="title">Aufgabe</SortButton>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <SortButton field="status">Status</SortButton>
            </th>
            {showCompanyName && (
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                <SortButton field="companyName">Mandant</SortButton>
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Ampel
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <SortButton field="dueDate">Fällig</SortButton>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <SortButton field="amount">Betrag</SortButton>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Zugewiesen
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <SortButton field="createdAt">Alter</SortButton>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedTasks.map((task) => {
            const daysSinceCreation = Math.floor(
              (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            const trafficLight = calculateTrafficLight(daysSinceCreation);
            const trafficConfig = TRAFFIC_LIGHT_CONFIG[trafficLight];
            const statusConfig = TASK_STATUS[task.status];

            return (
              <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/tasks/${task.id}`} className="hover:text-blue-600">
                    <div className="font-medium text-slate-900 line-clamp-1">
                      {task.title}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1">
                      {task.description}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs ${statusConfig.color} border-0`}>
                    {statusConfig.label}
                  </Badge>
                </td>
                {showCompanyName && (
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {task.companyName}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span 
                      className={`w-3 h-3 rounded-full ${trafficConfig.color}`}
                      title={trafficConfig.label}
                    />
                    <span className={`text-xs ${trafficConfig.text}`}>
                      {trafficConfig.label}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {task.dueDate}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {task.amount !== "0,00" ? `€ ${task.amount}` : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {task.assignee.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-600">{task.assignee.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {daysSinceCreation} Tage
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
