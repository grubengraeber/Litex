"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Paperclip, Send, Image as ImageIcon, File } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: {
    name: string;
    avatar?: string;
    initials: string;
    isCurrentUser: boolean;
  };
  timestamp: string;
  attachments?: {
    name: string;
    type: "image" | "file";
    url?: string;
  }[];
}

interface ChatPanelProps {
  title?: string;
  taskId?: string;
  messages?: Message[];
  onSendMessage?: (content: string, attachments?: File[]) => void;
}

const defaultMessages: Message[] = [
  {
    id: "1",
    content: "Hallo, wie geht es voran?",
    sender: { name: "Anna", initials: "AM", isCurrentUser: false },
    timestamp: "10:30",
  },
  {
    id: "2",
    content: "Arbeiten wir noch an den Rechnungen für diesen Monat?",
    sender: { name: "Thomas", avatar: "/avatar.jpg", initials: "TS", isCurrentUser: false },
    timestamp: "10:32",
  },
  {
    id: "3",
    content: "Ja, ich prüfe gerade die Spesenberichte",
    sender: { name: "Du", initials: "FT", isCurrentUser: true },
    timestamp: "10:35",
  },
  {
    id: "4",
    content: "Kannst du mir bitte den aktuellen Bericht schicken?",
    sender: { name: "Thomas", avatar: "/avatar.jpg", initials: "TS", isCurrentUser: false },
    timestamp: "10:38",
  },
  {
    id: "5",
    content: "Läuft super bei uns! 🙌",
    sender: { name: "Du", initials: "FT", isCurrentUser: true },
    timestamp: "10:40",
  },
];

export function ChatPanel({ 
  title = "TEAM CHAT", 
  taskId,
  messages = defaultMessages,
  onSendMessage 
}: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        setPendingFiles([...pendingFiles, ...Array.from(files)]);
      }
    };
    input.click();
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 px-4 flex items-center justify-between border-b border-slate-200 shrink-0"
      >
        <span className="font-semibold">
          {taskId ? "AUFGABEN-CHAT" : title}
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((msg) => (
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
                <div className="flex flex-col gap-1 max-w-[75%]">
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
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {msg.attachments.map((att, i) => (
                        <div 
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600"
                        >
                          {att.type === "image" ? (
                            <ImageIcon className="w-3 h-3" />
                          ) : (
                            <File className="w-3 h-3" />
                          )}
                          <span className="truncate max-w-20">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <span className={cn(
                    "text-xs text-slate-400",
                    msg.sender.isCurrentUser && "text-right"
                  )}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Files Preview */}
          {pendingFiles.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100">
              <div className="flex flex-wrap gap-1">
                {pendingFiles.map((file, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-600"
                  >
                    <File className="w-3 h-3" />
                    <span className="truncate max-w-20">{file.name}</span>
                    <button 
                      onClick={() => setPendingFiles(pendingFiles.filter((_, idx) => idx !== i))}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
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
                placeholder="Nachricht schreiben..."
                className="flex-1"
              />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleFileSelect}
                title="Anhang hinzufügen"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSend}
                title="Senden"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
