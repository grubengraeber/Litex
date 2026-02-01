"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { MONTHS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ChevronDown, ChevronUp, Calendar } from "lucide-react";

interface HeaderProps {
  onMonthChange?: (month: string) => void;
}

export function Header({ onMonthChange }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMonth = new Date().getMonth();
  const currentMonthKey = MONTHS[currentMonth].key;
  
  const activeMonthKey = searchParams.get("month") || currentMonthKey;
  const [showAllMonths, setShowAllMonths] = useState(false);
  
  // Monatsauswahl nur auf Dashboard und Aufgaben zeigen
  const showMonthFilter = pathname === "/dashboard" || pathname.startsWith("/tasks");

  const handleMonthClick = (monthKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthKey);
    router.push(`?${params.toString()}`);
    onMonthChange?.(monthKey);
  };

  const visibleMonths = showAllMonths ? MONTHS : MONTHS.slice(0, 5);

  return (
    <div className="flex flex-1 items-center justify-between">
      {/* Month Tabs */}
      {showMonthFilter && (
        <div className="flex items-center gap-1 flex-wrap">
          {visibleMonths.map((month) => (
            <button
              key={month.key}
              onClick={() => handleMonthClick(month.key)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeMonthKey === month.key
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              {month.short}
            </button>
          ))}
          <button 
            onClick={() => setShowAllMonths(!showAllMonths)}
            className="px-2 py-1.5 text-slate-400 hover:text-slate-600"
            title={showAllMonths ? "Weniger anzeigen" : "Mehr anzeigen"}
          >
            {showAllMonths ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Suchen..."
            className="pl-8 w-40 h-8"
          />
        </div>

        {/* User Avatar */}
        <Avatar className="w-8 h-8 cursor-pointer">
          <AvatarImage src="/avatar.jpg" alt="Benutzer" />
          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">FT</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
