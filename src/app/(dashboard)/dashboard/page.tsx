"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TaskCard } from "@/components/tasks/task-card";
import { ChatPanel } from "@/components/layout/chat-panel";
import { MONTHS, type TrafficLight } from "@/lib/constants";
import { useRole } from "@/hooks/use-role";

// Mock data with traffic light system
const allTasks = [
  {
    id: "1",
    title: "Kunden-Rechnungen Q1",
    description: "Erstellung und Versand der Kundenrechnungen für das erste Quartal.",
    dueDate: "15. Feb",
    trafficLight: "green" as TrafficLight, // Hat Kommentare/Belege
    progress: 65,
    assignee: { name: "Thomas", initials: "TS" },
    commentCount: 3,
    fileCount: 2,
    period: "02",
    companyId: "c1",
    companyName: "Mustermann GmbH",
    amount: "12.450,00",
  },
  {
    id: "2",
    title: "Kontoauszüge abstimmen",
    description: "Monatliche Abstimmung der Bankkonten mit den Buchungen.",
    dueDate: "15. Feb",
    trafficLight: "yellow" as TrafficLight, // Nicht bearbeitet
    progress: 0,
    assignee: { name: "Anna", initials: "AM" },
    commentCount: 0,
    fileCount: 0,
    period: "02",
    companyId: "c1",
    companyName: "Mustermann GmbH",
    amount: "0,00",
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
  },
  {
    id: "4",
    title: "Spesenberichte prüfen",
    description: "Überprüfung und Genehmigung der eingereichten Spesenberichte.",
    dueDate: "15. Feb",
    trafficLight: "red" as TrafficLight, // Überfällig (>75 Tage)
    progress: 0,
    assignee: { name: "Thomas", initials: "TS" },
    commentCount: 0,
    fileCount: 0,
    period: "02",
    companyId: "c1",
    companyName: "Mustermann GmbH",
    amount: "1.234,56",
  },
  {
    id: "5",
    title: "Jahresabschluss vorbereiten",
    description: "Vorarbeiten für den Jahresabschluss zusammenstellen.",
    dueDate: "28. Feb",
    trafficLight: "green" as TrafficLight,
    progress: 55,
    assignee: { name: "Anna", initials: "AM" },
    commentCount: 2,
    fileCount: 1,
    period: "02",
    companyId: "c2",
    companyName: "Beispiel AG",
    amount: "0,00",
  },
  {
    id: "6",
    title: "Lohnabrechnung März",
    description: "Vorbereitung der monatlichen Lohnabrechnungen.",
    dueDate: "1. Mär",
    trafficLight: "green" as TrafficLight,
    progress: 80,
    assignee: { name: "Maria", initials: "MM" },
    commentCount: 1,
    fileCount: 3,
    period: "03",
    companyId: "c1",
    companyName: "Mustermann GmbH",
    amount: "8.500,00",
  },
];

// Simulated current user's company (for customer role)
const CURRENT_USER_COMPANY_ID = "c1";

function DashboardContent() {
  const searchParams = useSearchParams();
  const { isEmployee, isCustomer } = useRole();
  
  const currentMonth = new Date().getMonth();
  const currentMonthKey = MONTHS[currentMonth].key;
  const activeMonthKey = searchParams.get("month") || currentMonthKey;
  
  const activeMonth = MONTHS.find(m => m.key === activeMonthKey) || MONTHS[currentMonth];
  
  // Filter tasks: 
  // - By month
  // - Customer: only their company's tasks
  // - Employee: all tasks
  const filteredTasks = allTasks.filter(task => {
    // Month filter
    if (task.period !== activeMonthKey) return false;
    
    // Role-based filter: Customers only see their own tasks
    if (isCustomer && task.companyId !== CURRENT_USER_COMPANY_ID) {
      return false;
    }
    
    return true;
  });

  // Stats for overview
  const stats = {
    total: filteredTasks.length,
    yellow: filteredTasks.filter(t => t.trafficLight === "yellow").length,
    green: filteredTasks.filter(t => t.trafficLight === "green").length,
    red: filteredTasks.filter(t => t.trafficLight === "red").length,
  };

  return (
    <div className="flex h-full gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {activeMonth.full.toUpperCase()} AUFGABEN
          </h1>
          <p className="text-slate-500 mt-1">
            {isCustomer ? "Ihre offenen Aufgaben" : "Alle Mandantenaufgaben verwalten"}
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
            <span className="text-sm text-slate-600">Gesamt:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-sm text-yellow-700">Nicht bearbeitet:</span>
            <span className="font-semibold text-yellow-700">{stats.yellow}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-sm text-green-700">Bearbeitet:</span>
            <span className="font-semibold text-green-700">{stats.green}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-sm text-red-700">Überfällig:</span>
            <span className="font-semibold text-red-700">{stats.red}</span>
          </div>
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
              Keine Aufgaben für {activeMonth.full}
            </h3>
            <p className="text-slate-500 mt-1">
              Wählen Sie einen anderen Monat.
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
