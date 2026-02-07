"use client";

import { useState, useEffect } from "react";
import { Building2, ChevronDown, X } from "lucide-react";
import { useCompany } from "@/components/providers/company-provider";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Company {
  id: string;
  name: string;
}

export function CompanySelector() {
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { isEmployee } = useRole();
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    if (!isEmployee) return;

    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCompanies(data);
        }
      })
      .catch(console.error);
  }, [isEmployee]);

  if (!isEmployee) return null;

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="px-2 py-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-xs h-8"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {selectedCompany?.name || "Alle Mandanten"}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onClick={() => setSelectedCompanyId(null)}
            className={!selectedCompanyId ? "bg-accent" : ""}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Alle Mandanten
          </DropdownMenuItem>
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => setSelectedCompanyId(company.id)}
              className={
                selectedCompanyId === company.id ? "bg-accent" : ""
              }
            >
              {company.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedCompanyId && (
        <button
          onClick={() => setSelectedCompanyId(null)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 px-1"
        >
          <X className="h-3 w-3" />
          Filter zurücksetzen
        </button>
      )}
    </div>
  );
}
