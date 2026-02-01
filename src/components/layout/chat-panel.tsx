"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Paperclip, Send } from "lucide-react";

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
}

const mockMessages: Message[] = [
  {
    id: "1",
    content: "Hey, the yes!",
    sender: { name: "Anna", initials: "AM", isCurrentUser: false },
    timestamp: "10:30",
  },
  {
    id: "2",
    content: "Hi, we're working on the new invoicing for this month?",
    sender: { name: "Thomas", avatar: "/avatar.jpg", initials: "TS", isCurrentUser: false },
    timestamp: "10:32",
  },
  {
    id: "3",
    content: "Hann just review expense reports",
    sender: { name: "You", initials: "FT", isCurrentUser: true },
    timestamp: "10:35",
  },
  {
    id: "4",
    content: "Hi please monitor your expense report?",
    sender: { name: "Thomas", avatar: "/avatar.jpg", initials: "TS", isCurrentUser: false },
    timestamp: "10:38",
  },
  {
    id: "5",
    content: "How are we taking our team? 🙌",
    sender: { name: "You", initials: "FT", isCurrentUser: true },
    timestamp: "10:40",
  },
];

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 px-4 flex items-center justify-between border-b border-slate-200"
      >
        <span className="font-semibold">TEAM CHAT</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {mockMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-2", msg.sender.isCurrentUser && "flex-row-reverse")}
              >
                {!msg.sender.isCurrentUser && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={msg.sender.avatar} />
                    <AvatarFallback className="bg-slate-100 text-xs">
                      {msg.sender.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[75%] px-3 py-2 rounded-lg text-sm",
                    msg.sender.isCurrentUser
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-100 text-slate-700 rounded-bl-none"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button size="icon" className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
