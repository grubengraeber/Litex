"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TaskCard, TaskStatus } from "@/components/tasks/task-card";
import { ChatPanel } from "@/components/layout/chat-panel";
import { MONTHS } from "@/lib/constants";

// Mock data - deutsche Texte
const tasks = [
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
  },
  {
    id: "5",
    title: "Jahresabschluss vorbereiten",
    description: "Vorarbeiten für den Jahresabschluss zusammenstellen.",
    dueDate: "28. Feb",
    status: "pending-review" as TaskStatus,
    progress: 55,
    assignee: { name: "Anna", initials: "AM" },
    commentCount: 2,
    period: "02",
  },
  {
    id: "6",
    title: "Lohnabrechnung März",
    description: "Vorbereitung der monatlichen Lohnabrechnungen.",
    dueDate: "1. Mär",
    status: "on-track" as TaskStatus,
    progress: 80,
    assignee: { name: "Maria", initials: "MM" },
    commentCount: 0,
    period: "03",
  },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const currentMonth = new Date().getMonth();
  const currentMonthKey = MONTHS[currentMonth].key;
  const activeMonthKey = searchParams.get("month") || currentMonthKey;
  
  const activeMonth = MONTHS.find(m => m.key === activeMonthKey) || MONTHS[currentMonth];
  
  // Filter tasks by month
  const filteredTasks = tasks.filter(task => task.period === activeMonthKey);

  return (
    <div className="flex h-full gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {activeMonth.full.toUpperCase()} AUFGABEN
          </h1>
          <p className="text-slate-500 mt-1">
            Verwalten und verfolgen Sie Ihre monatlichen Aufgaben
          </p>
        </div>

        {/* Task Grid */}
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              Keine Aufgaben für {activeMonth.full}
            </h3>
            <p className="text-slate-500 mt-1">
              Wählen Sie einen anderen Monat oder erstellen Sie neue Aufgaben.
            </p>
          </div>
        )}
      </div>

      {/* Chat Panel */}
      <ChatPanel title="TEAM CHAT" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Laden...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
