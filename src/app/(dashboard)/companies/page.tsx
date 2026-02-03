"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ViewToggle } from "@/components/tasks/view-toggle";
import { CompaniesDataTable } from "@/components/companies/companies-data-table";
import { useRole } from "@/hooks/use-role";
import {
  Plus,
  Search,
  Building2,
  Users,
  FileText,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  bmdId: string | null;
  finmaticsId: string | null;
  isActive: boolean;
  userCount?: number;
  taskCount?: number;
  openTaskCount?: number;
}

function CompaniesContent() {
  const { isEmployee } = useRole();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");

  // Load view preference
  useEffect(() => {
    const savedView = localStorage.getItem("companies-view");
    if (savedView === "grid" || savedView === "table") {
      setView(savedView);
    }
  }, []);

  const handleViewChange = (newView: "grid" | "table") => {
    setView(newView);
    localStorage.setItem("companies-view", newView);
  };

  useEffect(() => {
    if (isEmployee) {
      fetchCompanies();
    }
  }, [isEmployee]);

  async function fetchCompanies() {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Fehler beim Laden der Mandanten");
    } finally {
      setLoading(false);
    }
  }

  const filteredCompanies = companies.filter((company) => {
    const query = searchQuery.toLowerCase();
    return (
      company.name.toLowerCase().includes(query) ||
      company.bmdId?.toLowerCase().includes(query) ||
      company.finmaticsId?.toLowerCase().includes(query)
    );
  });

  // Redirect customers - they shouldn't see this page
  if (!isEmployee) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h3 className="text-lg font-medium text-slate-700">
          Kein Zugriff
        </h3>
        <p className="text-slate-500 mt-1">
          Diese Seite ist nur für Mitarbeiter verfügbar.
        </p>
        <Link href="/dashboard">
          <Button className="mt-4">Zum Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Lade Mandanten...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mandanten</h1>
          <p className="text-slate-500 mt-1">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? "Mandant" : "Mandanten"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onViewChange={handleViewChange} />
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Mandant anlegen
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="search"
          placeholder="Mandanten durchsuchen..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Companies Content */}
      {filteredCompanies.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{company.name}</h3>
                        <span className="text-sm text-slate-500">
                          {company.bmdId || "-"}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{company.userCount || 0} Benutzer</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{company.taskCount || 0} Aufgaben</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-1.5">
                      {company.isActive ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <Badge variant="default" className="text-xs">Aktiv</Badge>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-slate-400" />
                          <Badge variant="outline" className="text-xs">Inaktiv</Badge>
                        </>
                      )}
                    </div>
                    {(company.openTaskCount ?? 0) > 0 && (
                      <span className="text-sm text-orange-600 font-medium">
                        {company.openTaskCount} offen
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <CompaniesDataTable companies={filteredCompanies} />
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🏢</span>
          </div>
          <h3 className="text-lg font-medium text-slate-700">
            Keine Mandanten gefunden
          </h3>
          <p className="text-slate-500 mt-1">
            {searchQuery
              ? "Versuchen Sie einen anderen Suchbegriff."
              : "Es wurden noch keine Mandanten angelegt."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Laden...</div>}>
      <CompaniesContent />
    </Suspense>
  );
}
