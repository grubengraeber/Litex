"use client";

import { use } from "react";
import Link from "next/link";
import { ChatPanel } from "@/components/layout/chat-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit, 
  FileText, 
  User,
  Building2,
  Euro,
  Paperclip
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
  status: "on-track" as const,
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
    { id: "f1", name: "Rechnung_Q1_Entwurf.pdf", size: "245 KB" },
    { id: "f2", name: "Kundenliste_2025.xlsx", size: "128 KB" },
  ],
  createdAt: "28. Januar 2025",
  updatedAt: "05. Februar 2025",
};

// Mock chat messages for this task
const taskMessages = [
  {
    id: "1",
    content: "Ich habe den Entwurf hochgeladen. Bitte prüfen.",
    sender: { name: "Thomas", initials: "TS", isCurrentUser: false },
    timestamp: "Gestern, 14:30",
  },
  {
    id: "2",
    content: "Danke! Schaue ich mir gleich an.",
    sender: { name: "Du", initials: "FT", isCurrentUser: true },
    timestamp: "Gestern, 15:12",
  },
  {
    id: "3",
    content: "Bei Kunde Müller fehlt noch die Adressänderung.",
    sender: { name: "Du", initials: "FT", isCurrentUser: true },
    timestamp: "Heute, 09:45",
  },
];

const statusConfig = {
  "on-track": { label: "Im Plan", variant: "success" as const, color: "bg-green-500" },
  "pending-review": { label: "Prüfung nötig", variant: "warning" as const, color: "bg-yellow-500" },
  "overdue": { label: "Überfällig", variant: "danger" as const, color: "bg-red-500" },
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const task = mockTask; // In real app: fetch by id
  const config = statusConfig[task.status];

  return (
    <div className="flex h-full gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Back & Actions */}
        <div className="flex items-center justify-between">
          <Link href="/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Übersicht
            </Button>
          </Link>
          <Link href={`/tasks/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Bearbeiten
            </Button>
          </Link>
        </div>

        {/* Task Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`w-3 h-3 rounded-full ${config.color}`} />
            <Badge variant={config.variant}>{config.label}</Badge>
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

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Anhänge ({task.files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {task.files.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{file.size}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2">
                <Paperclip className="w-4 h-4 mr-2" />
                Datei hochladen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <div className="text-xs text-slate-400 flex gap-4">
          <span>Erstellt: {task.createdAt}</span>
          <span>Aktualisiert: {task.updatedAt}</span>
        </div>
      </div>

      {/* Task Chat */}
      <ChatPanel 
        title="AUFGABEN-CHAT" 
        taskId={id}
        messages={taskMessages}
      />
    </div>
  );
}
