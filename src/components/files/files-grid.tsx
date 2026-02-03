"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileIcon, FileText } from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

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

const statusVariants = {
  pending: "secondary" as const,
  approved: "default" as const,
  rejected: "destructive" as const,
};

const statusLabels = {
  pending: "Ausstehend",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
};

function getFileThumbnail(mimeType: string | null, storageKey: string) {
  if (mimeType?.startsWith("image/")) {
    return (
      <img
        src={`/api/files/${storageKey}/download`}
        alt="Thumbnail"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-slate-100"><svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
        }}
      />
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <FileText className="w-12 h-12 text-red-500" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <FileIcon className="w-12 h-12 text-slate-400" />
    </div>
  );
}

export function FilesGrid({
  files,
  onPreview,
}: {
  files: FileRecord[];
  onPreview: (file: FileRecord) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => (
        <Card key={file.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            {/* Thumbnail */}
            <div
              className="h-40 w-full overflow-hidden cursor-pointer"
              onClick={() => onPreview(file)}
            >
              {getFileThumbnail(file.mimeType, file.storageKey)}
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
              {/* Filename */}
              <h3
                className="font-medium text-sm truncate cursor-pointer hover:text-blue-600"
                onClick={() => onPreview(file)}
                title={file.fileName}
              >
                {file.fileName}
              </h3>

              {/* Task */}
              {file.task && (
                <div className="text-xs text-slate-500 truncate">
                  {file.task.company.name}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{file.fileSize ? formatFileSize(file.fileSize) : "-"}</span>
                <span>
                  {formatDistanceToNow(new Date(file.createdAt), {
                    addSuffix: true,
                    locale: de,
                  })}
                </span>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={statusVariants[file.status]} className="text-xs">
                  {statusLabels[file.status]}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onPreview(file)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    asChild
                  >
                    <a href={`/api/files/${file.storageKey}/download`} download>
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
