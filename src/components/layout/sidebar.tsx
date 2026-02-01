"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  Filter,
  Calendar,
  Star,
  CheckCircle,
  Archive,
  ChevronDown
} from "lucide-react";

const filters = [
  { name: "All", icon: Filter, count: 24 },
  { name: "Due This Week", icon: Calendar, count: 8 },
  { name: "Priorities", icon: Star, count: 5 },
  { name: "Completed", icon: CheckCircle, count: 12 },
  { name: "Archived", icon: Archive, count: 3 },
];

export function Sidebar() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(true);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-lg">Litex</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-600"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link
          href="/team"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50"
        >
          <Users className="w-5 h-5" />
          <span>Team</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>

        {/* Filters Section */}
        <div className="pt-6">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-500"
          >
            <span>FILTERS</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", filtersOpen && "rotate-180")} />
          </button>
          
          {filtersOpen && (
            <div className="mt-2 space-y-1">
              {filters.map((filter) => (
                <button
                  key={filter.name}
                  onClick={() => setActiveFilter(filter.name)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm",
                    activeFilter === filter.name
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <filter.icon className="w-4 h-4" />
                    <span>{filter.name}</span>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    activeFilter === filter.name ? "bg-blue-100" : "bg-slate-100"
                  )}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
