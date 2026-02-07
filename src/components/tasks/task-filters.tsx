"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { type TaskFilters } from "@/hooks/use-task-filters";
import { useEffect, useState } from "react";

interface Company {
  id: string;
  name: string;
}

interface TaskFiltersBarProps {
  filters: TaskFilters;
  onFilterChange: (key: keyof TaskFilters, value: string | undefined) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  companies?: Company[];
  showCompanyFilter?: boolean;
}

export function TaskFiltersBar({
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  companies = [],
  showCompanyFilter = false,
}: TaskFiltersBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange("search", searchInput || undefined);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onFilterChange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Aufgaben durchsuchen..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            onFilterChange("status", value === "all" ? undefined : value as TaskFilters["status"])
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="open">Offen</SelectItem>
            <SelectItem value="submitted">Eingereicht</SelectItem>
            <SelectItem value="completed">Erledigt</SelectItem>
          </SelectContent>
        </Select>

        {/* Traffic Light Filter */}
        <Select
          value={filters.trafficLight || "all"}
          onValueChange={(value) =>
            onFilterChange("trafficLight", value === "all" ? undefined : value as TaskFilters["trafficLight"])
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ampel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Ampeln</SelectItem>
            <SelectItem value="green">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                Neu (0-30 Tage)
              </div>
            </SelectItem>
            <SelectItem value="yellow">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                Warnung (&gt;30 Tage)
              </div>
            </SelectItem>
            <SelectItem value="red">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                Dringend (&gt;60 Tage)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Company Filter (for employees) */}
        {showCompanyFilter && companies.length > 0 && (
          <Select
            value={filters.companyId || "all"}
            onValueChange={(value) =>
              onFilterChange("companyId", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Mandant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Mandanten</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Period Filter */}
        <Select
          value={filters.period || "all"}
          onValueChange={(value) =>
            onFilterChange("period", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Perioden</SelectItem>
            {generatePeriods().map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Aktive Filter:</span>
          <Badge variant="secondary">
            {activeFilterCount} Filter
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Alle löschen
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper function to generate periods (last 12 months + current)
function generatePeriods() {
  const periods = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const value = `${year}-${month}`;
    const label = date.toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    });

    periods.push({ value, label });
  }

  return periods;
}
