"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TaskCard, TaskStatus } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MONTHS, FILTER_OPTIONS } from "@/lib/constants";
import { Plus, Search, SlidersHorizontal } from "lucide-react";

// Mock data - erweitert
const allTasks = [
  {
    id: "1",
    title: "Kunden-Rechnungen Q1",
    description: "Erstellung und Versand der Kundenrechnungen für das erste Quartal.",
    dueDate: "15. Feb",
    status: "on-track" as TaskStatus,
    progress: 65,
    assignee: { name: "Thomas", initials: "TS" },
    commentCount: 3,
    period: "02",
    isCompleted: false,
    isPriority: true,
  },
  {
    id: "2",
    title: "Kontoauszüge abstimmen",
    description: "Monatliche Abstimmung der Bankkonten mit den Buchungen.",
    dueDate: "15. Feb",
    status: "pending-review" as TaskStatus,
    progress: 45,
    assignee: { name: "Anna", initials: "AM" },
    commentCount: 1,
    period: "02",
    isCompleted: false,
    isPriority: false,
  },
  {
    id: "3",
    title: "Steuerunterlagen vorbereiten",
    description: "Zusammenstellung aller relevanten Steuerunterlagen für die Abgabe.",
    dueDate: "15. Feb",
    status: "pending-review" as TaskStatus,
    progress: 30,
    assignee: { name: "Maria", initials: "MM" },
    commentCount: 0,
    period: "02",
    isCompleted: false,
    isPriority: true,
  },
  {
    id: "4",
    title: "Spesenberichte prüfen",
    description: "Überprüfung und Genehmigung der eingereichten Spesenberichte.",
    dueDate: "15. Feb",
    status: "overdue" as TaskStatus,
    progress: 20,
    assignee: { name: "Thomas", initials: "TS" },
    commentCount: 5,
    period: "02",
    isCompleted: false,
    isPriority: true,
  },
  {
    id: "5",
    title: "Jahresabschluss 2024",
    description: "Abgeschlossener Jahresabschluss für das Geschäftsjahr 2024.",
    dueDate: "31. Jan",
    status: "on-track" as TaskStatus,
    progress: 100,
    assignee: { name: "Anna", initials: "AM" },
    commentCount: 8,
    period: "01",
    isCompleted: true,
    isPriority: false,
  },
  {
    id: "6",
    title: "USt-Voranmeldung Januar",
    description: "Monatliche Umsatzsteuer-Voranmeldung für Januar 2025.",
    dueDate: "10. Feb",
    status: "on-track" as TaskStatus,
    progress: 100,
    assignee: { name: "Maria", initials: "MM" },
    commentCount: 2,
    period: "01",
    isCompleted: true,
    isPriority: false,
  },
];

function getFilteredTasks(tasks: typeof allTasks, filter: string, month: string | null) {
  let filtered = tasks;

  // Month filter
  if (month) {
    filtered = filtered.filter(t => t.period === month);
  }

  // Status/type filter
  switch (filter) {
    case "completed":
      filtered = filtered.filter(t => t.isCompleted);
      break;
    case "priorities":
      filtered = filtered.filter(t => t.isPriority && !t.isCompleted);
      break;
    case "this-week":
      // Simplified: show non-completed tasks
      filtered = filtered.filter(t => !t.isCompleted);
      break;
    case "archived":
      // Mock: no archived tasks
      filtered = [];
      break;
    case "all":
    default:
      // Show all (optionally excluding completed)
      break;
  }

  return filtered;
}

function TasksContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const month = searchParams.get("month");

  const filteredTasks = getFilteredTasks(allTasks, filter, month);
  
  const filterLabel = FILTER_OPTIONS.find(f => f.key === filter)?.label || "Alle";
  const monthLabel = month ? MONTHS.find(m => m.key === month)?.full : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aufgaben</h1>
          <p className="text-slate-500 mt-1">
            {filterLabel} 
            {monthLabel && ` • ${monthLabel}`}
            {` • ${filteredTasks.length} Aufgaben`}
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neue Aufgabe
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Aufgaben durchsuchen..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Task Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              description={task.description}
              dueDate={task.dueDate}
              status={task.status}
              progress={task.progress}
              assignee={task.assignee}
              commentCount={task.commentCount}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-medium text-slate-700">
            Keine Aufgaben gefunden
          </h3>
          <p className="text-slate-500 mt-1">
            Versuchen Sie einen anderen Filter oder erstellen Sie eine neue Aufgabe.
          </p>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Laden...</div>}>
      <TasksContent />
    </Suspense>
  );
}
