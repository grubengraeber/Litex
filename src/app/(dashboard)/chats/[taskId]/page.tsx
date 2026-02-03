"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatPanel, type ChatMessage } from "@/components/layout/chat-panel";
import { ArrowLeft, ExternalLink, Building2, Calendar } from "lucide-react";
import { TRAFFIC_LIGHT_CONFIG, TASK_STATUS } from "@/lib/constants";
import { toast } from "sonner";

interface Task {
  id: string;
  bookingText: string | null;
  amount: string | null;
  period: string | null;
  status: "open" | "submitted" | "completed";
  trafficLight: "green" | "yellow" | "red";
  createdAt: Date;
  company: {
    id: string;
    name: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface TaskFile {
  id: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
  };
}

export default function ChatDetailPage({ params }: { params: { taskId: string } }) {
  const { taskId } = params;
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Fetch task and comments
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch task details
        const taskResponse = await fetch(`/api/tasks/${taskId}`);
        if (!taskResponse.ok) throw new Error("Failed to fetch task");
        const { task: taskData } = await taskResponse.json();
        setTask({
          ...taskData,
          createdAt: new Date(taskData.createdAt),
        });

        // Get current user ID
        const session = await fetch("/api/auth/session").then(r => r.json());
        const userId = session?.user?.id || "";
        setCurrentUserId(userId);

        // Fetch comments
        const commentsResponse = await fetch(`/api/tasks/${taskId}/comments`);
        if (!commentsResponse.ok) throw new Error("Failed to fetch comments");
        const { comments: commentsData } = await commentsResponse.json();

        // Fetch files
        const filesResponse = await fetch(`/api/tasks/${taskId}/files`);
        let taskFiles: TaskFile[] = [];
        if (filesResponse.ok) {
          const { files } = await filesResponse.json() as { files: TaskFile[] };
          taskFiles = files.map((file) => ({
            ...file,
            createdAt: new Date(file.createdAt),
          }));
        }

        // Transform to ChatMessage format and attach files
        const chatMessages: ChatMessage[] = commentsData.map((comment: Comment) => {
          const initials = comment.user.name
            ? comment.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : comment.user.email.slice(0, 2).toUpperCase();

          const commentTime = new Date(comment.createdAt).getTime();

          // Find files created within 1 minute of this comment
          const relatedFiles = taskFiles.filter(file => {
            const fileTime = new Date(file.createdAt).getTime();
            const timeDiff = Math.abs(fileTime - commentTime);
            return timeDiff < 60000; // Within 1 minute
          });

          const attachments = relatedFiles.map(file => ({
            id: file.id,
            name: file.fileName,
            type: file.mimeType || 'application/octet-stream',
            size: file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Unknown',
          }));

          return {
            id: comment.id,
            content: comment.content,
            sender: {
              name: comment.user.name || comment.user.email,
              initials,
              isCurrentUser: comment.user.id === userId,
            },
            timestamp: new Date(comment.createdAt),
            attachments: attachments.length > 0 ? attachments : undefined,
          };
        });

        setComments(chatMessages);
      } catch (error) {
        console.error("Failed to load chat:", error);
        toast.error("Chat konnte nicht geladen werden");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [taskId]);

  // Poll for new comments and files
  useEffect(() => {
    if (!currentUserId) return;

    const intervalId = setInterval(async () => {
      try {
        // Fetch comments
        const response = await fetch(`/api/tasks/${taskId}/comments`);
        if (!response.ok) return;
        const { comments: commentsData } = await response.json();

        // Fetch files
        const filesResponse = await fetch(`/api/tasks/${taskId}/files`);
        let taskFiles: TaskFile[] = [];
        if (filesResponse.ok) {
          const { files } = await filesResponse.json() as { files: TaskFile[] };
          taskFiles = files.map((file) => ({
            ...file,
            createdAt: new Date(file.createdAt),
          }));
        }

        const chatMessages: ChatMessage[] = commentsData.map((comment: Comment) => {
          const initials = comment.user.name
            ? comment.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            : comment.user.email.slice(0, 2).toUpperCase();

          const commentTime = new Date(comment.createdAt).getTime();

          // Find files created within 1 minute of this comment
          const relatedFiles = taskFiles.filter(file => {
            const fileTime = new Date(file.createdAt).getTime();
            const timeDiff = Math.abs(fileTime - commentTime);
            return timeDiff < 60000; // Within 1 minute
          });

          const attachments = relatedFiles.map(file => ({
            id: file.id,
            name: file.fileName,
            type: file.mimeType || 'application/octet-stream',
            size: file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Unknown',
          }));

          return {
            id: comment.id,
            content: comment.content,
            sender: {
              name: comment.user.name || comment.user.email,
              initials,
              isCurrentUser: comment.user.id === currentUserId,
            },
            timestamp: new Date(comment.createdAt),
            attachments: attachments.length > 0 ? attachments : undefined,
          };
        });

        setComments(chatMessages);
      } catch (error) {
        console.error("Failed to refresh comments:", error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
  }, [taskId, currentUserId]);

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() && !attachments?.length) return;

    try {
      const uploadedFiles: { name: string; size: number; type: string }[] = [];

      // Upload files first if any
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          // Step 1: Request presigned upload URL
          const requestResponse = await fetch(`/api/tasks/${taskId}/files?action=requestUpload`, {
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
          const confirmResponse = await fetch(`/api/tasks/${taskId}/files?action=confirmUpload`, {
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

          uploadedFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
          });
        }

        toast.success(`${attachments.length} ${attachments.length === 1 ? 'Datei' : 'Dateien'} hochgeladen`);
      }

      // Create comment with file information
      let commentText = content.trim();

      // If files were uploaded, add them to the comment
      if (uploadedFiles.length > 0 && !commentText) {
        commentText = uploadedFiles.map(f => `📎 ${f.name}`).join('\n');
      } else if (uploadedFiles.length > 0) {
        commentText += '\n\n' + uploadedFiles.map(f => `📎 ${f.name}`).join('\n');
      }

      // Send comment
      if (commentText) {
        const response = await fetch(`/api/tasks/${taskId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: commentText }),
        });

        if (!response.ok) throw new Error("Failed to send message");
      }

      // Refresh comments and files
      const commentsResponse = await fetch(`/api/tasks/${taskId}/comments`);
      const { comments: commentsData } = await commentsResponse.json();

      // Fetch files
      const filesResponse = await fetch(`/api/tasks/${taskId}/files`);
      let taskFiles: TaskFile[] = [];
      if (filesResponse.ok) {
        const { files } = await filesResponse.json() as { files: TaskFile[] };
        taskFiles = files.map((file) => ({
          ...file,
          createdAt: new Date(file.createdAt),
        }));
      }

      const chatMessages: ChatMessage[] = commentsData.map((comment: Comment) => {
        const initials = comment.user.name
          ? comment.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          : comment.user.email.slice(0, 2).toUpperCase();

        const commentTime = new Date(comment.createdAt).getTime();

        // Find files created within 1 minute of this comment
        const relatedFiles = taskFiles.filter(file => {
          const fileTime = new Date(file.createdAt).getTime();
          const timeDiff = Math.abs(fileTime - commentTime);
          return timeDiff < 60000; // Within 1 minute
        });

        const attachments = relatedFiles.map(file => ({
          id: file.id,
          name: file.fileName,
          type: file.mimeType || 'application/octet-stream',
          size: file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Unknown',
        }));

        return {
          id: comment.id,
          content: comment.content,
          sender: {
            name: comment.user.name || comment.user.email,
            initials,
            isCurrentUser: comment.user.id === currentUserId,
          },
          timestamp: new Date(comment.createdAt),
          attachments: attachments.length > 0 ? attachments : undefined,
        };
      });

      setComments(chatMessages);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Nachricht konnte nicht gesendet werden");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Lade Chat...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold text-slate-700">Aufgabe nicht gefunden</h2>
        <Link href="/chats" className="mt-4">
          <Button>Zurück zu Chats</Button>
        </Link>
      </div>
    );
  }

  const trafficConfig = TRAFFIC_LIGHT_CONFIG[task.trafficLight || "green"];
  const statusConfig = TASK_STATUS[task.status || "open"];

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Header with task info */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/chats">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Alle Chats
            </Button>
          </Link>
          <Link href={`/tasks/${taskId}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Zur Aufgabe
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${trafficConfig?.color || "bg-green-500"}`} />
                  <Badge className={`${statusConfig?.color || "bg-slate-100 text-slate-700"} border-0`}>
                    {statusConfig?.label || "Unbekannt"}
                  </Badge>
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">
                  {task.bookingText || "Keine Beschreibung"}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span>{task.company.name}</span>
                  </div>
                  {task.period && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{task.period}</span>
                    </div>
                  )}
                  {task.amount && (
                    <span className="font-medium">€ {task.amount}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 min-h-0">
        <Card className="h-full">
          <ChatPanel
            taskId={taskId}
            messages={comments}
            onSendMessage={handleSendMessage}
            hideHeader
          />
        </Card>
      </div>
    </div>
  );
}
