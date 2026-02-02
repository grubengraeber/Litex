"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { MONTHS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Upload, ChevronDown, ChevronUp, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface HeaderProps {
  onMonthChange?: (month: string) => void;
  showMonthFilter?: boolean;
}

export function Header({ onMonthChange, showMonthFilter = true }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMonth = new Date().getMonth();
  const currentMonthKey = MONTHS[currentMonth].key;
  
  const activeMonthKey = searchParams.get("month") || currentMonthKey;
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMobileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthClick = (monthKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", monthKey);
    router.push(`?${params.toString()}`);
    onMonthChange?.(monthKey);
    setShowMobileDropdown(false);
  };

  const activeMonthIndex = MONTHS.findIndex(m => m.key === activeMonthKey);
  const activeMonth = MONTHS[activeMonthIndex];
  
  const goToPrevMonth = () => {
    const prevIndex = activeMonthIndex > 0 ? activeMonthIndex - 1 : MONTHS.length - 1;
    handleMonthClick(MONTHS[prevIndex].key);
  };

  const goToNextMonth = () => {
    const nextIndex = activeMonthIndex < MONTHS.length - 1 ? activeMonthIndex + 1 : 0;
    handleMonthClick(MONTHS[nextIndex].key);
  };

  const visibleMonths = showAllMonths ? MONTHS : MONTHS.slice(0, 5);

  return (
    <div className="flex flex-1 items-center justify-between gap-2 min-w-0 overflow-x-hidden">
      {/* Month Tabs - Desktop */}
      {showMonthFilter && (
        <>
          {/* Mobile: Compact month selector with prev/next */}
          <div className="flex md:hidden items-center gap-1 min-w-0" ref={dropdownRef}>
            <button
              onClick={goToPrevMonth}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded shrink-0"
              aria-label="Vorheriger Monat"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowMobileDropdown(!showMobileDropdown)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  "bg-blue-600 text-white min-w-[90px] justify-center"
                )}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{activeMonth?.short}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform shrink-0", showMobileDropdown && "rotate-180")} />
              </button>
              
              {showMobileDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border z-50 py-1 min-w-[140px]">
                  {MONTHS.map((month) => (
                    <button
                      key={month.key}
                      onClick={() => handleMonthClick(month.key)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50",
                        activeMonthKey === month.key && "bg-blue-50 text-blue-700 font-medium"
                      )}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {month.full}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded shrink-0"
              aria-label="Nächster Monat"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop: Full month tabs */}
          <div className="hidden md:flex items-center gap-1 flex-wrap min-w-0">
            {visibleMonths.map((month) => (
              <button
                key={month.key}
                onClick={() => handleMonthClick(month.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
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
        </>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Upload Button - Icon only on mobile */}
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Hochladen</span>
        </Button>

        {/* Search - Hidden on mobile */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Suchen..."
            className="pl-8 w-40 h-8"
          />
        </div>

        {/* User Avatar */}
        <Avatar className="w-8 h-8 cursor-pointer shrink-0">
          <AvatarImage src="/avatar.jpg" alt="Benutzer" />
          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">FT</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
