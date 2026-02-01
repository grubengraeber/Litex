"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TaskCard } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MONTHS, FILTER_OPTIONS, type TrafficLight } from "@/lib/constants";
import { useRole } from "@/hooks/use-role";
import { Plus, Search, SlidersHorizontal } from "lucide-react";

// Mock data with traffic light system
const allTasks = [
  {
    id: "1",
    title: "Kunden-Rechnungen Q1",
    description: "Erstellung und Versand der Kundenrechnungen für das erste Quartal.",
    dueDate: "15. Feb",
    trafficLight: "green" as TrafficLight,
    progress: 65,
    assignee: { name: "Thomas", initials: "TS" },
    commentCount: 3,
    fileCount: 2,
    period: "02",
    companyId: "c1",
    companyName: "Mustermann GmbH",
    amount: "12.450,00",
    isCompleted: false,
  },
  {
    id: "2",
    title: "Kontoauszüge abstimmen",
    description: "Monatliche Abstimmung der Bankkonten mit den Buchungen.",
    dueDate: "15. Feb",
    trafficLight: "yellow" as TrafficLight,
    progress: 0,
    assignee: { name: "Anna", initials: "AM" },
    commentCount: 0,
    fileCount: 0,
    period: "02",
    companyId: "c1",
    companyName: "Mustermann GmbH",
    amount: "0,00",
    isCompleted: false,
  },
  {
    id: "3",
    title: "Steuerunterlagen vorbereiten",
    description: "Zusammenstellung aller relevanten Steuerunterlagen für die Abgabe.",
    dueDate: "15. Feb",
    trafficLight: "yellow" as TrafficLight,
    progress: 0,
    assignee: { name: "Maria", initials: "MM" },
    commentCount: 0,
    fileCount: 0,
    period: "02",
    companyId: "c2",
    companyName: "Beispiel AG",
    amount: "0,00",
    isCompleted: false,
  },
  {
    id: "4",
    title: "Spesenberichte prüfen",
    description: "Überprüfung und Genehmigung der eingereichten Spesenberichte.",
    dueDate: "15. Feb",
    trafficLight: "red" as TrafficLight,
    progress: 0,
    assignee: { name: "Thomas", initials: "TS" },
    commentCount: 0,
    fileCount: 0,
    period: "02",
    companyId: "c1",
    companyName: "Mustermann GmbH",
    amount: "1.234,56",
    isCompleted: false,
  },
  {
    id: "5",
    title: "Jahresabschluss 2024",
    description: "Abgeschlossener Jahresabschluss für das Geschäftsjahr 2024.",
    dueDate: "31. Jan",
    trafficLight: "green" as TrafficLight,
    progress: 100,
    assignee: { name: "Anna", initials: "AM" },
    commentCount: 8,
    fileCount: 5,
    period: "01",
    companyId: "c2",
    companyName: "Beispiel AG",
    amount: "0,00",
    isCompleted: true,
  },
  {
    id: "6",
    title: "USt-Voranmeldung Januar",
    description: "Monatliche Umsatzsteuer-Voranmeldung für Januar 2025.",
    dueDate: "10. Feb",
    trafficLight: "green" as TrafficLight,
    progress: 100,
    assignee: { name: "Maria", initials: "MM" },
    commentCount: 2,
    fileCount: 1,
    period: "01",
    companyId: "c1",
    companyName: "Mustermann GmbH",
    amount: "3.450,00",
    isCompleted: true,
  },
];

// Simulated current user's company
const CURRENT_USER_COMPANY_ID = "c1";

function getFilteredTasks(
  tasks: typeof allTasks, 
  filter: string, 
  month: string | null,
  isCustomer: boolean
) {
  let filtered = tasks;

  // Role filter: customers only see their own company's tasks
  if (isCustomer) {
    filtered = filtered.filter(t => t.companyId === CURRENT_USER_COMPANY_ID);
  }

  // Month filter
  if (month) {
    filtered = filtered.filter(t => t.period === month);
  }

  // Status/type filter based on traffic light
  switch (filter) {
    case "completed":
      filtered = filtered.filter(t => t.isCompleted);
      break;
    case "yellow":
      filtered = filtered.filter(t => t.trafficLight === "yellow" && !t.isCompleted);
      break;
    case "green":
      filtered = filtered.filter(t => t.trafficLight === "green" && !t.isCompleted);
      break;
    case "red":
      filtered = filtered.filter(t => t.trafficLight === "red");
      break;
    case "this-week":
      // Simplified: show non-completed, non-green tasks (need attention)
      filtered = filtered.filter(t => !t.isCompleted && t.trafficLight !== "green");
      break;
    case "all":
    default:
      // Show all non-completed by default
      filtered = filtered.filter(t => !t.isCompleted);
      break;
  }

  return filtered;
}

function TasksContent() {
  const searchParams = useSearchParams();
  const { isEmployee, isCustomer } = useRole();
  
  const filter = searchParams.get("filter") || "all";
  const month = searchParams.get("month");

  const filteredTasks = getFilteredTasks(allTasks, filter, month, isCustomer);
  
  const filterLabel = FILTER_OPTIONS.find(f => f.key === filter)?.label || "Alle";
  const monthLabel = month ? MONTHS.find(m => m.key === month)?.full : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isCustomer ? "Meine Aufgaben" : "Alle Aufgaben"}
          </h1>
          <p className="text-slate-500 mt-1">
            {filterLabel} 
            {monthLabel && ` • ${monthLabel}`}
            {` • ${filteredTasks.length} Aufgaben`}
          </p>
        </div>
        {isEmployee && (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Neue Aufgabe
          </Button>
        )}
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

      {/* Traffic Light Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-slate-600">Nicht bearbeitet</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-slate-600">Bearbeitet</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-600">Überfällig (&gt;75 Tage)</span>
        </div>
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
              trafficLight={task.trafficLight}
              progress={task.progress}
              assignee={task.assignee}
              commentCount={task.commentCount}
              fileCount={task.fileCount}
              companyName={isEmployee ? task.companyName : undefined}
              amount={task.amount !== "0,00" ? task.amount : undefined}
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
            Versuchen Sie einen anderen Filter.
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
