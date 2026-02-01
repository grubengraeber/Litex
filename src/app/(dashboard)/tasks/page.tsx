"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  TaskCard, 
  sortTasksByPriority, 
  ViewSwitcher, 
  ListView, 
  KanbanView, 
  TableView,
  type ViewType,
  type Task,
} from "@/components/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MONTHS, FILTER_OPTIONS, calculateTrafficLight, type TaskStatus } from "@/lib/constants";
import { useRole } from "@/hooks/use-role";
import { Plus, Search, SlidersHorizontal, Building2, ChevronDown } from "lucide-react";

// localStorage key for persisting view preference
const VIEW_STORAGE_KEY = "litex-tasks-view";

// Mock data with proper dates
const allTasks: Task[] = [
  {
    id: "1",
    title: "Kunden-Rechnungen Q1",
    description: "Erstellung und Versand der Kundenrechnungen für das erste Quartal.",
    dueDate: "15. Feb",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days - GREEN
    status: "open" as TaskStatus,
    assignee: { name: "Thomas", avatar: undefined, initials: "TS" },
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
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days - YELLOW
    status: "open" as TaskStatus,
    assignee: { name: "Anna", avatar: undefined, initials: "AM" },
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
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days - GREEN
    status: "submitted" as TaskStatus,
    assignee: { name: "Maria", avatar: undefined, initials: "MM" },
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
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), // 70 days - RED
    status: "open" as TaskStatus,
    assignee: { name: "Thomas", avatar: undefined, initials: "TS" },
    commentCount: 0,
    fileCount: 0,
    period: "02",
    companyId: "c1",
    companyName: "Mustermann GmbH",
    amount: "1.234,56",
  },
  {
    id: "5",
    title: "Jahresabschluss 2024",
    description: "Abgeschlossener Jahresabschluss für das Geschäftsjahr 2024.",
    dueDate: "31. Jan",
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
    status: "completed" as TaskStatus,
    assignee: { name: "Anna", avatar: undefined, initials: "AM" },
    commentCount: 8,
    fileCount: 5,
    period: "01",
    companyId: "c2",
    companyName: "Beispiel AG",
    amount: "0,00",
  },
  {
    id: "6",
    title: "USt-Voranmeldung Januar",
    description: "Monatliche Umsatzsteuer-Voranmeldung für Januar 2025.",
    dueDate: "10. Feb",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days - GREEN
    status: "completed" as TaskStatus,
    assignee: { name: "Maria", avatar: undefined, initials: "MM" },
    commentCount: 2,
    fileCount: 1,
    period: "01",
    companyId: "c1",
    companyName: "Mustermann GmbH",
    amount: "3.450,00",
  },
];

// Mock companies
const companies = [
  { id: "all", name: "Alle Mandanten" },
  { id: "c1", name: "Mustermann GmbH" },
  { id: "c2", name: "Beispiel AG" },
];

const CURRENT_USER_COMPANY_ID = "c1";

function TasksContent() {
  const searchParams = useSearchParams();
  const { isEmployee, isCustomer } = useRole();
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>("list");
  
  // Load persisted view preference
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY) as ViewType | null;
    if (savedView && ["list", "kanban", "table"].includes(savedView)) {
      setCurrentView(savedView);
    }
  }, []);

  // Save view preference
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  };
  
  const filter = searchParams.get("filter") || "all";
  const month = searchParams.get("month");

  const filteredTasks = useMemo(() => {
    const tasks = allTasks.filter(task => {
      // Role filter
      if (isCustomer && task.companyId !== CURRENT_USER_COMPANY_ID) {
        return false;
      }

      // Company filter for employees
      if (isEmployee && selectedCompany !== "all" && task.companyId !== selectedCompany) {
        return false;
      }

      // Month filter
      if (month && task.period !== month) {
        return false;
      }

      // Status filter
      const days = Math.floor((Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const trafficLight = calculateTrafficLight(days);

      switch (filter) {
        case "open":
          return task.status === "open";
        case "submitted":
          return task.status === "submitted";
        case "completed":
          return task.status === "completed";
        case "red":
          return trafficLight === "red" && task.status !== "completed";
        case "yellow":
          return trafficLight === "yellow" && task.status !== "completed";
        case "all":
        default:
          return true;
      }
    });

    // Sort by priority (red/oldest first) - only for list view
    return sortTasksByPriority(tasks);
  }, [filter, month, isCustomer, isEmployee, selectedCompany]);

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    // TODO: API call to update task status
    console.log(`Task ${taskId} status changed to ${newStatus}`);
  };
  
  const filterLabel = FILTER_OPTIONS.find(f => f.key === filter)?.label || "Alle";
  const monthLabel = month ? MONTHS.find(m => m.key === month)?.full : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isCustomer ? "Meine Aufgaben" : "Alle Aufgaben"}
          </h1>
          <p className="text-slate-500 mt-1">
            {filterLabel} 
            {monthLabel && ` • ${monthLabel}`}
            {` • ${filteredTasks.length} Aufgaben`}
            {currentView === "list" && (
              <span className="text-xs ml-2">(Sortiert nach Dringlichkeit)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Switcher */}
          <ViewSwitcher currentView={currentView} onViewChange={handleViewChange} />

          {/* Company Filter for employees */}
          {isEmployee && (
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              >
                <Building2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">
                  {companies.find(c => c.id === selectedCompany)?.name}
                </span>
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
          
          {isEmployee && (
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Neue Aufgabe</span>
            </Button>
          )}
        </div>
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

      {/* Traffic Light Legend - only show for list and table views */}
      {(currentView === "list" || currentView === "table") && (
        <div className="flex items-center gap-4 md:gap-6 text-sm bg-slate-50 p-3 rounded-lg flex-wrap">
          <span className="font-medium text-slate-600">Ampel-System:</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-600">Neu (0-30 Tage)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-slate-600">Warnung (&gt;30 Tage)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-600">Dringend (&gt;60 Tage)</span>
          </div>
        </div>
      )}

      {/* Task Views */}
      {currentView === "list" && (
        <ListView tasks={filteredTasks} showCompanyName={isEmployee} />
      )}
      
      {currentView === "kanban" && (
        <KanbanView 
          tasks={filteredTasks} 
          showCompanyName={isEmployee}
          onTaskStatusChange={handleTaskStatusChange}
        />
      )}
      
      {currentView === "table" && (
        <TableView tasks={filteredTasks} showCompanyName={isEmployee} />
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
