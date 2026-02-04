"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ViewToggle } from "@/components/tasks/view-toggle";
import { CompaniesDataTable } from "@/components/companies/companies-data-table";
import { CompanyDialog } from "@/components/companies/company-dialog";
import { useRole } from "@/hooks/use-role";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions-constants";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Check permissions for company actions
  const canCreateCompany = hasPermission(PERMISSIONS.CREATE_CLIENTS);
  const canEditCompany = hasPermission(PERMISSIONS.EDIT_CLIENTS);

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

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCompany(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedCompany(null);
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      const response = await fetch(`/api/companies?id=${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !company.isActive }),
      });

      if (response.ok) {
        toast.success(
          `${company.name} wurde ${!company.isActive ? "aktiviert" : "deaktiviert"}`
        );
        fetchCompanies();
      } else {
        toast.error("Fehler beim Aktualisieren des Status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Fehler beim Aktualisieren des Status");
    }
  };

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

  if (loading || permissionsLoading) {
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
          {canCreateCompany && (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              Mandant anlegen
            </Button>
          )}
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
                    {canEditCompany && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(company)}>
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(company)}>
                            {company.isActive ? "Deaktivieren" : "Aktivieren"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
          <CompaniesDataTable
            companies={filteredCompanies}
            onEdit={canEditCompany ? handleEdit : undefined}
            onToggleStatus={canEditCompany ? handleToggleStatus : undefined}
          />
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

      <CompanyDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        company={selectedCompany}
        onSuccess={fetchCompanies}
      />
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
