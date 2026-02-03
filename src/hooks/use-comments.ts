"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

export interface CommentUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  // For optimistic UI: read status tracking
  isRead?: boolean;
  readBy?: string[];
}

interface UseCommentsOptions {
  taskId: string;
  pollInterval?: number; // ms, 0 to disable
}

export function useComments({ taskId, pollInterval = 5000 }: UseCommentsOptions) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (!res.ok) throw new Error("Fehler beim Laden der Kommentare");
      
      const data = await res.json();
      setComments(data.comments || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Polling for new comments
  useEffect(() => {
    if (pollInterval > 0 && taskId) {
      pollRef.current = setInterval(fetchComments, pollInterval);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [fetchComments, pollInterval, taskId]);

  const sendComment = useCallback(async (content: string): Promise<boolean> => {
    if (!taskId || !session?.user?.id || !content.trim()) return false;

    setSending(true);

    // Optimistic update
    const optimisticId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: optimisticId,
      taskId,
      userId: session.user.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      user: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? "",
        image: session.user.image,
      },
      isRead: true, // Own messages are always read
    };

    setComments((prev) => [...prev, optimisticComment]);

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) throw new Error("Fehler beim Senden");

      const data = await res.json();
      
      // Replace optimistic comment with real one
      setComments((prev) =>
        prev.map((c) => (c.id === optimisticId ? data.comment : c))
      );

      return true;
    } catch (err) {
      // Remove optimistic comment on error
      setComments((prev) => prev.filter((c) => c.id !== optimisticId));
      setError(err instanceof Error ? err.message : "Fehler beim Senden");
      return false;
    } finally {
      setSending(false);
    }
  }, [taskId, session]);

  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Fehler beim Löschen");

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Löschen");
      return false;
    }
  }, [taskId]);

  // Check if a comment is from current user
  const isOwnComment = useCallback((comment: Comment): boolean => {
    return comment.userId === session?.user?.id;
  }, [session?.user?.id]);

  // Get read status for a comment (simplified - in real app would check readBy array)
  const getReadStatus = useCallback((comment: Comment): "sent" | "delivered" | "read" => {
    if (isOwnComment(comment)) {
      // For own messages, check if others have read it
      // For now, mark as "delivered" after creation, "read" if readBy includes others
      if (comment.readBy && comment.readBy.length > 0) {
        return "read";
      }
      return "delivered";
    }
    return "read"; // Received messages are always "read" by definition
  }, [isOwnComment]);

  return {
    comments,
    loading,
    error,
    sending,
    sendComment,
    deleteComment,
    refetch: fetchComments,
    isOwnComment,
    getReadStatus,
  };
}
