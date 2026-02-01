"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  Paperclip, 
  Send, 
  File, 
  X, 
  Check, 
  CheckCheck,
  Loader2 
} from "lucide-react";

export interface MessageRead {
  userId: string;
  userName: string | null;
  readAt: Date | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id?: string;
    name: string | null;
    avatar?: string;
    initials: string;
    isCurrentUser: boolean;
  };
  timestamp?: Date;
  createdAt?: Date | null;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: string;
    status?: "pending" | "approved" | "rejected";
  }[];
  reads?: MessageRead[];
}

interface ChatPanelProps {
  title?: string;
  taskId?: string;
  messages?: ChatMessage[];
  onSendMessage?: (content: string, attachments?: File[]) => void;
}

function formatTimestamp(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString("de-DE", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  if (isToday) {
    return `Heute, ${timeStr}`;
  } else if (isYesterday) {
    return `Gestern, ${timeStr}`;
  } else {
    return `${d.toLocaleDateString("de-DE", { 
      day: "2-digit", 
      month: "2-digit",
      year: "numeric"
    })}, ${timeStr}`;
  }
}

const FILE_STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const FILE_STATUS_LABELS = {
  pending: "Wartet auf Freigabe",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
};

export function ChatPanel({ 
  title = "KOMMENTARE", 
  taskId,
  messages: initialMessages,
  onSendMessage 
}: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages from API
  const loadMessages = useCallback(async () => {
    if (!taskId) return;
    
    try {
      setIsLoading(true);
      const res = await fetch(`/api/tasks/${taskId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        
        // Mark messages as read
        for (const msg of data.messages || []) {
          if (!msg.sender.isCurrentUser) {
            fetch(`/api/messages/${msg.id}/read`, { method: "POST" });
          }
        }
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  // Initial load
  useEffect(() => {
    if (taskId && !initialMessages) {
      loadMessages();
    }
  }, [taskId, initialMessages, loadMessages]);

  // Polling for new messages (every 5 seconds)
  useEffect(() => {
    if (!taskId) return;
    
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [taskId, loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() && pendingFiles.length === 0) return;
    if (!taskId) {
      onSendMessage?.(message, pendingFiles);
      setMessage("");
      setPendingFiles([]);
      return;
    }

    try {
      setIsSending(true);
      const res = await fetch(`/api/tasks/${taskId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setMessage("");
        setPendingFiles([]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(file => 
        file.type === "application/pdf" || file.type.startsWith("image/")
      );
      setPendingFiles([...pendingFiles, ...validFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== index));
  };

  // Read status component - WhatsApp style ✓ ✓✓
  const ReadStatus = ({ msg }: { msg: ChatMessage }) => {
    if (!msg.sender.isCurrentUser) return null;
    
    const reads = msg.reads || [];
    const hasBeenRead = reads.length > 0;
    
    return (
      <span className="ml-1 inline-flex items-center" title={
        hasBeenRead 
          ? `Gelesen von: ${reads.map(r => r.userName || "Unbekannt").join(", ")}` 
          : "Gesendet"
      }>
        {hasBeenRead ? (
          <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
        ) : (
          <Check className="w-3.5 h-3.5 text-slate-400" />
        )}
      </span>
    );
  };

  return (
    <div className="w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 px-4 flex items-center justify-between border-b border-slate-200 shrink-0"
      >
        <span className="font-semibold">{title}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {isLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <p className="text-sm">Noch keine Kommentare</p>
                <p className="text-xs mt-1">Schreiben Sie eine Nachricht.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-2", msg.sender.isCurrentUser && "flex-row-reverse")}
                >
                  {!msg.sender.isCurrentUser && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={msg.sender.avatar} />
                      <AvatarFallback className="bg-slate-100 text-xs">
                        {msg.sender.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "flex flex-col gap-1 max-w-[80%]",
                    msg.sender.isCurrentUser && "items-end"
                  )}>
                    {/* Sender name */}
                    {!msg.sender.isCurrentUser && (
                      <span className="text-xs text-slate-500 font-medium">
                        {msg.sender.name || "Unbekannt"}
                      </span>
                    )}
                    
                    {/* Message bubble */}
                    <div
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm",
                        msg.sender.isCurrentUser
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-slate-100 text-slate-700 rounded-bl-none"
                      )}
                    >
                      {msg.content}
                    </div>
                    
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        {msg.attachments.map((att) => (
                          <div 
                            key={att.id}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded border text-xs",
                              att.status ? FILE_STATUS_STYLES[att.status] : "bg-slate-50 border-slate-200"
                            )}
                          >
                            <File className="w-3.5 h-3.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">{att.name}</div>
                              <div className="flex items-center gap-2 text-[10px] opacity-75">
                                <span>{att.size}</span>
                                {att.status && (
                                  <>
                                    <span>•</span>
                                    <span>{FILE_STATUS_LABELS[att.status]}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Timestamp + Read Status */}
                    <span className={cn(
                      "text-[10px] text-slate-400 flex items-center",
                      msg.sender.isCurrentUser && "justify-end"
                    )}>
                      {formatTimestamp(msg.createdAt || msg.timestamp)}
                      <ReadStatus msg={msg} />
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Files Preview */}
          {pendingFiles.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
              <div className="text-xs text-slate-500 mb-1">Anhänge ({pendingFiles.length})</div>
              <div className="flex flex-col gap-1">
                {pendingFiles.map((file, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700"
                  >
                    <File className="w-3 h-3 shrink-0" />
                    <span className="truncate flex-1">{file.name}</span>
                    <button 
                      onClick={() => removeFile(i)}
                      className="p-0.5 hover:bg-blue-100 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Kommentar schreiben..."
                className="flex-1"
                disabled={isSending}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleFileSelect}
                title="Beleg hochladen (PDF, Bilder)"
                disabled={isSending}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSend}
                disabled={(!message.trim() && pendingFiles.length === 0) || isSending}
                title="Senden"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
