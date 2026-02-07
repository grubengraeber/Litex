"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { TasksDataTable } from "@/components/tasks/tasks-data-table";
import { MonthSelector } from "@/components/tasks/month-selector";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { useRole } from "@/hooks/use-role";
import { useCompany } from "@/components/providers/company-provider";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchTasks } from "../../actions";

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
  company: { id: string; name: string };
  comments?: Array<{ id: string }>;
  files?: Array<{ id: string }>;
}

function BookingTasksContent() {
  const { isEmployee } = useRole();
  const { selectedCompanyId } = useCompany();
  const { loading: permissionsLoading } = usePermissions();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(true);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        taskType: "booking" as const,
        period: selectedPeriod || undefined,
        companyId: selectedCompanyId || undefined,
        excludeCompleted: hideCompleted,
      };
      const fetched = await fetchTasks(filters);
      setTasks(fetched as unknown as Task[]);
    } catch (error) {
      console.error("Failed to fetch booking tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedCompanyId, hideCompleted]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const tableTasks = useMemo(() => {
    return tasks.map((task) => ({
      ...task,
      commentCount: task.comments?.length ?? 0,
    }));
  }, [tasks]);

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Lade Buchungen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Ungeklärte Buchungen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tableTasks.length} {tableTasks.length === 1 ? "Buchung" : "Buchungen"}
          {selectedPeriod && ` im Zeitraum ${selectedPeriod}`}
        </p>
      </div>

      <MonthSelector
        taskType="booking"
        companyId={selectedCompanyId}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        hideCompleted={hideCompleted}
        onHideCompletedChange={setHideCompleted}
      />

      {tableTasks.length > 0 ? (
        <TasksDataTable
          tasks={tableTasks}
          showCompanyColumn={isEmployee}
          onRowClick={(taskId) => setSelectedTaskId(taskId)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Keine Buchungen gefunden
          </h3>
          <p className="text-muted-foreground mt-1">
            Für diesen Zeitraum gibt es keine ungeklärten Buchungen.
          </p>
        </div>
      )}

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          readOnly
        />
      )}
    </div>
  );
}

export default function BookingTasksPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Laden...</div>}>
      <BookingTasksContent />
    </Suspense>
  );
}
