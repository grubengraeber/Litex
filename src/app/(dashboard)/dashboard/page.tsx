"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TaskCard, sortTasksByPriority } from "@/components/tasks/task-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MONTHS, type TaskStatus } from "@/lib/constants";
import { useRole } from "@/hooks/use-role";
import { TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { fetchTasks } from "../actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { useCompany } from "@/components/providers/company-provider";

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

function DashboardContent() {
  const searchParams = useSearchParams();
  const { isEmployee, isCustomer } = useRole();
  const { selectedCompanyId } = useCompany();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, green: 0, yellow: 0, red: 0 });

  const currentMonth = new Date().getMonth();
  const currentMonthKey = MONTHS[currentMonth].key;
  const activeMonthKey = searchParams.get("month") || currentMonthKey;

  const activeMonth =
    MONTHS.find((m) => m.key === activeMonthKey) || MONTHS[currentMonth];

  // Fetch tasks when filters change
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const filters = {
          period: activeMonthKey,
          companyId: selectedCompanyId || undefined,
        };

        const [fetchedTasks] = await Promise.all([
          fetchTasks(filters),
        ]);

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
  }, [activeMonthKey, selectedCompanyId]);

  // Filter and sort tasks - ONLY show urgent tasks (red and yellow)
  const filteredTasks = useMemo(() => {
    // Only show open and submitted tasks that are urgent (red or yellow)
    const urgentTasks = tasks.filter(
      (task) =>
        task.status !== "completed" &&
        (task.trafficLight === "red" || task.trafficLight === "yellow")
    );

    // Sort by priority (red/oldest first)
    return sortTasksByPriority(
      urgentTasks.map((task) => ({
        id: task.id,
        title: task.bookingText || "Keine Beschreibung",
        description: task.bookingText || "",
        dueDate: "Offen",
        createdAt: new Date(task.createdAt),
        status: task.status as TaskStatus,
        assignee: { name: "Team", initials: "LX" },
        commentCount: task.comments?.length || 0,
        fileCount: task.files?.length || 0,
        period: task.period || "",
        companyId: task.company.id,
        companyName: task.company.name,
        amount: task.amount || "0,00",
      }))
    );
  }, [tasks]);

  // Chart data for task age distribution
  const chartData = useMemo(() => {
    const red = tasks.filter(t => t.status !== "completed" && t.trafficLight === "red").length;
    const yellow = tasks.filter(t => t.status !== "completed" && t.trafficLight === "yellow").length;
    const green = tasks.filter(t => t.status !== "completed" && t.trafficLight === "green").length;

    return [
      { name: "Überfällig", value: red, color: "#ef4444" },
      { name: "Nicht bearbeitet", value: yellow, color: "#eab308" },
      { name: "Bearbeitet", value: green, color: "#22c55e" },
    ];
  }, [tasks]);

  const completedThisMonth = useMemo(() => {
    return tasks.filter(t => t.status === "completed").length;
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Lade Aufgaben...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-words">
              DRINGENDE AUFGABEN
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground mt-1">
              {isCustomer
                ? "Überfällige und nicht bearbeitete Aufgaben"
                : `${activeMonth.full} - Überfällige und nicht bearbeitete Aufgaben`}
            </p>
          </div>

          {/* Company selection now in sidebar */}
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Task Age Distribution Chart */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Aufgaben nach Alter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Offene Aufgaben</p>
                      <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Erledigt</p>
                      <p className="text-2xl font-bold text-foreground">{completedThisMonth}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Urgent Stats Bar - Only Red and Yellow */}
        <div className="flex flex-wrap gap-2 lg:gap-4 mb-6">
          <div
            className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/30 rounded-lg border-2 border-red-200 dark:border-red-800"
            title="Überfällig"
          >
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm lg:text-base text-red-700 dark:text-red-400 font-medium">
              Überfällig:
            </span>
            <span className="font-bold text-lg lg:text-xl text-red-700 dark:text-red-400">
              {stats.red}
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border-2 border-yellow-200 dark:border-yellow-800"
            title="Nicht bearbeitet"
          >
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm lg:text-base text-yellow-700 dark:text-yellow-400 font-medium">
              Nicht bearbeitet:
            </span>
            <span className="font-bold text-lg lg:text-xl text-yellow-700 dark:text-yellow-400">
              {stats.yellow}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg ml-auto">
            <span className="text-xs lg:text-sm text-muted-foreground">
              Offene gesamt:
            </span>
            <span className="font-semibold text-sm lg:text-base">
              {stats.total}
            </span>
            <span className="text-xs text-muted-foreground">({stats.green} bearbeitet)</span>
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
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-lg font-medium text-green-700 dark:text-green-400">
              Keine dringenden Aufgaben!
            </h3>
            <p className="text-muted-foreground mt-1">
              {isEmployee && selectedCompanyId
                ? `Keine Aufgaben älter als 30 Tage für diesen Mandanten.`
                : `Alle Aufgaben sind aktuell (< 30 Tage alt).`}
            </p>
            {stats.green > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {stats.green} neue Aufgabe{stats.green > 1 ? "n" : ""} verfügbar
              </p>
            )}
          </div>
        )}

        {/* Activity Feed */}
        <div className="mt-8">
          <ActivityFeed />
        </div>
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
