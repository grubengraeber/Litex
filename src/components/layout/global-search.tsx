"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Building2, 
  FileText, 
  User,
  Loader2,
  Command
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "company" | "task" | "user";
  title: string;
  subtitle?: string;
  url: string;
}

const TYPE_CONFIG = {
  company: {
    icon: Building2,
    label: "Mandant",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  task: {
    icon: FileText,
    label: "Aufgabe",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  user: {
    icon: User,
    label: "Benutzer",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
    }
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery("");
    setResults([]);
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Suchen..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-8 pr-12 w-64 h-8"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500">
          <Command className="w-3 h-3" />K
        </kbd>
      </div>

      {/* Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full mt-2 w-80 right-0 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Suche...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 text-center">
              {query.length >= 2 ? "Keine Ergebnisse gefunden" : "Mindestens 2 Zeichen eingeben"}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(groupedResults).map(([type, items]) => {
                const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                return (
                  <div key={type}>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 sticky top-0">
                      {config.label}e ({items.length})
                    </div>
                    {items.map((result) => {
                      const Icon = config.icon;
                      const globalIndex = results.indexOf(result);
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                            isSelected ? "bg-slate-100" : "hover:bg-slate-50"
                          )}
                        >
                          <div className={cn("p-1.5 rounded", config.bgColor)}>
                            <Icon className={cn("w-4 h-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-xs text-slate-500 truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Footer hint */}
          <div className="px-3 py-2 text-xs text-slate-400 bg-slate-50 border-t flex items-center gap-2">
            <kbd className="px-1 py-0.5 rounded bg-slate-200 text-slate-600">↑↓</kbd>
            navigieren
            <kbd className="px-1 py-0.5 rounded bg-slate-200 text-slate-600">↵</kbd>
            öffnen
            <kbd className="px-1 py-0.5 rounded bg-slate-200 text-slate-600">esc</kbd>
            schließen
          </div>
        </div>
      )}
    </div>
  );
}
