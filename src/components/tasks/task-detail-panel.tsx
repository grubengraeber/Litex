"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TRAFFIC_LIGHT_CONFIG, TASK_STATUS } from "@/lib/constants";
import { daysUntilDue } from "@/lib/due-date-utils";
import {
  Calendar,
  Clock,
  FileText,
  Building2,
  Euro,
  ExternalLink,
  MessageSquare,
  Paperclip,
} from "lucide-react";

interface TaskDetail {
  id: string;
  bookingText: string | null;
  bmdBookingId: string | null;
  amount: string | null;
  documentDate: string | null;
  bookingDate: string | null;
  period: string | null;
  dueDate: string | null;
  status: "open" | "submitted" | "completed";
  trafficLight: "green" | "yellow" | "red";
  createdAt: Date;
  company: { id: string; name: string };
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    user: { name: string | null; email: string };
  }>;
  files: Array<{
    id: string;
    fileName: string;
    fileSize: number | null;
  }>;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface TaskDetailPanelProps {
  taskId: string;
  onClose: () => void;
  readOnly?: boolean;
}

export function TaskDetailPanel({ taskId, onClose, readOnly }: TaskDetailPanelProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tasks/${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        setTask(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [taskId]);

  const dueDays = task?.dueDate ? daysUntilDue(task.dueDate) : null;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">
            {loading ? "Lade..." : task?.bookingText || "Aufgabendetails"}
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Lade Details...</div>
          </div>
        )}

        {!loading && task && (
          <div className="space-y-6 mt-4">
            {/* Status & Traffic Light */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-3 h-3 rounded-full ${TRAFFIC_LIGHT_CONFIG[task.trafficLight].color}`} />
              <Badge className={`${TRAFFIC_LIGHT_CONFIG[task.trafficLight].bgLight} ${TRAFFIC_LIGHT_CONFIG[task.trafficLight].text} border-0`}>
                {TRAFFIC_LIGHT_CONFIG[task.trafficLight].label}
              </Badge>
              <Badge className={`${TASK_STATUS[task.status].color} border-0`}>
                {TASK_STATUS[task.status].label}
              </Badge>
              {dueDays !== null && dueDays < 0 && (
                <Badge variant="destructive">
                  {Math.abs(dueDays)} Tage überfällig
                </Badge>
              )}
              {dueDays !== null && dueDays >= 0 && dueDays <= 7 && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Fällig in {dueDays} Tagen
                </Badge>
              )}
            </div>

            <Separator />

            {/* Booking Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Buchungsdaten</h3>
              <div className="grid gap-3">
                <DetailRow icon={FileText} label="Buchungstext" value={task.bookingText || "-"} />
                <DetailRow icon={Euro} label="Betrag" value={task.amount ? `€ ${task.amount}` : "-"} />
                <DetailRow icon={Building2} label="Mandant" value={task.company.name} />
                <DetailRow icon={Calendar} label="Zeitraum" value={task.period || "-"} />
                <DetailRow
                  icon={Calendar}
                  label="Belegdatum"
                  value={task.documentDate ? formatDate(task.documentDate) : "-"}
                />
                <DetailRow
                  icon={Clock}
                  label="Fälligkeitsdatum"
                  value={task.dueDate ? formatDate(task.dueDate) : "-"}
                />
                <DetailRow
                  icon={Clock}
                  label="Erstellt am"
                  value={formatDate(task.createdAt)}
                />
                {task.bmdBookingId && (
                  <DetailRow icon={FileText} label="BMD Buchungs-ID" value={task.bmdBookingId} />
                )}
              </div>
            </div>

            <Separator />

            {/* Files */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Belege ({task.files.length})
              </h3>
              {task.files.length > 0 ? (
                <div className="space-y-2">
                  {task.files.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{file.fileName}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Belege vorhanden.</p>
              )}
            </div>

            <Separator />

            {/* Recent Comments */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Kommentare ({task.comments.length})
              </h3>
              {task.comments.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {task.comments.slice(-5).map((comment) => (
                    <div key={comment.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {comment.user.name || comment.user.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Kommentare vorhanden.</p>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Link href={`/tasks/${task.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Vollansicht öffnen
                </Button>
              </Link>
              {!readOnly && (
                <Link href={`/chats/${task.id}`} className="flex-1">
                  <Button className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat öffnen
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}
