"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useRole } from "@/hooks/use-role";
import {
  Search,
  Building2,
  FileText,
  X,
  Command,
  CornerDownLeft,
} from "lucide-react";
import { TASK_STATUS, TRAFFIC_LIGHT_CONFIG, calculateTrafficLight } from "@/lib/constants";

interface SearchTask {
  id: string;
  bookingText: string | null;
  amount: string | null;
  status: "open" | "submitted" | "completed";
  createdAt: string;
  company: {
    id: string;
    name: string;
  };
}

interface SearchCompany {
  id: string;
  name: string;
  bmdId: string | null;
  finmaticsId: string | null;
  isActive: boolean;
}

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className = "" }: GlobalSearchProps) {
  const router = useRouter();
  const { isEmployee } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<SearchTask[]>([]);
  const [companies, setCompanies] = useState<SearchCompany[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }

      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    async function search() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setTasks([]);
        setCompanies([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`
        );
        const data = await res.json();

        if (res.ok) {
          setTasks(data.tasks || []);
          setCompanies(data.companies || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }

    search();
  }, [debouncedQuery]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [tasks, companies]);

  // Keyboard navigation
  const handleKeyNav = (e: React.KeyboardEvent) => {
    const totalResults = companies.length + tasks.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % totalResults);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + totalResults) % totalResults);
    } else if (e.key === "Enter" && totalResults > 0) {
      e.preventDefault();
      if (selectedIndex < companies.length) {
        navigateTo(`/companies/${companies[selectedIndex].id}`);
      } else {
        navigateTo(`/tasks/${tasks[selectedIndex - companies.length].id}`);
      }
    }
  };

  const navigateTo = useCallback(
    (path: string) => {
      router.push(path);
      handleClose();
    },
    [router]
  );

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setTasks([]);
    setCompanies([]);
    setSelectedIndex(0);
  };

  const totalResults = companies.length + tasks.length;
  const hasResults = totalResults > 0;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors ${className}`}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Suchen...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-white rounded border">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Search Modal */}
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <Search className="w-5 h-5 text-slate-400" />
              <Input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyNav}
                placeholder="Mandanten oder Aufgaben suchen..."
                className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0 text-base"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
              <kbd className="hidden sm:flex items-center px-1.5 py-0.5 text-xs font-medium bg-slate-100 rounded">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : hasResults ? (
                <div className="py-2">
                  {/* Companies Section */}
                  {companies.length > 0 && isEmployee && (
                    <div>
                      <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Mandanten
                      </div>
                      {companies.map((company, idx) => (
                        <button
                          key={company.id}
                          onClick={() => navigateTo(`/companies/${company.id}`)}
                          className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                            selectedIndex === idx
                              ? "bg-blue-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 truncate">
                              {company.name}
                            </div>
                            <div className="text-sm text-slate-500">
                              {company.bmdId || "Kein BMD ID"}
                            </div>
                          </div>
                          {selectedIndex === idx && (
                            <CornerDownLeft className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tasks Section */}
                  {tasks.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Aufgaben
                      </div>
                      {tasks.map((task, idx) => {
                        const resultIndex = companies.length + idx;
                        const daysSinceCreation = Math.floor(
                          (Date.now() - new Date(task.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        const trafficLight =
                          calculateTrafficLight(daysSinceCreation);
                        const trafficConfig = TRAFFIC_LIGHT_CONFIG[trafficLight];
                        const statusConfig = TASK_STATUS[task.status];

                        return (
                          <button
                            key={task.id}
                            onClick={() => navigateTo(`/tasks/${task.id}`)}
                            className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                              selectedIndex === resultIndex
                                ? "bg-blue-50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-slate-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${trafficConfig.color}`}
                                />
                                <span className="font-medium text-slate-900 truncate">
                                  {task.bookingText || "Keine Beschreibung"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Badge
                                  className={`text-xs ${statusConfig.color} border-0`}
                                >
                                  {statusConfig.label}
                                </Badge>
                                {isEmployee && (
                                  <span className="text-blue-600">
                                    {task.company.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedIndex === resultIndex && (
                              <CornerDownLeft className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : debouncedQuery.length >= 2 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">
                    Keine Ergebnisse gefunden
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Für &quot;{debouncedQuery}&quot; wurden keine Ergebnisse
                    gefunden.
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <p>
                    Tippen Sie mindestens 2 Zeichen ein, um zu suchen.
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↓</kbd>
                      navigieren
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↵</kbd>
                      öffnen
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">esc</kbd>
                      schließen
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
