"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TaskCard, sortTasksByPriority } from "@/components/tasks/task-card";
import { TaskKanban, type KanbanTask } from "@/components/tasks/task-kanban";
import { TaskTable, type TableTask } from "@/components/tasks/task-table";
import { ViewToggle, type ViewMode } from "@/components/tasks/view-toggle";
import { ChatPanel } from "@/components/layout/chat-panel";
import { Button } from "@/components/ui/button";
import { MONTHS, type TaskStatus } from "@/lib/constants";
import { useRole } from "@/hooks/use-role";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Building2, ChevronDown } from "lucide-react";
import { fetchTasks, fetchCompanies } from "../actions";

interface Task {
  id: string;
  bookingText: string | null;
  amount: string | null;
  period: string | null;
  status: "open" | "submitted" | "completed";
  trafficLight: "green" | "yellow" | "red";
  createdAt: Date;
  company: {
    id: string;
    name: string;
  };
  comments: Array<{ id: string }>;
  files: Array<{ id: string }>;
}

interface Company {
  id: string;
  name: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const { isEmployee, isCustomer } = useRole();
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, green: 0, yellow: 0, red: 0 });
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    "litex-dashboard-view",
    "list"
  );

  const currentMonth = new Date().getMonth();
  const currentMonthKey = MONTHS[currentMonth].key;
  const activeMonthKey = searchParams.get("month") || currentMonthKey;

  const activeMonth =
    MONTHS.find((m) => m.key === activeMonthKey) || MONTHS[currentMonth];

  // Fetch companies on mount (for employees)
  useEffect(() => {
    if (isEmployee) {
      fetchCompanies().then((data) => {
        setCompanies([{ id: "all", name: "Alle Mandanten" }, ...data]);
      });
    }
  }, [isEmployee]);

  // Fetch tasks when filters change
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const filters = {
          period: activeMonthKey,
          companyId: selectedCompany !== "all" ? selectedCompany : undefined,
        };

        const fetchedTasks = await fetchTasks(filters);

        setTasks(fetchedTasks as unknown as Task[]);

        // Calculate stats for open tasks only
        const openTasks = fetchedTasks.filter((t) => t.status !== "completed");
        setStats({
          total: openTasks.length,
          green: openTasks.filter((t) => t.trafficLight === "green").length,
          yellow: openTasks.filter((t) => t.trafficLight === "yellow").length,
          red: openTasks.filter((t) => t.trafficLight === "red").length,
        });
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [activeMonthKey, selectedCompany]);

  // Transform tasks for different views
  const transformedTasks = useMemo(() => {
    // For kanban/table: include all tasks
    // For list: only open and submitted (sorted by priority)
    const allTasks = tasks.map((task) => ({
      id: task.id,
      title: task.bookingText || "Keine Beschreibung",
      description: task.bookingText || "",
      dueDate: "Offen",
      createdAt: new Date(task.createdAt),
      status: task.status as TaskStatus,
      assignee: { name: "Team", initials: "LX" },
      commentCount: task.comments.length,
      fileCount: task.files.length,
      period: task.period || "",
      companyId: task.company.id,
      companyName: task.company.name,
      amount: task.amount || "0,00",
    }));

    if (viewMode === "list") {
      // Only show open and submitted tasks (not completed)
      const openTasks = allTasks.filter((task) => task.status !== "completed");
      return sortTasksByPriority(openTasks);
    }

    return allTasks;
  }, [tasks, viewMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Lade Aufgaben...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0 order-2 lg:order-1">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 break-words">
              {activeMonth.full.toUpperCase()} AUFGABEN
            </h1>
            <p className="text-sm lg:text-base text-slate-500 mt-1">
              {isCustomer
                ? "Ihre offenen Aufgaben"
                : "Alle Mandantenaufgaben verwalten"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* View Toggle */}
            <ViewToggle value={viewMode} onChange={setViewMode} />

            {/* Company Filter Dropdown (only for employees) */}
            {isEmployee && (
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  className="w-full sm:min-w-48 justify-between"
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {companies.find((c) => c.id === selectedCompany)?.name ||
                        "Alle Mandanten"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>

                {showCompanyDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-10">
                    {companies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => {
                          setSelectedCompany(company.id);
                          setShowCompanyDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                          selectedCompany === company.id
                            ? "bg-blue-50 text-blue-700"
                            : ""
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
        </div>

        {/* Stats Bar - Ampel Legende */}
        <div className="flex flex-wrap gap-2 lg:gap-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
            <span className="text-xs lg:text-sm text-slate-600">Gesamt:</span>
            <span className="font-semibold text-sm lg:text-base">
              {stats.total}
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg"
            title="Neu (0-30 Tage)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs lg:text-sm text-green-700">Neu:</span>
            <span className="font-semibold text-sm lg:text-base text-green-700">
              {stats.green}
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg"
            title="Warnung (>30 Tage)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-xs lg:text-sm text-yellow-700">&gt;30d:</span>
            <span className="font-semibold text-sm lg:text-base text-yellow-700">
              {stats.yellow}
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg"
            title="Dringend (>60 Tage)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs lg:text-sm text-red-700">&gt;60d:</span>
            <span className="font-semibold text-sm lg:text-base text-red-700">
              {stats.red}
            </span>
          </div>
        </div>

        {/* Task Views */}
        {transformedTasks.length > 0 ? (
          <>
            {viewMode === "list" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transformedTasks.map((task) => (
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
            )}

            {viewMode === "kanban" && (
              <TaskKanban
                tasks={transformedTasks as KanbanTask[]}
                showCompanyName={isEmployee}
              />
            )}

            {viewMode === "table" && (
              <TaskTable
                tasks={transformedTasks as TableTask[]}
                showCompanyName={isEmployee}
              />
            )}
          </>
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
                : "Wählen Sie einen anderen Monat."}
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
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">Laden...</div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
