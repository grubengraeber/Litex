"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";

interface MonthSelectorProps {
  taskType: "general" | "booking";
  companyId?: string | null;
  selectedPeriod: string | null;
  onPeriodChange: (period: string | null) => void;
  hideCompleted: boolean;
  onHideCompletedChange: (hide: boolean) => void;
}

interface PeriodData {
  period: string;
  count: number;
  openCount: number;
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-");
  const months = [
    "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
    "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${months[monthIndex]} ${year}`;
}

export function MonthSelector({
  taskType,
  companyId,
  selectedPeriod,
  onPeriodChange,
  hideCompleted,
  onHideCompletedChange,
}: MonthSelectorProps) {
  const [periods, setPeriods] = useState<PeriodData[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("taskType", taskType);
    if (companyId) params.set("companyId", companyId);

    fetch(`/api/tasks/periods?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPeriods(data);
        }
      })
      .catch(console.error);
  }, [taskType, companyId]);

  return (
    <div className="flex flex-col gap-3 p-3 bg-muted rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Calendar className="h-4 w-4" />
          Zeitraum
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="hide-completed"
            checked={hideCompleted}
            onCheckedChange={(checked) => onHideCompletedChange(!!checked)}
          />
          <label
            htmlFor="hide-completed"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            Erledigte ausblenden
          </label>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button
          variant={selectedPeriod === null ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onPeriodChange(null)}
        >
          Alle
        </Button>
        {periods.map((p) => (
          <Button
            key={p.period}
            variant={selectedPeriod === p.period ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-7 text-xs",
              p.openCount === 0 && selectedPeriod !== p.period && "opacity-50"
            )}
            onClick={() => onPeriodChange(p.period)}
          >
            {formatPeriodLabel(p.period)}
            <span className="ml-1 text-xs opacity-70">
              ({hideCompleted ? p.openCount : p.count})
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
