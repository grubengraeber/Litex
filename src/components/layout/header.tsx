"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { MONTHS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { NotificationsDropdown } from "./notifications-dropdown";
import { UserMenu } from "./user-menu";

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
  const activeMonthIndex = MONTHS.findIndex(m => m.key === activeMonthKey);
  const activeMonthData = MONTHS[activeMonthIndex] || MONTHS[currentMonth];

  // Monatsauswahl nur auf Dashboard und Aufgaben zeigen
  const showMonthFilter = pathname === "/dashboard" || pathname.startsWith("/tasks");

  const handleMonthClick = (monthKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthKey);
    router.push(`?${params.toString()}`);
    onMonthChange?.(monthKey);
  };

  const handlePrevMonth = () => {
    const newIndex = activeMonthIndex > 0 ? activeMonthIndex - 1 : 11;
    handleMonthClick(MONTHS[newIndex].key);
  };

  const handleNextMonth = () => {
    const newIndex = activeMonthIndex < 11 ? activeMonthIndex + 1 : 0;
    handleMonthClick(MONTHS[newIndex].key);
  };

  return (
    <div className="flex flex-1 items-center justify-between min-w-0">
      {/* Month Selector */}
      {showMonthFilter && (
        <>
          {/* Mobile: Compact dropdown with prev/next */}
          <div className="flex md:hidden items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-8 gap-1 px-2 min-w-[90px]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="font-medium">{activeMonthData.short}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                {MONTHS.map((month) => (
                  <DropdownMenuItem
                    key={month.key}
                    onClick={() => handleMonthClick(month.key)}
                    className={cn(
                      "cursor-pointer",
                      activeMonthKey === month.key && "bg-blue-50 text-blue-600"
                    )}
                  >
                    {month.full}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop: Horizontal tabs */}
          <div className="hidden md:flex items-center gap-1 flex-wrap">
            {MONTHS.map((month) => (
              <button
                key={month.key}
                onClick={() => handleMonthClick(month.key)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  activeMonthKey === month.key
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                {month.short}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {/* Search - hidden on mobile */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Suchen..."
            className="pl-8 w-40 h-8"
          />
        </div>

        {/* Notifications Bell */}
        <NotificationsDropdown />

        {/* User Avatar Dropdown */}
        <UserMenu />
      </div>
    </div>
  );
}
