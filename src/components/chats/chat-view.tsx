"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatPanel, type ChatMessage } from "@/components/layout/chat-panel";
import { ExternalLink, Building2, Calendar } from "lucide-react";
import { TRAFFIC_LIGHT_CONFIG, TASK_STATUS } from "@/lib/constants";
import { toast } from "sonner";
import { validateFile, compressImage, formatFileSize } from "@/lib/file-utils";

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
  files?: TaskFile[];
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

export function ChatView({ taskId }: { taskId: string }) {
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

        // Load comments
        await loadComments();
      } catch (error) {
        console.error("Failed to load chat:", error);
        toast.error("Chat konnte nicht geladen werden");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  // Poll for new comments
  useEffect(() => {
    if (!currentUserId) return;

    const intervalId = setInterval(() => {
      loadComments().catch(console.error);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, currentUserId]);

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() && !attachments?.length) return;

    try {
      const fileIds: string[] = [];

      // Upload files first if any
      if (attachments && attachments.length > 0) {
        toast.info("Dateien werden hochgeladen...");

        for (const originalFile of attachments) {
          // Step 1: Validate file
          const validation = validateFile(originalFile);
          if (!validation.valid) {
            toast.error(validation.error || "Datei ungültig");
            continue;
          }

          if (validation.warning) {
            toast.info(validation.warning);
          }

          // Step 2: Compress if image
          let file = originalFile;
          if (originalFile.type.startsWith("image/")) {
            try {
              const compressed = await compressImage(originalFile);
              const savedSize = originalFile.size - compressed.size;
              if (savedSize > 0) {
                toast.success(
                  `${originalFile.name} komprimiert: ${formatFileSize(savedSize)} gespart`
                );
              }
              file = compressed;
            } catch (err) {
              console.warn("Compression failed, using original:", err);
              file = originalFile;
            }
          }

          // Step 3: Request presigned upload URL
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
            toast.error(`Upload fehlgeschlagen: ${file.name}`);
            continue;
          }

          const { uploadUrl, storageKey, bucket } = await requestResponse.json();

          // Step 4: Upload file directly to S3/MinIO
          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
          });

          if (!uploadResponse.ok) {
            toast.error(`Speichern fehlgeschlagen: ${file.name}`);
            continue;
          }

          // Step 5: Confirm upload to create database record
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
            toast.error(`Fehler beim Speichern: ${file.name}`);
            continue;
          }

          const { file: uploadedFile } = await confirmResponse.json();
          fileIds.push(uploadedFile.id);
        }

        if (fileIds.length > 0) {
          toast.success(
            `${fileIds.length} ${fileIds.length === 1 ? "Datei" : "Dateien"} hochgeladen`
          );
        }
      }

      // Create comment with attached files
      const commentText = content.trim() || "[Datei hochgeladen]";

      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText,
          fileIds: fileIds.length > 0 ? fileIds : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const { comment: newComment } = await response.json();

      // Optimistically add the new comment to state immediately
      const initials = newComment.user.name
        ? newComment.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        : newComment.user.email.slice(0, 2).toUpperCase();

      const newMessage: ChatMessage = {
        id: newComment.id,
        content: newComment.content,
        sender: {
          name: newComment.user.name || newComment.user.email,
          initials,
          isCurrentUser: true,
        },
        timestamp: new Date(newComment.createdAt),
        attachments: fileIds.length > 0 ? fileIds.map(id => ({
          id,
          name: "[Datei]",
          type: "application/octet-stream",
          size: "",
        })) : undefined,
      };

      setComments(prev => [...prev, newMessage]);
      toast.success("Nachricht gesendet");

      // Refresh in background to get accurate data
      loadComments().catch(console.error);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Nachricht konnte nicht gesendet werden");
    }
  };

  // Handle file download
  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/files?fileId=${fileId}`);
      if (!response.ok) {
        throw new Error("Failed to get download URL");
      }

      const { downloadUrl } = await response.json();

      // Open download URL in new tab
      window.open(downloadUrl, "_blank");
      toast.success(`${fileName} wird heruntergeladen`);
    } catch (error) {
      console.error("Failed to download file:", error);
      toast.error("Datei konnte nicht heruntergeladen werden");
    }
  };

  // Extract loading logic into separate function
  const loadComments = async () => {
    const commentsResponse = await fetch(`/api/tasks/${taskId}/comments`);
    if (!commentsResponse.ok) return;

    const { comments: commentsData } = await commentsResponse.json();

    const chatMessages: ChatMessage[] = commentsData.map((comment: Comment & { files?: TaskFile[] }) => {
      const initials = comment.user.name
        ? comment.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : comment.user.email.slice(0, 2).toUpperCase();

      // Use files attached to comment (from migration)
      const attachments = comment.files?.map((file: TaskFile) => ({
        id: file.id,
        name: file.fileName,
        type: file.mimeType || "application/octet-stream",
        size: formatFileSize(file.fileSize),
      })) || [];

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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Lade Chat...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold text-foreground">Aufgabe nicht gefunden</h2>
      </div>
    );
  }

  const trafficConfig = TRAFFIC_LIGHT_CONFIG[task.trafficLight || "green"];
  const statusConfig = TASK_STATUS[task.status || "open"];

  return (
    <div className="h-full flex flex-col">
      {/* Header with task info */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${trafficConfig?.color || "bg-green-500"}`} />
            <Badge className={`${statusConfig?.color || "bg-muted text-foreground"} border-0 text-xs`}>
              {statusConfig?.label || "Unbekannt"}
            </Badge>
          </div>
          <Link href={`/tasks/${taskId}`} target="_blank">
            <Button variant="ghost" size="sm" className="h-7">
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Aufgabe
            </Button>
          </Link>
        </div>
        <h2 className="font-semibold text-foreground mb-1 line-clamp-1">
          {task.bookingText || "Keine Beschreibung"}
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span>{task.company.name}</span>
          </div>
          {task.period && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{task.period}</span>
            </div>
          )}
          {task.amount && (
            <span className="font-medium">€ {task.amount}</span>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 min-h-0">
        <ChatPanel
          taskId={taskId}
          messages={comments}
          onSendMessage={handleSendMessage}
          onFileClick={handleFileDownload}
          hideHeader
        />
      </div>
    </div>
  );
}
