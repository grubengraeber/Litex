"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TASK_STATUS, 
  TRAFFIC_LIGHT_CONFIG, 
  calculateTrafficLight,
  type TaskStatus 
} from "@/lib/constants";
import { MessageCircle, Paperclip } from "lucide-react";

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  status: TaskStatus;
  companyName?: string;
  amount?: string;
  commentCount: number;
  fileCount: number;
}

interface TaskKanbanProps {
  tasks: KanbanTask[];
  showCompanyName?: boolean;
}

export function TaskKanban({ tasks, showCompanyName = false }: TaskKanbanProps) {
  const columns: { key: TaskStatus; label: string; color: string }[] = [
    { key: "open", label: "Offen", color: "bg-slate-100" },
    { key: "submitted", label: "Eingereicht", color: "bg-blue-100" },
    { key: "completed", label: "Erledigt", color: "bg-green-100" },
  ];

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((task) => task.status === status);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.key);
        
        return (
          <div
            key={column.key}
            className="flex-1 min-w-[280px] max-w-[400px]"
          >
            {/* Column Header */}
            <div className={`${column.color} rounded-t-lg px-4 py-3`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  {column.label}
                </h3>
                <Badge variant="secondary" className="bg-white/50">
                  {columnTasks.length}
                </Badge>
              </div>
            </div>

            {/* Column Content */}
            <div className="bg-slate-50 rounded-b-lg p-3 space-y-3 min-h-[400px]">
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    showCompanyName={showCompanyName}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                  Keine Aufgaben
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface KanbanCardProps {
  task: KanbanTask;
  showCompanyName?: boolean;
}

function KanbanCard({ task, showCompanyName }: KanbanCardProps) {
  const daysSinceCreation = Math.floor(
    (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const trafficLight = calculateTrafficLight(daysSinceCreation);
  const trafficConfig = TRAFFIC_LIGHT_CONFIG[trafficLight];

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${trafficConfig.color}`}
              title={trafficConfig.label}
            />
            {showCompanyName && task.companyName && (
              <span className="text-xs text-blue-600 font-medium truncate">
                {task.companyName}
              </span>
            )}
          </div>

          <h4 className="font-medium text-sm text-slate-900 line-clamp-2 mb-2">
            {task.title}
          </h4>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-3">
              {task.fileCount > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {task.fileCount}
                </span>
              )}
              {task.commentCount > 0 && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {task.commentCount}
                </span>
              )}
            </div>
            {task.amount && task.amount !== "0,00" && (
              <span className="font-medium">€ {task.amount}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
