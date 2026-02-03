"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TaskCard, sortTasksByPriority } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MONTHS,
  FILTER_OPTIONS,
  type TaskStatus,
} from "@/lib/constants";
import { useRole } from "@/hooks/use-role";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Building2,
  ChevronDown,
} from "lucide-react";
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
  comments?: Array<{ id: string }>;
  files?: Array<{ id: string }>;
}

interface Company {
  id: string;
  name: string;
}

function TasksContent() {
  const searchParams = useSearchParams();
  const { isEmployee, isCustomer } = useRole();
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const filter = searchParams.get("filter") || "all";
  const month = searchParams.get("month");

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
          period: month || undefined,
          companyId: selectedCompany !== "all" ? selectedCompany : undefined,
        };

        const fetchedTasks = await fetchTasks(filters);
        setTasks(fetchedTasks as unknown as Task[]);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [month, selectedCompany]);

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      // Status filter
      switch (filter) {
        case "open":
          return task.status === "open";
        case "submitted":
          return task.status === "submitted";
        case "completed":
          return task.status === "completed";
        case "red":
          return task.trafficLight === "red" && task.status !== "completed";
        case "yellow":
          return task.trafficLight === "yellow" && task.status !== "completed";
        case "all":
        default:
          return true;
      }
    });

    // Sort by priority (red/oldest first)
    return sortTasksByPriority(
      filtered.map((task) => ({
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
  }, [tasks, filter]);

  const filterLabel =
    FILTER_OPTIONS.find((f) => f.key === filter)?.label || "Alle";
  const monthLabel = month ? MONTHS.find((m) => m.key === month)?.full : null;

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
            {filterLabel}
            {monthLabel && ` • ${monthLabel}`}
            {` • ${filteredTasks.length} Aufgaben`}
            <span className="hidden sm:inline text-xs ml-2">
              (Sortiert nach Dringlichkeit)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Company Filter for employees */}
          {isEmployee && (
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="w-auto"
              >
                <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-none">
                  {companies.find((c) => c.id === selectedCompany)?.name ||
                    "Alle Mandanten"}
                </span>
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

          {isEmployee && (
            <Button className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Neue Aufgabe</span>
              <span className="inline xs:hidden">Neu</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Aufgaben durchsuchen..."
            className="pl-10 text-sm sm:text-base"
          />
        </div>
        <Button variant="outline" size="icon" className="flex-shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

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
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">Laden...</div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
