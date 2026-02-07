"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface SyncJob {
  id: string;
  source: string;
  status: string;
  recordsProcessed: number | null;
  recordsCreated: number | null;
  recordsUpdated: number | null;
  recordsFailed: number | null;
  errorLog: string | null;
  startedAt: string;
  completedAt: string | null;
  triggeredBy: string | null;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  running: "default",
  completed: "secondary",
  completed_with_errors: "outline",
  failed: "destructive",
};

const statusLabel: Record<string, string> = {
  running: "Laufend",
  completed: "Abgeschlossen",
  completed_with_errors: "Mit Fehlern",
  failed: "Fehlgeschlagen",
};

export default function ImportsPage() {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sync-jobs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setJobs(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Lade Import-Verlauf...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import-Verlauf</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Synchronisierungsjobs und Import-Historie
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Keine Imports vorhanden
          </h3>
          <p className="text-muted-foreground mt-1">
            Es wurden noch keine Daten importiert.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      {job.status === "running" ? (
                        <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                      ) : job.status === "failed" ? (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      ) : (
                        <Database className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground capitalize">
                          {job.source}
                        </span>
                        <Badge variant={statusVariant[job.status] || "outline"}>
                          {statusLabel[job.status] || job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(job.startedAt), {
                            addSuffix: true,
                            locale: de,
                          })}
                        </span>
                        {job.triggeredBy && (
                          <span>von {job.triggeredBy}</span>
                        )}
                      </div>
                      {job.recordsProcessed !== null && (
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{job.recordsProcessed} verarbeitet</span>
                          <span className="text-green-600 dark:text-green-400">
                            {job.recordsCreated} neu
                          </span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {job.recordsUpdated} aktualisiert
                          </span>
                          {(job.recordsFailed ?? 0) > 0 && (
                            <span className="text-red-600 dark:text-red-400">
                              {job.recordsFailed} fehlgeschlagen
                            </span>
                          )}
                        </div>
                      )}
                      {job.errorLog && (
                        <pre className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded max-h-24 overflow-auto">
                          {job.errorLog}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
