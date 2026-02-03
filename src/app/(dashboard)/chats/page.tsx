"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Building2, Search } from "lucide-react";
import { TRAFFIC_LIGHT_CONFIG, TASK_STATUS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatView } from "@/components/chats/chat-view";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

interface TaskWithComments {
  id: string;
  bookingText: string | null;
  status: "open" | "submitted" | "completed";
  trafficLight: "green" | "yellow" | "red";
  createdAt: Date;
  company: {
    id: string;
    name: string;
  };
  lastComment: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  } | null;
  commentCount: number;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? "en" : ""}`;

  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

function ChatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTaskId = searchParams.get("task");

  const [tasks, setTasks] = useState<TaskWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/tasks?includeComments=true");
        if (!response.ok) throw new Error("Failed to fetch tasks");

        const data = (await response.json()) as TaskWithComments[];

        const tasksWithComments = data
          .filter((task) => task.commentCount > 0)
          .map((task) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            lastComment: task.lastComment
              ? {
                  ...task.lastComment,
                  createdAt: new Date(task.lastComment.createdAt),
                }
              : null,
          }))
          .sort((a, b) => {
            const aTime = a.lastComment
              ? new Date(a.lastComment.createdAt).getTime()
              : 0;
            const bTime = b.lastComment
              ? new Date(b.lastComment.createdAt).getTime()
              : 0;
            return bTime - aTime;
          });

        setTasks(tasksWithComments);

        // Auto-select first task if none selected
        if (!selectedTaskId && tasksWithComments.length > 0) {
          router.push(`/chats?task=${tasksWithComments[0].id}`);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [selectedTaskId, router]);

  // Close mobile sheet when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileSheetOpen) {
        setMobileSheetOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileSheetOpen]);

  const filteredTasks = tasks.filter(
    (task) =>
      task.bookingText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Lade Chats...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">
          Keine Chats vorhanden
        </h2>
        <p className="text-slate-500">
          Es gibt noch keine Kommentare zu Aufgaben.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 -m-6">
      {/* Left Sidebar - Chat List */}
      <div className="w-full md:w-96 border-r border-slate-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900 mb-3">Chats</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Chats durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTasks.map((task) => {
            const trafficConfig = TRAFFIC_LIGHT_CONFIG[task.trafficLight];
            const statusConfig = TASK_STATUS[task.status];
            const lastCommentUser = task.lastComment?.user;
            const initials = lastCommentUser?.name
              ? lastCommentUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : lastCommentUser?.email.slice(0, 2).toUpperCase() || "?";

            const isSelected = selectedTaskId === task.id;

            return (
              <div
                key={task.id}
                onClick={() => {
                  router.push(`/chats?task=${task.id}`);
                  // Only open sheet on mobile (< 768px)
                  if (window.innerWidth < 768) {
                    setMobileSheetOpen(true);
                  }
                }}
                className={cn(
                  "p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50",
                  isSelected && "bg-blue-50 border-l-4 border-l-blue-600"
                )}
              >
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3
                        className={cn(
                          "font-medium truncate text-sm",
                          isSelected ? "text-blue-900" : "text-slate-900"
                        )}
                      >
                        {task.bookingText || "Keine Beschreibung"}
                      </h3>
                      {task.lastComment && (
                        <span className="text-xs text-slate-400 shrink-0">
                          {formatRelativeTime(task.lastComment.createdAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{task.company.name}</span>
                    </div>

                    {task.lastComment && (
                      <p className="text-sm text-slate-600 line-clamp-1 mb-1">
                        {task.lastComment.content}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${trafficConfig.color}`}
                      />
                      <Badge
                        variant="outline"
                        className="text-xs border-0 px-1.5 py-0"
                      >
                        {statusConfig.label}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MessageSquare className="w-3 h-3" />
                        <span>{task.commentCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Side - Chat Content (Desktop) */}
      <div className="flex-1 bg-slate-50 hidden md:flex flex-col">
        {selectedTaskId ? (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-500">Lade Chat...</div>
            </div>
          }>
            <ChatView taskId={selectedTaskId} />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Wählen Sie einen Chat
            </h2>
            <p className="text-slate-500">
              Klicken Sie auf eine Unterhaltung, um die Nachrichten anzuzeigen.
            </p>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      <Sheet open={mobileSheetOpen && !!selectedTaskId} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] p-0 md:hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 pr-16">
            <SheetTitle className="text-lg font-semibold">
              Chat
            </SheetTitle>
          </div>
          {selectedTaskId && (
            <div className="h-[calc(90vh-4rem)] overflow-hidden">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-slate-500">Lade Chat...</div>
                </div>
              }>
                <ChatView taskId={selectedTaskId} />
              </Suspense>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Lade Chats...</div>
      </div>
    }>
      <ChatsContent />
    </Suspense>
  );
}
