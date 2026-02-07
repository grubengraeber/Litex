"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ViewToggle } from "@/components/tasks/view-toggle";
import { FilesDataTable } from "@/components/files/files-data-table";
import { FilesGrid } from "@/components/files/files-grid";
import { FilePreviewDialog } from "@/components/files/file-preview-dialog";
import { Search, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions-constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FileRecord {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  storageKey: string;
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

export default function FilesPage() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [previewFile, setPreviewFile] = useState<(FileRecord & { taskId?: string }) | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load view preference
  useEffect(() => {
    const savedView = localStorage.getItem("files-view");
    if (savedView === "grid" || savedView === "table") {
      setView(savedView);
    }
  }, []);

  const handleViewChange = (newView: "grid" | "table") => {
    setView(newView);
    localStorage.setItem("files-view", newView);
  };

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

  const handlePreview = (file: FileRecord) => {
    setPreviewFile({
      ...file,
      taskId: file.task?.id,
    });
    setPreviewOpen(true);
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.fileName.toLowerCase().includes(search.toLowerCase()) ||
      file.task?.bookingText?.toLowerCase().includes(search.toLowerCase()) ||
      file.task?.company.name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || file.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Lade Dateien...</div>
      </div>
    );
  }

  if (!hasPermission(PERMISSIONS.VIEW_FILES)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Kein Zugriff
        </h2>
        <p className="text-muted-foreground">
          Sie haben keine Berechtigung, den Dateien-Bereich anzuzeigen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dateien</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredFiles.length} {filteredFiles.length === 1 ? "Datei" : "Dateien"}
          </p>
        </div>
        <ViewToggle view={view} onViewChange={handleViewChange} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Dateien durchsuchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="pending">Ausstehend</SelectItem>
            <SelectItem value="approved">Freigegeben</SelectItem>
            <SelectItem value="rejected">Abgelehnt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {filteredFiles.length > 0 ? (
        view === "grid" ? (
          <FilesGrid files={filteredFiles} onPreview={handlePreview} />
        ) : (
          <FilesDataTable files={filteredFiles} onPreview={handlePreview} />
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📁</span>
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Keine Dateien gefunden
          </h3>
          <p className="text-muted-foreground mt-1">
            {search || statusFilter !== "all"
              ? "Versuchen Sie einen anderen Filter."
              : "Es wurden noch keine Dateien hochgeladen."}
          </p>
        </div>
      )}

      {/* Preview Dialog */}
      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        file={previewFile}
      />
    </div>
  );
}
