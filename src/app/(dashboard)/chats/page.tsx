"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Building2, Clock } from "lucide-react";
import { TRAFFIC_LIGHT_CONFIG, TASK_STATUS } from "@/lib/constants";

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
    year: "numeric",
  });
}

export default function ChatsPage() {
  const [tasks, setTasks] = useState<TaskWithComments[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Fetch all tasks with comments
        const response = await fetch("/api/tasks?includeComments=true");
        if (!response.ok) throw new Error("Failed to fetch tasks");

        const data = await response.json() as TaskWithComments[];

        // Filter tasks that have at least one comment and sort by last comment date
        const tasksWithComments = data
          .filter((task) => task.commentCount > 0)
          .map((task) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            lastComment: task.lastComment ? {
              ...task.lastComment,
              createdAt: new Date(task.lastComment.createdAt),
            } : null,
          }))
          .sort((a, b) => {
            const aTime = a.lastComment ? new Date(a.lastComment.createdAt).getTime() : 0;
            const bTime = b.lastComment ? new Date(b.lastComment.createdAt).getTime() : 0;
            return bTime - aTime;
          });

        setTasks(tasksWithComments);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

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
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Keine Chats vorhanden</h2>
        <p className="text-slate-500">
          Es gibt noch keine Kommentare zu Aufgaben.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chats</h1>
          <p className="text-sm text-slate-500 mt-1">
            {tasks.length} {tasks.length === 1 ? "Unterhaltung" : "Unterhaltungen"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
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

          return (
            <Link key={task.id} href={`/chats/${task.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <Avatar className="w-10 h-10 shrink-0 mt-1">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header: Task title & badges */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-slate-900 truncate">
                          {task.bookingText || "Keine Beschreibung"}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`w-2 h-2 rounded-full ${trafficConfig.color}`} />
                          <Badge
                            variant="outline"
                            className={`${statusConfig.color} border-0 text-xs`}
                          >
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Company */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                        <Building2 className="w-3 h-3" />
                        <span>{task.company.name}</span>
                      </div>

                      {/* Last comment preview */}
                      {task.lastComment && (
                        <div className="mb-2">
                          <p className="text-sm text-slate-600 line-clamp-2">
                            <span className="font-medium">
                              {task.lastComment.user.name || task.lastComment.user.email}:
                            </span>{" "}
                            {task.lastComment.content}
                          </p>
                        </div>
                      )}

                      {/* Footer: Comment count & time */}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>
                            {task.commentCount} {task.commentCount === 1 ? "Kommentar" : "Kommentare"}
                          </span>
                        </div>
                        {task.lastComment && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatRelativeTime(task.lastComment.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
