"use client";

import { Button } from "@/components/ui/button";
import { List, Columns3, Table } from "lucide-react";

export type ViewType = "list" | "kanban" | "table";

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const views = [
  { key: "list" as ViewType, label: "Liste", icon: List },
  { key: "kanban" as ViewType, label: "Kanban", icon: Columns3 },
  { key: "table" as ViewType, label: "Tabelle", icon: Table },
] as const;

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
      {views.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={currentView === key ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(key)}
          className={`h-8 px-3 ${
            currentView === key 
              ? "bg-white shadow-sm" 
              : "hover:bg-slate-200"
          }`}
        >
          <Icon className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
