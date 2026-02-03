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

        // Transform to ChatMessage format
        const chatMessages: ChatMessage[] = commentsData.map((comment: Comment) => {
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
              isCurrentUser: comment.user.id === userId,
            },
            timestamp: new Date(comment.createdAt),
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

  // Poll for new comments
  useEffect(() => {
    if (!currentUserId) return;

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}/comments`);
        if (!response.ok) return;

        const commentsData = await response.json();
        const chatMessages: ChatMessage[] = commentsData.map((comment: Comment) => {
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
            timestamp: new Date(comment.createdAt),
          };
        });

        setComments(chatMessages);
      } catch (error) {
        console.error("Failed to refresh comments:", error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
  }, [taskId, currentUserId]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Refresh comments
      const commentsResponse = await fetch(`/api/tasks/${taskId}/comments`);
      const commentsData = await commentsResponse.json();

      const chatMessages: ChatMessage[] = commentsData.map((comment: Comment) => {
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
          timestamp: new Date(comment.createdAt),
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
