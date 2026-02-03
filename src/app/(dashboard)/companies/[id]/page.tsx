"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard, sortTasksByPriority } from "@/components/tasks/task-card";
import { useRole } from "@/hooks/use-role";
import { 
  ChevronRight,
  Home,
  Building2,
  Pencil,
  FileText,
  CheckCircle,
  XCircle,
  ArrowLeft
} from "lucide-react";
import type { TaskStatus } from "@/lib/constants";

interface Company {
  id: string;
  name: string;
  bmdId: string | null;
  finmaticsId: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface Task {
  id: string;
  bookingText: string | null;
  amount: string | null;
  period: string | null;
  status: "open" | "submitted" | "completed";
  trafficLight: "green" | "yellow" | "red";
  createdAt: Date;
  comments?: Array<{ id: string }>;
  files?: Array<{ id: string }>;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isEmployee } = useRole();
  const [company, setCompany] = useState<Company | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = params.id as string;

  useEffect(() => {
    async function loadData() {
      if (!companyId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch company details
        const companyRes = await fetch(`/api/companies?id=${companyId}`);
        const companyData = await companyRes.json();

        if (!companyRes.ok) {
          throw new Error(companyData.error || "Fehler beim Laden");
        }

        setCompany(companyData.company);

        // Fetch tasks for this company
        const tasksRes = await fetch(`/api/tasks?companyId=${companyId}`);
        const tasksData = await tasksRes.json();

        if (tasksRes.ok) {
          setTasks(tasksData.tasks || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [companyId]);

  // Redirect customers
  if (!isEmployee) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h3 className="text-lg font-medium text-slate-700">Kein Zugriff</h3>
        <p className="text-slate-500 mt-1">
          Diese Seite ist nur für Mitarbeiter verfügbar.
        </p>
        <Link href="/dashboard">
          <Button className="mt-4">Zum Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">❌</span>
        </div>
        <h3 className="text-lg font-medium text-slate-700">
          {error || "Mandant nicht gefunden"}
        </h3>
        <Link href="/companies">
          <Button className="mt-4">Zurück zur Übersicht</Button>
        </Link>
      </div>
    );
  }

  // Task statistics
  const openTasks = tasks.filter((t) => t.status === "open");
  const submittedTasks = tasks.filter((t) => t.status === "submitted");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  // Transform and sort tasks for display
  const displayTasks = sortTasksByPriority(
    tasks.filter((t) => t.status !== "completed").map((task) => ({
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
      amount: task.amount || "0,00",
    }))
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 hover:text-slate-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          href="/companies"
          className="hover:text-slate-700 transition-colors"
        >
          Mandanten
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium">{company.name}</span>
      </nav>

      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {company.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {company.isActive ? (
                  <Badge variant="success" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Aktiv
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inaktiv
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={() => router.push(`/companies/${companyId}/edit`)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Bearbeiten
        </Button>
      </div>

      {/* Company Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mandanteninformationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-500">Name</label>
              <p className="mt-1 text-slate-900">{company.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">BMD ID</label>
              <p className="mt-1 text-slate-900">
                {company.bmdId || <span className="text-slate-400">—</span>}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">
                Finmatics ID
              </label>
              <p className="mt-1 text-slate-900">
                {company.finmaticsId || <span className="text-slate-400">—</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openTasks.length}</p>
                <p className="text-sm text-slate-500">Offene Aufgaben</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{submittedTasks.length}</p>
                <p className="text-sm text-slate-500">Eingereicht</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
                <p className="text-sm text-slate-500">Erledigt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Aufgaben ({tasks.length})
        </h2>

        {displayTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayTasks.map((task) => (
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
                amount={task.amount !== "0,00" ? task.amount : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-lg">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-xl">📋</span>
            </div>
            <h3 className="text-lg font-medium text-slate-700">
              Keine offenen Aufgaben
            </h3>
            <p className="text-slate-500 mt-1">
              Dieser Mandant hat aktuell keine offenen Aufgaben.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
