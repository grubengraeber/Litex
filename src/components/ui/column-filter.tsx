"use client";

import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  filterType?: "text" | "select" | "none";
  filterOptions?: Array<{ label: string; value: string }>;
}

export function ColumnHeader<TData, TValue>({
  column,
  title,
  filterType = "none",
  filterOptions,
}: ColumnHeaderProps<TData, TValue>) {
  const isSorted = column.getIsSorted();
  const filterValue = (column.getFilterValue() as string) ?? "";

  return (
    <div className="flex items-center gap-2">
      {/* Sort Button */}
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{title}</span>
        {isSorted === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : isSorted === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>

      {/* Filter */}
      {filterType !== "none" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Filter
                className={`h-4 w-4 ${
                  filterValue ? "text-blue-600" : "opacity-50"
                }`}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-3" align="start">
            {filterType === "text" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter</label>
                <Input
                  placeholder={`Filtern...`}
                  value={filterValue}
                  onChange={(e) => column.setFilterValue(e.target.value)}
                />
                {filterValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => column.setFilterValue("")}
                  >
                    Zurücksetzen
                  </Button>
                )}
              </div>
            )}
            {filterType === "select" && filterOptions && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter</label>
                <Select
                  value={filterValue}
                  onValueChange={(value) =>
                    column.setFilterValue(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {filterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
