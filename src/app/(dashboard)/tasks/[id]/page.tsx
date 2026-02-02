"use client";

import { useState } from "react";
import Link from "next/link";
import { ChatPanel, type ChatMessage } from "@/components/layout/chat-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileUpload } from "@/components/ui/file-upload";
import { 
  TRAFFIC_LIGHT_CONFIG, 
  TASK_STATUS,
  calculateTrafficLight,
  type TaskStatus 
} from "@/lib/constants";
import { useRole } from "@/hooks/use-role";
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
  Send,
  RotateCcw,
  AlertTriangle,
  MessageCircle
} from "lucide-react";
// Sheet imports removed - using fullscreen overlay for mobile chat

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
  status: "open" as TaskStatus,
  createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago - YELLOW
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
    { id: "f1", name: "Rechnung_Q1_Entwurf.pdf", size: "245 KB", status: "approved" as "pending" | "approved" | "rejected", uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), uploadedBy: "Max Mustermann" },
    { id: "f2", name: "Kundenliste_2025.xlsx", size: "128 KB", status: "pending" as "pending" | "approved" | "rejected", uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), uploadedBy: "Max Mustermann" },
  ],
  updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
};

// Mock chat messages
const taskMessages: ChatMessage[] = [
  {
    id: "1",
    content: "Ich habe den Entwurf hochgeladen. Bitte prüfen.",
    sender: { name: "Max Mustermann", initials: "MM", isCurrentUser: false },
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
    content: "Bei Kunde Müller fehlt noch die Adressänderung. Bitte korrigieren.",
    sender: { name: "Anna Müller", initials: "AM", isCurrentUser: true },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

const FILE_STATUS_CONFIG = {
  pending: { label: "Hochgeladen", color: "bg-yellow-100 text-yellow-700", description: "Wartet auf Freigabe" },
  approved: { label: "Freigegeben", color: "bg-green-100 text-green-700", description: "Vom Mitarbeiter bestätigt" },
  rejected: { label: "Abgelehnt", color: "bg-red-100 text-red-700", description: "Bitte erneut hochladen" },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { isEmployee, isCustomer, permissions } = useRole();
  const [task, setTask] = useState(mockTask);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Calculate traffic light
  const daysSinceCreation = Math.floor(
    (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const trafficLight = calculateTrafficLight(daysSinceCreation);
  const trafficConfig = TRAFFIC_LIGHT_CONFIG[trafficLight];
  const statusConfig = TASK_STATUS[task.status];

  // Action handlers
  const handleSubmit = () => {
    // Customer submits task
    setTask({ ...task, status: "submitted" });
    // TODO: API call
    console.log("Task submitted");
  };

  const handleComplete = () => {
    // Employee completes task
    setTask({ ...task, status: "completed" });
    // TODO: API call
    console.log("Task completed");
  };

  const handleReturn = () => {
    if (!returnComment.trim()) return;
    // Employee returns task to customer with comment
    setTask({ ...task, status: "open" });
    setShowReturnDialog(false);
    setReturnComment("");
    // TODO: API call with comment
    console.log("Task returned with comment:", returnComment);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-4 lg:space-y-6 overflow-auto order-2 lg:order-1">
        {/* Back & Actions */}
        <div className="flex items-center justify-between">
          <Link href="/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Übersicht
            </Button>
          </Link>
          {isEmployee && task.status !== "completed" && (
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
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {/* Traffic Light */}
            <span className={`w-4 h-4 rounded-full ${trafficConfig.color}`} />
            <Badge className={`${trafficConfig.bgLight} ${trafficConfig.text} border-0`}>
              {trafficConfig.label} ({daysSinceCreation} Tage)
            </Badge>
            {/* Status Badge */}
            <Badge className={`${statusConfig.color} border-0`}>
              {statusConfig.label}
            </Badge>
            {/* Warning for old tasks */}
            {trafficLight === "red" && (
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Dringend: &gt;60 Tage alt
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
          <p className="text-slate-500 mt-2">{task.description}</p>
        </div>

        {/* ACTION BUTTONS based on role and status */}
        {task.status !== "completed" && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">Aktionen</h3>
                  <p className="text-sm text-blue-700">
                    {task.status === "open" && isCustomer && "Bereit zum Einreichen?"}
                    {task.status === "open" && isEmployee && "Warte auf Einreichung durch Kunden"}
                    {task.status === "submitted" && isEmployee && "Eingereicht vom Kunden - bereit zur Prüfung"}
                    {task.status === "submitted" && isCustomer && "Wartet auf Prüfung durch Mitarbeiter"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* CUSTOMER: Einreichen Button */}
                  {isCustomer && task.status === "open" && permissions.canSubmitTask && (
                    <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4 mr-2" />
                      Einreichen
                    </Button>
                  )}

                  {/* EMPLOYEE: Zurück an Kunde (when submitted) */}
                  {isEmployee && task.status === "submitted" && permissions.canReturnTask && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowReturnDialog(true)}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Zurück an Kunde
                    </Button>
                  )}

                  {/* EMPLOYEE: Abschließen Button (when submitted) */}
                  {isEmployee && task.status === "submitted" && permissions.canCompleteTask && (
                    <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Abschließen
                    </Button>
                  )}
                </div>
              </div>

              {/* Return Dialog with required comment */}
              {showReturnDialog && (
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <h4 className="font-medium mb-2">Zurück an Kunde senden</h4>
                  <p className="text-sm text-slate-500 mb-3">
                    Bitte geben Sie einen Kommentar ein (Pflichtfeld):
                  </p>
                  <textarea
                    value={returnComment}
                    onChange={(e) => setReturnComment(e.target.value)}
                    placeholder="Was muss der Kunde noch erledigen?"
                    className="w-full p-3 border rounded-lg text-sm mb-3"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
                      Abbrechen
                    </Button>
                    <Button 
                      onClick={handleReturn}
                      disabled={!returnComment.trim()}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Zurücksenden
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Completed Badge */}
        {task.status === "completed" && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900">Aufgabe abgeschlossen</h3>
                  <p className="text-sm text-green-700">Diese Aufgabe wurde erfolgreich erledigt.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Erstellt am</div>
                  <div className="text-sm text-slate-500">{formatDate(task.createdAt)}</div>
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
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
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
                const statusConf = FILE_STATUS_CONFIG[file.status];
                return (
                  <div 
                    key={file.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                  >
                    {/* File info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{file.name}</div>
                        <div className="text-xs text-slate-400">
                          {file.size} • {file.uploadedBy} • {formatDate(file.uploadedAt)}
                        </div>
                      </div>
                    </div>
                    {/* Status & Actions - own row on mobile */}
                    <div className="flex items-center gap-2 pl-8 sm:pl-0">
                      <Badge className={`text-xs ${statusConf.color} border-0 shrink-0`}>
                        {file.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {file.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                        {file.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                        {statusConf.label}
                      </Badge>
                      {/* Employee can approve/reject pending files */}
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

              {/* Upload Area - only if task is not completed */}
              {task.status !== "completed" && (
                <div className="mt-4 pt-4 border-t">
                  <FileUpload
                    onUpload={async (files) => {
                      // TODO: Upload to MinIO
                      console.log("Uploading files:", files);
                      await new Promise(r => setTimeout(r, 1500));
                    }}
                    maxFiles={5}
                    maxSizeMB={10}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <div className="text-xs text-slate-400 flex gap-4">
          <span>Erstellt: {formatDate(task.createdAt)}</span>
          <span>Aktualisiert: {formatDate(task.updatedAt)}</span>
          <span>Alter: {daysSinceCreation} Tage</span>
        </div>
      </div>

      {/* Task Chat - Desktop: side panel */}
      <div className="hidden lg:flex order-2 flex-shrink-0 h-full">
        <ChatPanel 
          title="KOMMENTARE" 
          taskId={id}
          messages={taskMessages}
          collapsible
        />
      </div>

      {/* Mobile Chat FAB - Opens fullscreen chat */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        {taskMessages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {taskMessages.length}
          </span>
        )}
      </Button>

      {/* Mobile Chat - Fullscreen Overlay */}
      {isChatOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-6 h-14 border-b border-slate-200 shrink-0">
            <div className="max-w-xl mx-auto h-full flex items-center justify-between">
              <h2 className="font-semibold text-lg">Kommentare</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsChatOpen(false)}
                className="h-10 w-10"
              >
                <XCircle className="h-6 w-6" />
              </Button>
            </div>
          </div>
          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel 
              title="KOMMENTARE" 
              taskId={id}
              messages={taskMessages}
              hideHeader
            />
          </div>
        </div>
      )}
    </div>
  );
}
