"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ViewToggle } from "@/components/tasks/view-toggle";
import { PermissionsDataTable } from "@/components/permissions/permissions-data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Shield } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
  createdAt: string;
  roles: Array<{ id: string; name: string }>;
}

interface CategorizedPermissions {
  [category: string]: Permission[];
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [categorized, setCategorized] = useState<CategorizedPermissions>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");

  // Load view preference
  useEffect(() => {
    const savedView = localStorage.getItem("permissions-view");
    if (savedView === "grid" || savedView === "table") {
      setView(savedView);
    }
  }, []);

  const handleViewChange = (newView: "grid" | "table") => {
    setView(newView);
    localStorage.setItem("permissions-view", newView);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  async function fetchPermissions() {
    try {
      const response = await fetch("/api/permissions");
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
        setCategorized(data.categorized);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPermissions = permissions.filter((perm) => {
    const query = searchQuery.toLowerCase();
    return (
      perm.name.toLowerCase().includes(query) ||
      perm.description?.toLowerCase().includes(query) ||
      perm.category.toLowerCase().includes(query) ||
      perm.roles.some((role) => role.name.toLowerCase().includes(query))
    );
  });

  const categoryLabels: Record<string, string> = {
    navigation: "Navigation",
    tasks: "Aufgaben",
    clients: "Mandanten",
    users: "Benutzer",
    files: "Dateien",
    comments: "Kommentare",
    roles: "Rollen",
  };

  const categoryColors: Record<string, string> = {
    navigation: "bg-blue-100 text-blue-800",
    tasks: "bg-green-100 text-green-800",
    clients: "bg-purple-100 text-purple-800",
    users: "bg-orange-100 text-orange-800",
    files: "bg-yellow-100 text-yellow-800",
    comments: "bg-pink-100 text-pink-800",
    roles: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Berechtigungen</h1>
          <p className="text-slate-500 mt-1">
            {filteredPermissions.length} {filteredPermissions.length === 1 ? "Berechtigung" : "Berechtigungen"}
          </p>
        </div>
        <ViewToggle view={view} onViewChange={handleViewChange} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="search"
          placeholder="Berechtigungen durchsuchen..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Permissions Content */}
      {filteredPermissions.length > 0 ? (
        view === "grid" ? (
          /* Permissions by Category - Grid View */
          <div className="space-y-6">
            {Object.entries(categorized).map(([category, perms]) => {
              const filteredCategoryPerms = perms.filter((p) =>
                filteredPermissions.some((fp) => fp.id === p.id)
              );

              if (filteredCategoryPerms.length === 0) return null;

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      {categoryLabels[category] || category}
                      <Badge variant="secondary" className="ml-2">
                        {filteredCategoryPerms.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Berechtigung</TableHead>
                          <TableHead>Beschreibung</TableHead>
                          <TableHead>Rollen mit dieser Berechtigung</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCategoryPerms.map((perm) => (
                          <TableRow key={perm.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={categoryColors[category] || ""}
                                  variant="outline"
                                >
                                  {perm.name}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {perm.description || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {perm.roles.length > 0 ? (
                                  perm.roles.map((role) => (
                                    <Badge
                                      key={role.id}
                                      variant="default"
                                      className="text-xs"
                                    >
                                      {role.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-slate-400">
                                    Keiner Rolle zugewiesen
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* All Permissions - Table View */
          <PermissionsDataTable permissions={filteredPermissions} />
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-medium text-slate-700">
            Keine Berechtigungen gefunden
          </h3>
          <p className="text-slate-500 mt-1">
            {searchQuery
              ? "Versuchen Sie einen anderen Suchbegriff."
              : "Es wurden noch keine Berechtigungen definiert."}
          </p>
        </div>
      )}
    </div>
  );
}
