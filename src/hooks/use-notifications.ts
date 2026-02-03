"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type NotificationType = "message" | "task" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  taskId?: string;
  link?: string;
}

interface UseNotificationsOptions {
  pollInterval?: number; // ms, 0 to disable
}

export function useNotifications({ pollInterval = 30000 }: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      
      if (res.status === 404) {
        // API not implemented yet - use empty state
        setNotifications([]);
        setError(null);
        return;
      }
      
      if (!res.ok) throw new Error("Fehler beim Laden der Benachrichtigungen");
      
      const data = await res.json();
      setNotifications(data.notifications || []);
      setError(null);
    } catch (err) {
      // Don't show error if API just doesn't exist yet
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setNotifications([]);
      } else {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling
  useEffect(() => {
    if (pollInterval > 0) {
      pollRef.current = setInterval(fetchNotifications, pollInterval);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [fetchNotifications, pollInterval]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );

    try {
      const res = await fetch(`/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, isRead: true }),
      });

      if (res.status === 404) {
        // API not implemented yet
        return true;
      }

      if (!res.ok) throw new Error("Fehler beim Aktualisieren");
      return true;
    } catch {
      // Revert optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: false } : n))
      );
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    // Optimistic update
    const previousState = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      const res = await fetch(`/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (res.status === 404) {
        // API not implemented yet
        return true;
      }

      if (!res.ok) throw new Error("Fehler beim Aktualisieren");
      return true;
    } catch {
      // Revert optimistic update
      setNotifications(previousState);
      return false;
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
