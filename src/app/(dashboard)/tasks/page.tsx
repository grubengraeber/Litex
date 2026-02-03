"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { TaskCard, sortTasksByPriority } from "@/components/tasks/task-card";
import { TasksDataTable } from "@/components/tasks/tasks-data-table";
import { ViewToggle } from "@/components/tasks/view-toggle";
import { TaskFiltersBar } from "@/components/tasks/task-filters";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { Button } from "@/components/ui/button";
import { type TaskStatus } from "@/lib/constants";
import { useRole } from "@/hooks/use-role";
import { useTaskFilters } from "@/hooks/use-task-filters";
import { Plus } from "lucide-react";
import { fetchTasks, fetchCompanies } from "../actions";

interface Task {
  id: string;
  bookingText: string | null;
  bmdBookingId: string | null;
  amount: string | null;
  period: string | null;
  dueDate: string | null;
  status: "open" | "submitted" | "completed";
  trafficLight: "green" | "yellow" | "red";
  createdAt: Date;
  company: {
    id: string;
    name: string;
  };
  comments?: Array<{ id: string }>;
  files?: Array<{ id: string }>;
}

interface Company {
  id: string;
  name: string;
}

function TasksContent() {
  const { isEmployee, isCustomer } = useRole();
  const { filters, setFilter, clearFilters, activeFilterCount } = useTaskFilters();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("tasks-view");
    if (savedView === "grid" || savedView === "table") {
      setView(savedView);
    }
  }, []);

  const handleViewChange = (newView: "grid" | "table") => {
    setView(newView);
    localStorage.setItem("tasks-view", newView);
  };

  // Fetch companies on mount (for employees)
  useEffect(() => {
    if (isEmployee) {
      fetchCompanies().then((data) => {
        setCompanies([{ id: "all", name: "Alle Mandanten" }, ...data]);
      });
    }
  }, [isEmployee]);

  // Load tasks function
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const apiFilters = {
        status: filters.status,
        trafficLight: filters.trafficLight,
        period: filters.period,
        companyId: filters.companyId,
        search: filters.search,
      };

      const fetchedTasks = await fetchTasks(apiFilters);
      setTasks(fetchedTasks as unknown as Task[]);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch tasks when filters change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Tasks are already filtered by API, just use them directly
  const filteredTasks = tasks;

  // For grid view, convert to TaskCard format and sort
  const gridTasks = useMemo(() => {
    return sortTasksByPriority(
      filteredTasks.map((task) => ({
        id: task.id,
        title: task.bookingText || "Keine Beschreibung",
        description: task.bookingText || "",
        dueDate: "Offen",
        createdAt: new Date(task.createdAt),
        status: task.status as TaskStatus,
        assignee: { name: "Team", initials: "LX" },
        commentCount: task.comments?.length ?? 0,
        fileCount: task.files?.length ?? 0,
        period: task.period || "",
        companyId: task.company.id,
        companyName: task.company.name,
        amount: task.amount || "0,00",
      }))
    );
  }, [filteredTasks]);

  // For table view, add comment count
  const tableTasks = useMemo(() => {
    return filteredTasks.map((task) => ({
      ...task,
      commentCount: task.comments?.length ?? 0,
    }));
  }, [filteredTasks]);

  const taskCount = view === "grid" ? gridTasks.length : tableTasks.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Lade Aufgaben...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {isCustomer ? "Meine Aufgaben" : "Alle Aufgaben"}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 break-words">
            {taskCount} {taskCount === 1 ? "Aufgabe" : "Aufgaben"}
            {activeFilterCount > 0 && ` • ${activeFilterCount} Filter aktiv`}
            {view === "grid" && (
              <span className="hidden sm:inline text-xs ml-2">
                (Sortiert nach Dringlichkeit)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* View Toggle */}
          <ViewToggle view={view} onViewChange={handleViewChange} />

          {isEmployee && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Neue Aufgabe</span>
              <span className="inline xs:hidden">Neu</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <TaskFiltersBar
        filters={filters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        companies={companies}
        showCompanyFilter={isEmployee}
      />

      {/* Traffic Light Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm bg-slate-50 p-3 rounded-lg">
        <span className="font-medium text-slate-600 w-full sm:w-auto mb-1 sm:mb-0">
          Ampel-System:
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-slate-600 whitespace-nowrap">
            Neu (0-30 Tage)
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0" />
          <span className="text-slate-600 whitespace-nowrap">
            Warnung (&gt;30 Tage)
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-slate-600 whitespace-nowrap">
            Dringend (&gt;60 Tage)
          </span>
        </div>
      </div>

      {/* Tasks View */}
      {taskCount > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gridTasks.map((task) => (
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
          <TasksDataTable tasks={tableTasks} showCompanyColumn={isEmployee} />
        )
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

      {/* Create Task Dialog */}
      {isEmployee && (
        <CreateTaskDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          companies={companies.filter(c => c.id !== "all")}
          onTaskCreated={loadTasks}
        />
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">Laden...</div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
