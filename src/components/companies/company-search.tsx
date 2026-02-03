"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, Building2, CheckCircle, XCircle, X } from "lucide-react";

interface Company {
  id: string;
  name: string;
  bmdId: string | null;
  finmaticsId: string | null;
  isActive: boolean;
}

interface CompanySearchProps {
  onSelect?: (company: Company) => void;
  placeholder?: string;
  className?: string;
}

export function CompanySearch({
  onSelect,
  placeholder = "Mandanten durchsuchen (Name, BMD ID, Finmatics ID)...",
  className = "",
}: CompanySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    async function search() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&type=companies&limit=10`
        );
        const data = await res.json();

        if (res.ok) {
          setResults(data.companies || []);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    search();
  }, [debouncedQuery]);

  const handleSelect = (company: Company) => {
    if (onSelect) {
      onSelect(company);
    }
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelect(company)}
                  className="w-full px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-left transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">
                        {company.name}
                      </span>
                      {company.isActive ? (
                        <Badge variant="success" className="text-xs shrink-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs shrink-0">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inaktiv
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                      {company.bmdId && (
                        <span>BMD: {company.bmdId}</span>
                      )}
                      {company.bmdId && company.finmaticsId && (
                        <span className="text-slate-300">•</span>
                      )}
                      {company.finmaticsId && (
                        <span>Finmatics: {company.finmaticsId}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : debouncedQuery.length >= 2 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">
                Keine Mandanten gefunden
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Für &quot;{debouncedQuery}&quot; wurden keine Ergebnisse gefunden.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Standalone search page variant with navigation
export function CompanySearchWithLinks({
  placeholder = "Mandanten durchsuchen...",
  className = "",
}: Omit<CompanySearchProps, "onSelect">) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    async function search() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&type=companies&limit=10`
        );
        const data = await res.json();

        if (res.ok) {
          setResults(data.companies || []);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    search();
  }, [debouncedQuery]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 truncate">
                          {company.name}
                        </span>
                        {company.isActive ? (
                          <Badge variant="success" className="text-xs shrink-0">
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs shrink-0">
                            Inaktiv
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                        {company.bmdId && <span>BMD: {company.bmdId}</span>}
                        {company.finmaticsId && (
                          <span>• Finmatics: {company.finmaticsId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : debouncedQuery.length >= 2 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">
                Keine Mandanten gefunden
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Für &quot;{debouncedQuery}&quot; wurden keine Ergebnisse gefunden.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
