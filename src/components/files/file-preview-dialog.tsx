"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileX, Download } from "lucide-react";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    fileName: string;
    mimeType: string | null;
    storageKey: string;
  } | null;
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  file,
}: FilePreviewDialogProps) {
  const [imageError, setImageError] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  if (!file) return null;

  const isPDF = file.mimeType === "application/pdf";
  const isImage = file.mimeType?.startsWith("image/");

  // For S3, construct the URL (adjust based on your S3 configuration)
  const fileUrl = `/api/files/${file.storageKey}/download`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold truncate">{file.fileName}</h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-4">
            {isImage && !imageError && (
              <img
                src={fileUrl}
                alt={file.fileName}
                className="max-w-full max-h-full object-contain"
                onError={() => setImageError(true)}
              />
            )}
            {isImage && imageError && (
              <div className="text-center">
                <FileX className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  Bild konnte nicht geladen werden
                </h3>
                <p className="text-slate-500 mb-4">
                  Die Datei wurde möglicherweise verschoben oder gelöscht.
                </p>
                <Button asChild variant="outline">
                  <a href={fileUrl} download={file.fileName}>
                    <Download className="w-4 h-4 mr-2" />
                    Trotzdem herunterladen
                  </a>
                </Button>
              </div>
            )}
            {isPDF && !pdfError && (
              <iframe
                src={fileUrl}
                className="w-full h-full border-0"
                title={file.fileName}
                onError={() => setPdfError(true)}
              />
            )}
            {isPDF && pdfError && (
              <div className="text-center">
                <FileX className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  PDF konnte nicht geladen werden
                </h3>
                <p className="text-slate-500 mb-4">
                  Die Datei wurde möglicherweise verschoben oder gelöscht.
                </p>
                <Button asChild variant="outline">
                  <a href={fileUrl} download={file.fileName}>
                    <Download className="w-4 h-4 mr-2" />
                    Trotzdem herunterladen
                  </a>
                </Button>
              </div>
            )}
            {!isImage && !isPDF && (
              <div className="text-center">
                <p className="text-slate-500 mb-4">
                  Vorschau für diesen Dateityp nicht verfügbar
                </p>
                <Button asChild>
                  <a href={fileUrl} download={file.fileName}>
                    <Download className="w-4 h-4 mr-2" />
                    Datei herunterladen
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-slate-500">{file.mimeType || "Unbekannter Typ"}</span>
            <Button asChild variant="outline">
              <a href={fileUrl} download={file.fileName}>
                <Download className="w-4 h-4 mr-2" />
                Herunterladen
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
