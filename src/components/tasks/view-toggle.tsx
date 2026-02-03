"use client";

import { Button } from "@/components/ui/button";
import { LayoutList, LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "kanban" | "table";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  const views: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: "list", label: "Liste", icon: <LayoutList className="w-4 h-4" /> },
    { key: "kanban", label: "Kanban", icon: <LayoutGrid className="w-4 h-4" /> },
    { key: "table", label: "Tabelle", icon: <Table2 className="w-4 h-4" /> },
  ];

  return (
    <div className={cn("flex items-center gap-1 p-1 bg-slate-100 rounded-lg", className)}>
      {views.map(({ key, label, icon }) => (
        <Button
          key={key}
          variant="ghost"
          size="sm"
          onClick={() => onChange(key)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 h-8 transition-all",
            value === key
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-transparent"
          )}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
