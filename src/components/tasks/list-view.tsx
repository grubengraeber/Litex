"use client";

import { TaskCard } from "./task-card";
import type { Task } from "./types";

interface ListViewProps {
  tasks: Task[];
  showCompanyName?: boolean;
}

export function ListView({ tasks, showCompanyName }: ListViewProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          id={task.id}
          title={task.title}
          description={task.description}
          dueDate={task.dueDate}
          createdAt={task.createdAt}
          status={task.status}
          assignee={task.assignee}
          commentCount={task.commentCount}
          fileCount={task.fileCount}
          companyName={showCompanyName ? task.companyName : undefined}
          amount={task.amount !== "0,00" ? task.amount : undefined}
        />
      ))}
    </div>
  );
}
