"use client";

import { use } from "react";
import Link from "next/link";
import { ChatPanel, type ChatMessage } from "@/components/layout/chat-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { TRAFFIC_LIGHT_CONFIG, FILE_STATUS, type TrafficLight } from "@/lib/constants";
import { useRole } from "@/hooks/use-role";
import { FileUpload } from "@/components/ui/file-upload";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit, 
  FileText, 
  User,
  Building2,
  Euro,
  Paperclip,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

// Mock task data
const mockTask = {
  id: "1",
  title: "Kunden-Rechnungen Q1",
  description: "Erstellung und Versand der Kundenrechnungen für das erste Quartal. Bitte alle offenen Posten prüfen und die Rechnungen bis zum Fälligkeitsdatum versenden.",
  bookingText: "Ausgangsrechnung Q1/2025",
  amount: "12.450,00",
  documentDate: "01.02.2025",
  bookingDate: "15.02.2025",
  dueDate: "15. Februar 2025",
  trafficLight: "green" as TrafficLight,
  progress: 65,
  company: {
    id: "c1",
    name: "Mustermann GmbH",
  },
  assignee: {
    id: "u1",
    name: "Thomas Schmidt",
    email: "thomas@example.com",
    initials: "TS",
  },
  files: [
    { id: "f1", name: "Rechnung_Q1_Entwurf.pdf", size: "245 KB", status: "approved" as "pending" | "approved" | "rejected", uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { id: "f2", name: "Kundenliste_2025.xlsx", size: "128 KB", status: "pending" as "pending" | "approved" | "rejected", uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  ],
  createdAt: new Date("2025-01-28"),
  updatedAt: new Date("2025-02-05"),
};

// Mock chat messages for this task with proper timestamps
const taskMessages: ChatMessage[] = [
  {
    id: "1",
    content: "Ich habe den Entwurf hochgeladen. Bitte prüfen.",
    sender: { name: "Thomas Schmidt", initials: "TS", isCurrentUser: false },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    attachments: [
      { id: "a1", name: "Rechnung_Q1_Entwurf.pdf", type: "pdf", size: "245 KB", status: "approved" }
    ]
  },
  {
    id: "2",
    content: "Danke! Schaue ich mir gleich an.",
    sender: { name: "Anna Müller", initials: "AM", isCurrentUser: true },
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
  },
  {
    id: "3",
    content: "Der Beleg wurde freigegeben. ✓",
    sender: { name: "Anna Müller", initials: "AM", isCurrentUser: true },
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
  },
  {
    id: "4",
    content: "Bei Kunde Müller fehlt noch die Adressänderung.",
    sender: { name: "Anna Müller", initials: "AM", isCurrentUser: true },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "5",
    content: "Aktualisierte Kundenliste hochgeladen.",
    sender: { name: "Thomas Schmidt", initials: "TS", isCurrentUser: false },
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    attachments: [
      { id: "a2", name: "Kundenliste_2025.xlsx", type: "file", size: "128 KB", status: "pending" }
    ]
  },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isEmployee } = useRole();
  const task = mockTask; // In real app: fetch by id
  const config = TRAFFIC_LIGHT_CONFIG[task.trafficLight];

  // Calculate days since creation
  const daysSinceCreation = Math.floor(
    (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysUntilOverdue = Math.max(0, 75 - daysSinceCreation);

  return (
    <div className="flex h-full gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6 overflow-auto">
        {/* Back & Actions */}
        <div className="flex items-center justify-between">
          <Link href="/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Übersicht
            </Button>
          </Link>
          {isEmployee && (
            <Link href={`/tasks/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </Button>
            </Link>
          )}
        </div>

        {/* Task Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`w-4 h-4 rounded-full ${config.color}`} />
            <Badge className={`${config.bgLight} ${config.text} border-0`}>
              {config.label}
            </Badge>
            {daysUntilOverdue > 0 && daysUntilOverdue <= 14 && (
              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                <AlertCircle className="w-3 h-3 mr-1" />
                Noch {daysUntilOverdue} Tage bis Frist
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
          <p className="text-slate-500 mt-2">{task.description}</p>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Fortschritt</span>
              <span className="text-sm text-slate-500">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
            <p className="text-xs text-slate-400 mt-2">
              Erstellt vor {daysSinceCreation} Tagen • 75-Tage-Frist: {daysUntilOverdue > 0 ? `noch ${daysUntilOverdue} Tage` : "überschritten"}
            </p>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aufgaben-Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Fälligkeitsdatum</div>
                  <div className="text-sm text-slate-500">{task.dueDate}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Mandant</div>
                  <div className="text-sm text-slate-500">{task.company.name}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Zugewiesen an</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                        {task.assignee.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-500">{task.assignee.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Buchungsdaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Buchungstext</div>
                  <div className="text-sm text-slate-500">{task.bookingText}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Euro className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Betrag</div>
                  <div className="text-sm text-slate-500">€ {task.amount}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Belegdatum</div>
                  <div className="text-sm text-slate-500">{task.documentDate}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attachments with approval status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Belege ({task.files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {task.files.map((file) => {
                const statusConfig = FILE_STATUS[file.status];
                return (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-slate-400">
                          {file.size} • Hochgeladen am {formatDate(file.uploadedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${statusConfig.color} border-0`}>
                        {file.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {file.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                        {file.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                        {statusConfig.label}
                      </Badge>
                      {isEmployee && file.status === "pending" && (
                        <div className="flex gap-1 ml-2">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Drag & Drop Upload */}
              <div className="mt-4 pt-4 border-t">
                <FileUpload
                  onUpload={async (files) => {
                    // TODO: Upload to MinIO
                    console.log("Uploading files:", files);
                    await new Promise(r => setTimeout(r, 1500));
                  }}
                  maxFiles={5}
                  maxSizeMB={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <div className="text-xs text-slate-400 flex gap-4">
          <span>Erstellt: {formatDate(task.createdAt)}</span>
          <span>Aktualisiert: {formatDate(task.updatedAt)}</span>
        </div>
      </div>

      {/* Task Chat with real timestamps */}
      <ChatPanel 
        title="KOMMENTARE" 
        taskId={id}
        messages={taskMessages}
      />
    </div>
  );
}
