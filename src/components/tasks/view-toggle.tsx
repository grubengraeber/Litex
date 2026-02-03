"use client";

import { LayoutGrid, Table } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewToggleProps {
  view: "grid" | "table";
  onViewChange: (view: "grid" | "table") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 border rounded-md p-1">
      <Button
        variant={view === "grid" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("grid")}
        title="Grid-Ansicht"
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>
      <Button
        variant={view === "table" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        title="Tabellen-Ansicht"
      >
        <Table className="w-4 h-4" />
      </Button>
    </div>
  );
}
