"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/use-role";
import { AuditLogsDataTable } from "@/components/audit-logs/audit-logs-data-table";
import { columns, type AuditLog } from "@/components/audit-logs/columns";

export default function AuditLogsPage() {
  const { permissions } = useRole();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (permissions.canViewAuditLogs) {
      fetchLogs();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions.canViewAuditLogs]);

  async function fetchLogs() {
    setLoading(true);
    try {
      // Fetch all logs for client-side filtering
      const params = new URLSearchParams({
        limit: "1000",
        offset: "0",
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(
          data.logs.map((log: AuditLog) => ({
            ...log,
            createdAt: new Date(log.createdAt),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Fehler beim Laden der Audit Logs");
    } finally {
      setLoading(false);
    }
  }

  const handleExport = () => {
    // Convert logs to CSV
    const headers = [
      "Zeitstempel",
      "Benutzer",
      "Benutzer ID",
      "Aktion",
      "Entität",
      "Entität ID",
      "IP-Adresse",
      "Status",
      "Fehlermeldung",
    ];

    const rows = logs.map((log) => [
      log.createdAt.toISOString(),
      log.userEmail,
      log.userId || "",
      log.action,
      log.entityType,
      log.entityId || "",
      log.userIpAddress || "",
      log.status,
      log.errorMessage || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Audit Logs exportiert");
  };

  // Check permission
  if (!permissions.canViewAuditLogs) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Keine Berechtigung
            </h2>
            <p className="text-slate-500">
              Du hast keine Berechtigung, um Audit Logs anzuzeigen. Diese
              Funktion ist nur für Administratoren verfügbar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Lade Audit Logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 mt-1">
          Vollständiger Aktivitätsverlauf aller Benutzeraktionen im System
        </p>
      </div>

      <AuditLogsDataTable
        columns={columns}
        data={logs}
        onExport={handleExport}
      />
    </div>
  );
}
