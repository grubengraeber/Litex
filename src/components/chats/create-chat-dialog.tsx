"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Search, MessageSquare, Loader2 } from "lucide-react";
import { TRAFFIC_LIGHT_CONFIG, TASK_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskWithoutComments {
  id: string;
  bookingText: string | null;
  status: "open" | "submitted" | "completed";
  trafficLight: "green" | "yellow" | "red";
  period: string | null;
  createdAt: Date;
  company: {
    id: string;
    name: string;
  };
}

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChatDialog({ open, onOpenChange }: CreateChatDialogProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithoutComments[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTasks();
    }
  }, [open]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tasks/without-comments");
      if (!response.ok) throw new Error("Failed to fetch tasks");

      const data = await response.json();
      setTasks(
        data.tasks.map((task: TaskWithoutComments) => ({
          ...task,
          createdAt: new Date(task.createdAt),
        }))
      );
    } catch (error) {
      console.error("Failed to load tasks:", error);
      toast.error("Aufgaben konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = () => {
    if (!selectedTaskId) return;

    // Navigate to the chat page for the selected task
    router.push(`/chats/${selectedTaskId}`);
    onOpenChange(false);
    setSelectedTaskId(null);
    setSearchQuery("");
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.bookingText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Neuen Chat erstellen</DialogTitle>
          <DialogDescription>
            Wählen Sie eine Aufgabe ohne bestehende Kommentare aus, um einen neuen Chat zu starten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Aufgaben durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">
                  {searchQuery
                    ? "Keine Aufgaben gefunden"
                    : "Alle Aufgaben haben bereits Kommentare"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTasks.map((task) => {
                  const trafficConfig = TRAFFIC_LIGHT_CONFIG[task.trafficLight];
                  const statusConfig = TASK_STATUS[task.status];
                  const isSelected = selectedTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={cn(
                        "p-4 cursor-pointer transition-colors hover:bg-slate-50",
                        isSelected && "bg-blue-50 border-l-4 border-l-blue-600"
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={cn(
                              "font-medium text-sm",
                              isSelected ? "text-blue-900" : "text-slate-900"
                            )}
                          >
                            {task.bookingText || "Keine Beschreibung"}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Building2 className="w-3 h-3" />
                          <span>{task.company.name}</span>
                          {task.period && (
                            <>
                              <span>•</span>
                              <Calendar className="w-3 h-3" />
                              <span>{task.period}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${trafficConfig.color}`} />
                          <Badge variant="outline" className="text-xs border-0 px-1.5 py-0">
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedTaskId(null);
              setSearchQuery("");
            }}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleCreateChat}
            disabled={!selectedTaskId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat erstellen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
