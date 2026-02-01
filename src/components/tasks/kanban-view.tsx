"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MessageCircle, Paperclip } from "lucide-react";
import { TASK_STATUS, TRAFFIC_LIGHT_CONFIG, calculateTrafficLight, type TaskStatus } from "@/lib/constants";
import type { Task } from "./types";
import Link from "next/link";

interface KanbanViewProps {
  tasks: Task[];
  showCompanyName?: boolean;
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "open", label: "Offen", color: "bg-slate-100" },
  { status: "submitted", label: "Eingereicht", color: "bg-blue-50" },
  { status: "completed", label: "Erledigt", color: "bg-green-50" },
];

interface SortableTaskCardProps {
  task: Task;
  showCompanyName?: boolean;
}

function SortableTaskCard({ task, showCompanyName }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const daysSinceCreation = Math.floor(
    (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const trafficLight = calculateTrafficLight(daysSinceCreation);
  const trafficConfig = TRAFFIC_LIGHT_CONFIG[trafficLight];
  const statusConfig = TASK_STATUS[task.status];

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/tasks/${task.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing bg-white">
          <CardHeader className="pb-2 px-3 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className={`w-2.5 h-2.5 rounded-full ${trafficConfig.color}`} 
                  title={`${trafficConfig.label}`} 
                />
                <Badge className={`text-xs ${statusConfig.color} border-0`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                {task.fileCount > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Paperclip className="w-3 h-3" />
                    <span>{task.fileCount}</span>
                  </div>
                )}
                {task.commentCount > 0 && (
                  <div className="flex items-center gap-0.5 ml-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{task.commentCount}</span>
                  </div>
                )}
              </div>
            </div>
            <h3 className="font-medium text-sm mt-1 line-clamp-2">{task.title}</h3>
            {showCompanyName && (
              <span className="text-xs text-blue-600">{task.companyName}</span>
            )}
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>{task.dueDate}</span>
              </div>
              <Avatar className="w-6 h-6">
                <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                  {task.assignee.initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function KanbanColumn({ 
  status, 
  label, 
  color, 
  tasks, 
  showCompanyName 
}: { 
  status: TaskStatus; 
  label: string; 
  color: string;
  tasks: Task[];
  showCompanyName?: boolean;
}) {
  const taskIds = tasks.map(t => t.id);

  return (
    <div className={`flex-1 min-w-[280px] ${color} rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-700">{label}</h3>
        <Badge variant="outline" className="text-xs">
          {tasks.length}
        </Badge>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[200px]">
          {tasks.map((task) => (
            <SortableTaskCard 
              key={task.id} 
              task={task} 
              showCompanyName={showCompanyName}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanView({ tasks, showCompanyName, onTaskStatusChange }: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = localTasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Find which column the task was dropped on
    const overTask = localTasks.find(t => t.id === over.id);
    if (overTask && overTask.status !== activeTask.status) {
      const newTasks = localTasks.map(t => 
        t.id === activeTask.id 
          ? { ...t, status: overTask.status }
          : t
      );
      setLocalTasks(newTasks);
      onTaskStatusChange?.(activeTask.id, overTask.status);
    }
  };

  const activeTask = activeId ? localTasks.find(t => t.id === activeId) : null;

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = localTasks.filter(t => t.status === col.status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  if (localTasks.length === 0) {
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            color={col.color}
            tasks={tasksByStatus[col.status]}
            showCompanyName={showCompanyName}
          />
        ))}
      </div>
      
      <DragOverlay>
        {activeTask ? (
          <Card className="shadow-lg cursor-grabbing w-[280px]">
            <CardHeader className="pb-2 px-3 pt-3">
              <h3 className="font-medium text-sm">{activeTask.title}</h3>
            </CardHeader>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
