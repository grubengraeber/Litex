"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { TasksDataTable } from "@/components/tasks/tasks-data-table";
import { MonthSelector } from "@/components/tasks/month-selector";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";
import { useCompany } from "@/components/providers/company-provider";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions-constants";
import { Plus } from "lucide-react";
import { fetchTasks, fetchCompanies } from "../../actions";

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

interface Company {
  id: string;
  name: string;
}

function GeneralTasksContent() {
  const { isEmployee } = useRole();
  const { selectedCompanyId } = useCompany();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(true);

  const canCreateTasks = hasPermission(PERMISSIONS.CREATE_TASKS);

  useEffect(() => {
    if (isEmployee) {
      fetchCompanies().then((data) => setCompanies(data));
    }
  }, [isEmployee]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        taskType: "general" as const,
        period: selectedPeriod || undefined,
        companyId: selectedCompanyId || undefined,
        excludeCompleted: hideCompleted,
      };
      const fetched = await fetchTasks(filters);
      setTasks(fetched as unknown as Task[]);
    } catch (error) {
      console.error("Failed to fetch general tasks:", error);
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
        <div className="text-muted-foreground">Lade Aufgaben...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Allgemeine Aufgaben
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tableTasks.length} {tableTasks.length === 1 ? "Aufgabe" : "Aufgaben"}
            {selectedPeriod && ` im Zeitraum ${selectedPeriod}`}
          </p>
        </div>
        {isEmployee && canCreateTasks && (
          <Button
            className="bg-primary hover:bg-primary/90 whitespace-nowrap"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Neue Aufgabe
          </Button>
        )}
      </div>

      <MonthSelector
        taskType="general"
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
            Keine Aufgaben gefunden
          </h3>
          <p className="text-muted-foreground mt-1">
            Erstellen Sie eine neue Aufgabe oder ändern Sie den Filter.
          </p>
        </div>
      )}

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {isEmployee && canCreateTasks && (
        <CreateTaskDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          companies={companies}
          onTaskCreated={loadTasks}
        />
      )}
    </div>
  );
}

export default function GeneralTasksPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Laden...</div>}>
      <GeneralTasksContent />
    </Suspense>
  );
}
