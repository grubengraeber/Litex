"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { TaskCard, sortTasksByPriority } from "@/components/tasks/task-card";
import { ChatPanel } from "@/components/layout/chat-panel";
import { Button } from "@/components/ui/button";
import { MONTHS, calculateTrafficLight, type TaskStatus } from "@/lib/constants";
import { useRole } from "@/hooks/use-role";
import { Building2, ChevronDown } from "lucide-react";

// Mock data with proper dates for traffic light calculation
const allTasks = [
  {
    id: "1",
    title: "Kunden-Rechnungen Q1",
    description: "Erstellung und Versand der Kundenrechnungen für das erste Quartal.",
    dueDate: "15. Feb",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago - GREEN
    status: "open" as TaskStatus,
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
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago - YELLOW
    status: "open" as TaskStatus,
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
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago - GREEN
    status: "submitted" as TaskStatus,
    assignee: { name: "Maria", initials: "MM" },
    commentCount: 2,
    fileCount: 1,
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
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), // 70 days ago - RED
    status: "open" as TaskStatus,
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
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago - YELLOW
    status: "submitted" as TaskStatus,
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
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago - GREEN
    status: "completed" as TaskStatus,
    assignee: { name: "Maria", initials: "MM" },
    commentCount: 1,
    fileCount: 3,
    period: "03",
    companyId: "c1",
    companyName: "Mustermann GmbH",
    amount: "8.500,00",
  },
];

// Mock companies for dropdown
const companies = [
  { id: "all", name: "Alle Mandanten" },
  { id: "c1", name: "Mustermann GmbH" },
  { id: "c2", name: "Beispiel AG" },
  { id: "c3", name: "Test & Partner KG" },
];

// Simulated current user's company (for customer role)
const CURRENT_USER_COMPANY_ID = "c1";

function DashboardContent() {
  const searchParams = useSearchParams();
  const { isEmployee, isCustomer } = useRole();
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  
  const currentMonth = new Date().getMonth();
  const currentMonthKey = MONTHS[currentMonth].key;
  const activeMonthKey = searchParams.get("month") || currentMonthKey;
  
  const activeMonth = MONTHS.find(m => m.key === activeMonthKey) || MONTHS[currentMonth];
  
  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    const tasks = allTasks.filter(task => {
      // Month filter
      if (task.period !== activeMonthKey) return false;
      
      // Role-based filter: Customers only see their own tasks
      if (isCustomer && task.companyId !== CURRENT_USER_COMPANY_ID) {
        return false;
      }
      
      // Company filter for employees
      if (isEmployee && selectedCompany !== "all" && task.companyId !== selectedCompany) {
        return false;
      }
      
      // Don't show completed in main view
      if (task.status === "completed") return false;
      
      return true;
    });

    // Sort by priority (red first = oldest first)
    return sortTasksByPriority(tasks);
  }, [activeMonthKey, isCustomer, isEmployee, selectedCompany]);

  // Stats for overview
  const stats = useMemo(() => {
    const green = filteredTasks.filter(t => {
      const days = Math.floor((Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return calculateTrafficLight(days) === "green";
    }).length;
    const yellow = filteredTasks.filter(t => {
      const days = Math.floor((Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return calculateTrafficLight(days) === "yellow";
    }).length;
    const red = filteredTasks.filter(t => {
      const days = Math.floor((Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return calculateTrafficLight(days) === "red";
    }).length;

    return { total: filteredTasks.length, green, yellow, red };
  }, [filteredTasks]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0 order-2 lg:order-1">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
              {activeMonth.full.toUpperCase()} AUFGABEN
            </h1>
            <p className="text-sm lg:text-base text-slate-500 mt-1">
              {isCustomer ? "Ihre offenen Aufgaben" : "Alle Mandantenaufgaben verwalten"}
            </p>
          </div>

          {/* Company Filter Dropdown (only for employees) */}
          {isEmployee && (
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="min-w-48"
              >
                <Building2 className="w-4 h-4 mr-2" />
                {companies.find(c => c.id === selectedCompany)?.name}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              
              {showCompanyDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-10">
                  {companies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => {
                        setSelectedCompany(company.id);
                        setShowCompanyDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                        selectedCompany === company.id ? "bg-blue-50 text-blue-700" : ""
                      }`}
                    >
                      {company.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Bar - Ampel Legende */}
        <div className="flex flex-wrap gap-2 lg:gap-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
            <span className="text-xs lg:text-sm text-slate-600">Gesamt:</span>
            <span className="font-semibold text-sm lg:text-base">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg" title="Neu (0-30 Tage)">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs lg:text-sm text-green-700">Neu:</span>
            <span className="font-semibold text-sm lg:text-base text-green-700">{stats.green}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg" title="Warnung (>30 Tage)">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-xs lg:text-sm text-yellow-700">&gt;30d:</span>
            <span className="font-semibold text-sm lg:text-base text-yellow-700">{stats.yellow}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg" title="Dringend (>60 Tage)">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs lg:text-sm text-red-700">&gt;60d:</span>
            <span className="font-semibold text-sm lg:text-base text-red-700">{stats.red}</span>
          </div>
        </div>

        {/* Task Grid - sorted by priority (red first) */}
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => (
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
              Keine offenen Aufgaben für {activeMonth.full}
            </h3>
            <p className="text-slate-500 mt-1">
              {isEmployee && selectedCompany !== "all" 
                ? "Wählen Sie einen anderen Mandanten oder Monat."
                : "Wählen Sie einen anderen Monat."
              }
            </p>
          </div>
        )}
      </div>

      {/* Chat Panel - Hidden on mobile, shown on lg+ */}
      <div className="hidden lg:flex order-2 flex-shrink-0 h-full">
        <ChatPanel title="TEAM CHAT" collapsible defaultCollapsed={false} />
      </div>
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
