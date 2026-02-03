"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChatPanel, type ChatMessage } from "@/components/layout/chat-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import {
  TRAFFIC_LIGHT_CONFIG,
  TASK_STATUS,
} from "@/lib/constants";
import { useRole } from "@/hooks/use-role";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  FileText,
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
import {
  fetchTaskDetails,
  fetchTaskComments,
  addComment,
  submitTask,
  completeTask,
  returnTaskToCustomer,
} from "./actions";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  bookingText: string | null;
  amount: string | null;
  documentDate: string | null;
  bookingDate: string | null;
  period: string | null;
  status: "open" | "submitted" | "completed";
  trafficLight: "green" | "yellow" | "red";
  createdAt: Date;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
  };
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  files: Array<{
    id: string;
    fileName: string;
    fileSize: number | null;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
    };
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { isEmployee, isCustomer, permissions } = useRole();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Fetch task details
  useEffect(() => {
    const loadTask = async () => {
      try {
        const taskData = await fetchTaskDetails(id);
        setTask(taskData as unknown as Task);

        // Get current user ID from first comment if available
        const session = await fetch("/api/auth/session").then(r => r.json());
        setCurrentUserId(session?.user?.id || "");
      } catch (error) {
        console.error("Failed to fetch task:", error);
        toast({
          title: "Fehler",
          description: "Aufgabe konnte nicht geladen werden",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [id, toast]);

  // Fetch comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const commentsData = await fetchTaskComments(id);

        // Transform to ChatMessage format
        const chatMessages: ChatMessage[] = commentsData.map((comment) => {
          const initials = comment.user.name
            ? comment.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : comment.user.email.slice(0, 2).toUpperCase();

          return {
            id: comment.id,
            content: comment.content,
            sender: {
              name: comment.user.name || comment.user.email,
              initials,
              isCurrentUser: comment.user.id === currentUserId,
            },
            timestamp: comment.createdAt ? new Date(comment.createdAt) : new Date(),
          };
        });

        setComments(chatMessages);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
    };

    if (currentUserId) {
      loadComments();

      // Poll for new comments every 10 seconds
      const interval = setInterval(loadComments, 10000);
      return () => clearInterval(interval);
    }
  }, [id, currentUserId]);

  // Handle sending messages
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() && !attachments?.length) return;

    try {
      // Send comment
      if (content.trim()) {
        await addComment(id, content);
      }

      // TODO: Handle file attachments
      if (attachments?.length) {
        console.log("Uploading attachments:", attachments);
        // Upload via existing API route
      }

      // Refresh comments
      const commentsData = await fetchTaskComments(id);
      const chatMessages: ChatMessage[] = commentsData.map((comment) => {
        const initials = comment.user.name
          ? comment.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          : comment.user.email.slice(0, 2).toUpperCase();

        return {
          id: comment.id,
          content: comment.content,
          sender: {
            name: comment.user.name || comment.user.email,
            initials,
            isCurrentUser: comment.user.id === currentUserId,
          },
          timestamp: comment.createdAt ? new Date(comment.createdAt) : new Date(),
        };
      });
      setComments(chatMessages);

      toast({
        title: "Kommentar gesendet",
        description: "Ihr Kommentar wurde erfolgreich hinzugefügt",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Fehler",
        description: "Kommentar konnte nicht gesendet werden",
        variant: "destructive",
      });
    }
  };

  // Action handlers
  const handleSubmit = async () => {
    try {
      await submitTask(id);
      const updatedTask = await fetchTaskDetails(id);
      setTask(updatedTask as unknown as Task);
      toast({
        title: "Eingereicht",
        description: "Aufgabe wurde erfolgreich eingereicht",
      });
    } catch (error) {
      console.error("Failed to submit task:", error);
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht eingereicht werden",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    try {
      await completeTask(id);
      const updatedTask = await fetchTaskDetails(id);
      setTask(updatedTask as unknown as Task);
      toast({
        title: "Abgeschlossen",
        description: "Aufgabe wurde erfolgreich abgeschlossen",
      });
    } catch (error) {
      console.error("Failed to complete task:", error);
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht abgeschlossen werden",
        variant: "destructive",
      });
    }
  };

  const handleReturn = async () => {
    if (!returnComment.trim()) return;

    try {
      await returnTaskToCustomer(id, returnComment);
      const updatedTask = await fetchTaskDetails(id);
      setTask(updatedTask as unknown as Task);
      setShowReturnDialog(false);
      setReturnComment("");
      toast({
        title: "Zurückgesendet",
        description: "Aufgabe wurde an den Kunden zurückgesendet",
      });
    } catch (error) {
      console.error("Failed to return task:", error);
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht zurückgesendet werden",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      // Upload files using the two-step process (request URL → upload → confirm)
      for (const file of files) {
        // Step 1: Request presigned upload URL
        const requestResponse = await fetch(`/api/tasks/${id}/files?action=requestUpload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          }),
        });

        if (!requestResponse.ok) {
          throw new Error("Failed to request upload URL");
        }

        const { uploadUrl, storageKey, bucket } = await requestResponse.json();

        // Step 2: Upload file directly to S3/MinIO
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to storage");
        }

        // Step 3: Confirm upload to create database record
        const confirmResponse = await fetch(`/api/tasks/${id}/files?action=confirmUpload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storageKey,
            bucket,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
          }),
        });

        if (!confirmResponse.ok) {
          throw new Error("Failed to confirm upload");
        }
      }

      // Refresh task to get updated files
      const updatedTask = await fetchTaskDetails(id);
      setTask(updatedTask as unknown as Task);

      toast({
        title: "Hochgeladen",
        description: `${files.length} Datei(en) erfolgreich hochgeladen`,
      });
    } catch (error) {
      console.error("Failed to upload files:", error);
      toast({
        title: "Fehler",
        description: "Dateien konnten nicht hochgeladen werden",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Lade Aufgabe...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold text-slate-700">Aufgabe nicht gefunden</h2>
        <p className="text-slate-500 mt-2">Die angeforderte Aufgabe existiert nicht.</p>
        <Link href="/tasks" className="mt-4">
          <Button>Zurück zur Übersicht</Button>
        </Link>
      </div>
    );
  }

  // Calculate traffic light
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const trafficLight = task.trafficLight;
  const trafficConfig = TRAFFIC_LIGHT_CONFIG[trafficLight];
  const statusConfig = TASK_STATUS[task.status];

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
          <h1 className="text-2xl font-bold text-slate-900">
            {task.bookingText || "Keine Beschreibung"}
          </h1>
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
                <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Mandant</div>
                  <div className="text-sm text-slate-500">{task.company.name}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Erstellt am</div>
                  <div className="text-sm text-slate-500">{formatDate(task.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Zeitraum</div>
                  <div className="text-sm text-slate-500">{task.period || "Nicht zugewiesen"}</div>
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
                  <div className="text-sm text-slate-500">{task.bookingText || "Nicht vorhanden"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Euro className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Betrag</div>
                  <div className="text-sm text-slate-500">
                    € {task.amount || "0.00"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Belegdatum</div>
                  <div className="text-sm text-slate-500">
                    {task.documentDate ? formatDate(task.documentDate) : "Nicht vorhanden"}
                  </div>
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
              Belege ({task.files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {task.files.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                >
                  {/* File info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{file.fileName}</div>
                      <div className="text-xs text-slate-400">
                        {file.fileSize && formatFileSize(file.fileSize)} • {file.user.name || "Unbekannt"} • {formatDate(file.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Upload Area - only if task is not completed */}
              {task.status !== "completed" && (
                <div className="mt-4 pt-4 border-t">
                  <FileUpload
                    onUpload={handleFileUpload}
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
          messages={comments}
          onSendMessage={handleSendMessage}
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
        {comments.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {comments.length}
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
              messages={comments}
              onSendMessage={handleSendMessage}
              hideHeader
            />
          </div>
        </div>
      )}
    </div>
  );
}
