"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, Paperclip, Send, File, X, MessageSquare } from "lucide-react";

export interface ChatMessage {
  id: string;
  content: string;
  sender: {
    name: string;
    avatar?: string;
    initials: string;
    isCurrentUser: boolean;
  };
  timestamp: Date;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: string;
    status?: "pending" | "approved" | "rejected";
  }[];
}

interface ChatPanelProps {
  title?: string;
  taskId?: string;
  messages?: ChatMessage[];
  onSendMessage?: (content: string, attachments?: File[]) => void;
  /** Allow collapsing the entire panel horizontally */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString("de-DE", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  if (isToday) {
    return `Heute, ${timeStr}`;
  } else if (isYesterday) {
    return `Gestern, ${timeStr}`;
  } else {
    return `${date.toLocaleDateString("de-DE", { 
      day: "2-digit", 
      month: "2-digit",
      year: "numeric"
    })}, ${timeStr}`;
  }
}

const defaultMessages: ChatMessage[] = [
  {
    id: "1",
    content: "Ich habe den Beleg hochgeladen. Bitte prüfen.",
    sender: { name: "Max Mustermann", initials: "MM", isCurrentUser: false },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    attachments: [
      { id: "a1", name: "Rechnung_2025_001.pdf", type: "pdf", size: "245 KB", status: "pending" }
    ]
  },
  {
    id: "2",
    content: "Danke! Ich schaue mir das gleich an.",
    sender: { name: "Anna Müller", initials: "AM", isCurrentUser: true },
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },
  {
    id: "3",
    content: "Der Beleg wurde freigegeben. ✓",
    sender: { name: "Anna Müller", initials: "AM", isCurrentUser: true },
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
  },
];

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
  title = "TEAM CHAT", 
  taskId,
  messages = defaultMessages,
  onSendMessage,
  collapsible = false,
  defaultCollapsed = false,
}: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [message, setMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (message.trim() || pendingFiles.length > 0) {
      onSendMessage?.(message, pendingFiles);
      setMessage("");
      setPendingFiles([]);
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
      // Only allow PDF and images
      const validFiles = Array.from(files).filter(file => 
        file.type === "application/pdf" || file.type.startsWith("image/")
      );
      setPendingFiles([...pendingFiles, ...validFiles]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== index));
  };

  // Collapsed state: show only a thin sidebar with expand button
  if (collapsible && isCollapsed) {
    return (
      <div className="w-12 bg-white border-l border-slate-200 flex flex-col h-full">
        <button
          onClick={() => setIsCollapsed(false)}
          className="h-14 flex items-center justify-center border-b border-slate-200 hover:bg-slate-50 transition-colors"
          title="Chat öffnen"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div className="flex-1 flex flex-col items-center pt-4 gap-2">
          <MessageSquare className="w-5 h-5 text-slate-400" />
          {messages.length > 0 && (
            <span className="text-xs text-slate-500 font-medium">{messages.length}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white border-l border-slate-200 flex flex-col h-full transition-all duration-200",
      collapsible ? "w-80" : "w-80"
    )}>
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 shrink-0">
        {collapsible && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 -ml-1 mr-2 hover:bg-slate-100 rounded transition-colors"
            title="Chat ausblenden"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between"
        >
          <span className="font-semibold">
            {taskId ? "KOMMENTARE" : title}
          </span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>
      </div>

      {isOpen && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <p className="text-sm">Noch keine Kommentare</p>
                <p className="text-xs mt-1">Schreiben Sie eine Nachricht oder laden Sie einen Beleg hoch.</p>
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
                        {msg.sender.name}
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
                    
                    {/* Timestamp */}
                    <span className={cn(
                      "text-[10px] text-slate-400",
                      msg.sender.isCurrentUser && "text-right"
                    )}>
                      {formatTimestamp(msg.timestamp)}
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
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSend}
                disabled={!message.trim() && pendingFiles.length === 0}
                title="Senden"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              PDF und Bilder erlaubt • Belege werden zur Freigabe eingereicht
            </p>
          </div>
        </>
      )}
    </div>
  );
}
