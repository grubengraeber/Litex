"use client";

import { useState, useEffect, useCallback } from "react";
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
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  bmdId: string | null;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  isActive: boolean;
  companies: Company[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function MandantenContent() {
  const { isEmployee } = useRole();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchClients = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      
      const response = await fetch(`/api/clients?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients(debouncedSearch);
  }, [debouncedSearch, fetchClients]);

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
            {clients.length} Mandanten verwalten
          </p>
        </div>
        <Link href="/mandanten/neu">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Mandant anlegen
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="search"
          placeholder="Mandanten durchsuchen (Name, Email, Adresse, Steuernummer...)"
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Results info when searching */}
      {debouncedSearch && (
        <p className="text-sm text-slate-500">
          {clients.length} Ergebnis{clients.length !== 1 ? "se" : ""} für &quot;{debouncedSearch}&quot;
        </p>
      )}

      {/* Clients Grid */}
      {loading && clients.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700">
            {debouncedSearch ? "Keine Ergebnisse" : "Keine Mandanten"}
          </h3>
          <p className="text-slate-500 mt-1">
            {debouncedSearch 
              ? "Versuche einen anderen Suchbegriff" 
              : "Erstelle deinen ersten Mandanten"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link key={client.id} href={`/mandanten/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{client.name}</h3>
                        {client.email && (
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={(e) => e.preventDefault()}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {(client.street || client.city) && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>
                          {[client.street, client.postalCode, client.city]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{client.companies.length} Firma{client.companies.length !== 1 ? "en" : ""}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-1.5">
                      {client.isActive ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Aktiv
                          </Badge>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-slate-400" />
                          <Badge variant="outline" className="text-xs">Inaktiv</Badge>
                        </>
                      )}
                    </div>
                    {client.companies.length > 0 && (
                      <span className="text-xs text-slate-500">
                        {client.companies.map(c => c.name).slice(0, 2).join(", ")}
                        {client.companies.length > 2 && ` +${client.companies.length - 2}`}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MandantenPage() {
  return <MandantenContent />;
}
