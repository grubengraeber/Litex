"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

// Mock companies data
const companies = [
  {
    id: "1",
    name: "Mustermann GmbH",
    bmdId: "BMD-001",
    isActive: true,
    userCount: 3,
    taskCount: 15,
    openTaskCount: 8,
  },
  {
    id: "2",
    name: "Beispiel AG",
    bmdId: "BMD-002",
    isActive: true,
    userCount: 5,
    taskCount: 22,
    openTaskCount: 5,
  },
  {
    id: "3",
    name: "Test & Partner KG",
    bmdId: "BMD-003",
    isActive: true,
    userCount: 2,
    taskCount: 8,
    openTaskCount: 3,
  },
  {
    id: "4",
    name: "Muster OG",
    bmdId: "BMD-004",
    isActive: false,
    userCount: 1,
    taskCount: 5,
    openTaskCount: 0,
  },
  {
    id: "5",
    name: "Innovation GmbH",
    bmdId: "BMD-005",
    isActive: true,
    userCount: 4,
    taskCount: 18,
    openTaskCount: 12,
  },
];

function CompaniesContent() {
  const { isEmployee } = useRole();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mandanten</h1>
          <p className="text-slate-500 mt-1">
            {companies.length} Mandanten verwalten
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Mandant anlegen
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="search"
          placeholder="Mandanten durchsuchen..."
          className="pl-10"
        />
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
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
                      {company.bmdId}
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
                  <span>{company.userCount} Benutzer</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>{company.taskCount} Aufgaben</span>
                </div>
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
        ))}
      </div>
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
