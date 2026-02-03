"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  Trash2,
  MoreVertical,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatFileSize, getFileIcon } from "@/lib/file-utils";

interface FileRecord {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  task: {
    id: string;
    bookingText: string | null;
    company: {
      name: string;
    };
  } | null;
}

const STATUS_CONFIG = {
  pending: {
    label: "Ausstehend",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  approved: {
    label: "Freigegeben",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Abgelehnt",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch("/api/files");
      if (!response.ok) throw new Error("Failed to fetch files");

      const { files: filesData } = await response.json();
      setFiles(
        filesData.map((f: FileRecord) => ({
          ...f,
          createdAt: new Date(f.createdAt),
        }))
      );
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Dateien konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string, taskId: string | null) => {
    if (!taskId) {
      toast.error("Datei kann nicht heruntergeladen werden");
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}/files?fileId=${fileId}`);
      if (!response.ok) throw new Error("Failed to get download URL");

      const { downloadUrl } = await response.json();
      window.open(downloadUrl, "_blank");
      toast.success(`${fileName} wird heruntergeladen`);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Download fehlgeschlagen");
    }
  };

  const handleDelete = async (fileId: string, fileName: string, taskId: string | null) => {
    if (!taskId) {
      toast.error("Datei kann nicht gelöscht werden");
      return;
    }

    if (!confirm(`Möchten Sie "${fileName}" wirklich löschen?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}/files?fileId=${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete file");

      toast.success(`${fileName} wurde gelöscht`);
      loadFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Löschen fehlgeschlagen");
    }
  };

  const handleApprove = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/approve`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to approve file");

      toast.success(`${fileName} wurde freigegeben`);
      loadFiles();
    } catch (error) {
      console.error("Error approving file:", error);
      toast.error("Freigabe fehlgeschlagen");
    }
  };

  const handleReject = async (fileId: string, fileName: string) => {
    const reason = prompt(`Grund für Ablehnung von "${fileName}":`);
    if (!reason) return;

    try {
      const response = await fetch(`/api/files/${fileId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error("Failed to reject file");

      toast.success(`${fileName} wurde abgelehnt`);
      loadFiles();
    } catch (error) {
      console.error("Error rejecting file:", error);
      toast.error("Ablehnung fehlgeschlagen");
    }
  };

  // Filter files
  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.fileName.toLowerCase().includes(search.toLowerCase()) ||
      file.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      file.user.email.toLowerCase().includes(search.toLowerCase()) ||
      file.task?.bookingText?.toLowerCase().includes(search.toLowerCase()) ||
      file.task?.company.name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || file.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dateien</h1>
        <p className="text-slate-500 mt-1">Verwalten Sie hochgeladene Dateien und Belege</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Alle Dateien ({filteredFiles.length})</CardTitle>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Suchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Status
                    {statusFilter !== "all" && (
                      <Badge variant="secondary" className="ml-2">
                        1
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    Alle anzeigen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                    Ausstehend
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("approved")}>
                    Freigegeben
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>
                    Abgelehnt
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datei</TableHead>
                <TableHead>Aufgabe</TableHead>
                <TableHead>Hochgeladen von</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    Keine Dateien gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredFiles.map((file) => {
                  const statusConfig = STATUS_CONFIG[file.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-xl">{getFileIcon(file.mimeType)}</div>
                          <div>
                            <div className="font-medium text-sm">{file.fileName}</div>
                            <div className="text-xs text-slate-500">
                              {formatFileSize(file.fileSize)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {file.task ? (
                          <div>
                            <div className="text-sm font-medium">
                              {file.task.bookingText || "Keine Beschreibung"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {file.task.company.name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{file.user.name || "Unbekannt"}</div>
                          <div className="text-xs text-slate-500">{file.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.color} border-0`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {file.createdAt.toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDownload(file.id, file.fileName, file.task?.id || null)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Herunterladen
                            </DropdownMenuItem>
                            {file.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleApprove(file.id, file.fileName)}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Freigeben
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReject(file.id, file.fileName)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Ablehnen
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(file.id, file.fileName, file.task?.id || null)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
