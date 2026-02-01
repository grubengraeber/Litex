"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Upload, ChevronDown, Calendar } from "lucide-react";

const months = [
  { short: "JAN", full: "January" },
  { short: "FEB", full: "February" },
  { short: "MAR", full: "March" },
  { short: "APR", full: "April" },
  { short: "MAY", full: "May" },
  { short: "JUN", full: "June" },
  { short: "JUL", full: "July" },
  { short: "AUG", full: "August" },
  { short: "SEP", full: "September" },
  { short: "OCT", full: "October" },
  { short: "NOV", full: "November" },
  { short: "DEC", full: "December" },
];

export function Header() {
  const currentMonth = new Date().getMonth();
  const [activeMonth, setActiveMonth] = useState(currentMonth);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Month Tabs */}
      <div className="flex items-center gap-1">
        {months.slice(0, 5).map((month, index) => (
          <button
            key={month.short}
            onClick={() => setActiveMonth(index)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeMonth === index
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Calendar className="w-4 h-4" />
            {month.short}
          </button>
        ))}
        <button className="px-3 py-2 text-slate-400 hover:text-slate-600">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Upload Button */}
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4 mr-2" />
          UPLOAD
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search"
            className="pl-10 w-48"
          />
        </div>

        {/* User Avatar */}
        <Avatar className="w-9 h-9 cursor-pointer">
          <AvatarImage src="/avatar.jpg" alt="User" />
          <AvatarFallback className="bg-blue-100 text-blue-600">FT</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
