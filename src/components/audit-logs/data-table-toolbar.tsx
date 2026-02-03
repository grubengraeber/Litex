"use client";

import { Table } from "@tanstack/react-table";
import { X, FileDown, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onExport?: () => void;
}

const actionOptions = [
  { label: "CREATE", value: "CREATE" },
  { label: "READ", value: "READ" },
  { label: "UPDATE", value: "UPDATE" },
  { label: "DELETE", value: "DELETE" },
  { label: "LOGIN", value: "LOGIN" },
  { label: "LOGOUT", value: "LOGOUT" },
  { label: "UPLOAD", value: "UPLOAD" },
  { label: "DOWNLOAD", value: "DOWNLOAD" },
  { label: "APPROVE", value: "APPROVE" },
  { label: "REJECT", value: "REJECT" },
];

const entityOptions = [
  { label: "User", value: "user" },
  { label: "Task", value: "task" },
  { label: "File", value: "file" },
  { label: "Company", value: "company" },
  { label: "Role", value: "role" },
  { label: "Permission", value: "permission" },
  { label: "Comment", value: "comment" },
  { label: "Chat", value: "chat" },
  { label: "Notification", value: "notification" },
];

const statusOptions = [
  { label: "Erfolg", value: "success" },
  { label: "Fehlgeschlagen", value: "failed" },
  { label: "Fehler", value: "error" },
];

export function DataTableToolbar<TData>({
  table,
  onExport,
}: DataTableToolbarProps<TData>) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const isFiltered = table.getState().columnFilters.length > 0 || dateRange;

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // In a real implementation, you would filter the data by date range here
    // For now, we'll keep it as a visual filter
  };

  const handleResetFilters = () => {
    table.resetColumnFilters();
    setDateRange(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Input
          placeholder="Suche nach Benutzer, Aktion, Entität..."
          value={(table.getColumn("userEmail")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("userEmail")?.setFilterValue(event.target.value)
          }
          className="h-10 w-full sm:max-w-sm"
        />

        {table.getColumn("action") && (
          <DataTableFacetedFilter
            column={table.getColumn("action")}
            title="Aktion"
            options={actionOptions}
          />
        )}

        {table.getColumn("entityType") && (
          <DataTableFacetedFilter
            column={table.getColumn("entityType")}
            title="Entität"
            options={entityOptions}
          />
        )}

        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statusOptions}
          />
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 justify-start text-left font-normal w-full sm:w-[240px]",
                !dateRange && "text-slate-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd.MM.yyyy", { locale: de })} -{" "}
                    {format(dateRange.to, "dd.MM.yyyy", { locale: de })}
                  </>
                ) : (
                  format(dateRange.from, "dd.MM.yyyy", { locale: de })
                )
              ) : (
                <span>Zeitraum wählen</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="h-10 px-2 lg:px-3"
          >
            Zurücksetzen
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}

        <div className="flex-1" />

        {onExport && (
          <Button variant="outline" onClick={onExport} className="h-10">
            <FileDown className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {isFiltered && (
        <div className="text-sm text-slate-500">
          {table.getFilteredRowModel().rows.length} von{" "}
          {table.getCoreRowModel().rows.length} Einträgen
        </div>
      )}
    </div>
  );
}
