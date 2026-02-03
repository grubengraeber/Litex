"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanySearchWithLinks } from "@/components/companies/company-search";
import { useRole } from "@/hooks/use-role";
import { fetchCompanies, fetchTasks } from "../actions";
import { 
  Plus, 
  Building2,
  Users,
  FileText,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  bmdId: string | null;
  finmaticsId: string | null;
  isActive: boolean;
}

interface CompanyWithStats extends Company {
  taskCount: number;
  openTaskCount: number;
}

function CompaniesContent() {
  const { isEmployee } = useRole();
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!isEmployee) return;
      
      setLoading(true);
      try {
        const [companiesData, tasksData] = await Promise.all([
          fetchCompanies(),
          fetchTasks({}),
        ]);

        // Calculate stats for each company
        const companiesWithStats: CompanyWithStats[] = companiesData.map((company) => {
          const companyTasks = tasksData.filter(
            (t) => t.company?.id === company.id
          );
          const openTasks = companyTasks.filter(
            (t) => t.status === "open" || t.status === "submitted"
          );

          return {
            ...company,
            taskCount: companyTasks.length,
            openTaskCount: openTasks.length,
          };
        });

        setCompanies(companiesWithStats);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isEmployee]);

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mandanten</h1>
          <p className="text-slate-500 mt-1">
            {companies.length} Mandanten verwalten
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Mandant anlegen
        </Button>
      </div>

      {/* Search */}
      <CompanySearchWithLinks 
        placeholder="Mandanten durchsuchen (Name, BMD ID, Finmatics ID)..."
        className="max-w-md"
      />

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <Link key={company.id} href={`/companies/${company.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <span className="text-sm text-slate-500">
                        {company.bmdId || "—"}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // TODO: Open context menu
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>{company.taskCount} Aufgaben</span>
                  </div>
                  {company.finmaticsId && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-slate-400">FIN:</span>
                      <span className="truncate">{company.finmaticsId}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-1.5">
                    {company.isActive ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <Badge variant="success" className="text-xs">Aktiv</Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-400" />
                        <Badge variant="outline" className="text-xs">Inaktiv</Badge>
                      </>
                    )}
                  </div>
                  {company.openTaskCount > 0 && (
                    <span className="text-sm text-orange-600 font-medium">
                      {company.openTaskCount} offen
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700">
            Keine Mandanten vorhanden
          </h3>
          <p className="text-slate-500 mt-1">
            Erstellen Sie Ihren ersten Mandanten.
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
