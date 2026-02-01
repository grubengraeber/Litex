"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  MessageSquare, 
  FileCheck, 
  FileX, 
  Send, 
  CheckCircle, 
  RotateCcw,
  Upload,
  X,
  Check
} from "lucide-react";

interface Notification {
  id: string;
  type: "new_message" | "task_submitted" | "task_completed" | "task_returned" | "file_uploaded" | "file_approved" | "file_rejected";
  title: string;
  message: string | null;
  taskId: string | null;
  read: boolean;
  createdAt: string;
  task?: {
    id: string;
    bookingText: string | null;
  } | null;
}

const NOTIFICATION_ICONS = {
  new_message: MessageSquare,
  task_submitted: Send,
  task_completed: CheckCircle,
  task_returned: RotateCcw,
  file_uploaded: Upload,
  file_approved: FileCheck,
  file_rejected: FileX,
};

const NOTIFICATION_COLORS = {
  new_message: "text-blue-600 bg-blue-100",
  task_submitted: "text-orange-600 bg-orange-100",
  task_completed: "text-green-600 bg-green-100",
  task_returned: "text-yellow-600 bg-yellow-100",
  file_uploaded: "text-purple-600 bg-purple-100",
  file_approved: "text-green-600 bg-green-100",
  file_rejected: "text-red-600 bg-red-100",
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Polling for new notifications (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: "POST" });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.taskId) {
      router.push(`/tasks/${notification.taskId}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        title="Benachrichtigungen"
      >
        <Bell className="w-5 h-5" />
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-sm">Benachrichtigungen</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:text-blue-700 h-auto py-1"
              >
                <Check className="w-3 h-3 mr-1" />
                Alle gelesen
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Keine Benachrichtigungen</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                const colorClass = NOTIFICATION_COLORS[notification.type] || "text-slate-600 bg-slate-100";
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 last:border-0",
                      notification.read 
                        ? "bg-white hover:bg-slate-50" 
                        : "bg-blue-50/50 hover:bg-blue-50"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn("p-2 rounded-full shrink-0", colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      {notification.task?.bookingText && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          📋 {notification.task.bookingText}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  router.push("/notifications");
                  setIsOpen(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Alle anzeigen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
