"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  errorMessage?: string;
}

interface FileUploadProps {
  onUpload?: (files: File[]) => Promise<void>;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onUpload,
  accept = ".pdf,image/*",
  maxFiles = 10,
  maxSizeMB = 10,
  className,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const remainingSlots = maxFiles - files.length;
    const filesToAdd = fileArray.slice(0, remainingSlots);

    const processedFiles: FileWithPreview[] = filesToAdd.map((file) => {
      let errorMsg: string | null = null;
      if (file.size > maxSizeBytes) {
        errorMsg = `Datei zu groß (max. ${maxSizeMB} MB)`;
      } else {
        const isPdf = file.type === "application/pdf";
        const isImage = file.type.startsWith("image/");
        if (!isPdf && !isImage) {
          errorMsg = "Nur PDF und Bilder erlaubt";
        }
      }

      return {
        file: file,
        id: Math.random().toString(36).slice(2),
        status: errorMsg ? "error" : "pending",
        progress: 0,
        errorMessage: errorMsg || undefined,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      };
    });

    setFiles((prev) => [...prev, ...processedFiles]);
  }, [files.length, maxFiles, maxSizeBytes, maxSizeMB]);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!disabled && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // Reset input
    e.target.value = "";
  };

  const handleUpload = async () => {
    const validFiles = files.filter((f) => f.status === "pending");
    if (validFiles.length === 0 || !onUpload) return;

    setIsUploading(true);

    // Update status to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "uploading" as const } : f
      )
    );

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((r) => setTimeout(r, 200));
        setFiles((prev) =>
          prev.map((f) =>
            f.status === "uploading" ? { ...f, progress } : f
          )
        );
      }

      // Pass the actual File objects, not FileWithPreview objects
      await onUpload(validFiles.map(f => f.file));

      // Mark as success
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading" ? { ...f, status: "success" as const, progress: 100 } : f
        )
      );
    } catch {
      // Mark as error
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "error" as const, errorMessage: "Upload fehlgeschlagen" }
            : f
        )
      );
    }

    setIsUploading(false);
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const hasFiles = files.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            isDragging ? "bg-blue-100" : "bg-slate-100"
          )}>
            <Upload className={cn(
              "w-6 h-6",
              isDragging ? "text-blue-600" : "text-slate-400"
            )} />
          </div>
          
          <div>
            <p className="font-medium text-slate-700">
              {isDragging ? "Dateien hier ablegen" : "Dateien hochladen"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Drag & Drop oder <span className="text-blue-600">durchsuchen</span>
            </p>
          </div>

          <p className="text-xs text-slate-400">
            PDF und Bilder • Max. {maxSizeMB} MB pro Datei
          </p>
        </div>
      </div>

      {/* File List */}
      {hasFiles && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                file.status === "error" && "border-red-200 bg-red-50",
                file.status === "success" && "border-green-200 bg-green-50",
                file.status === "pending" && "border-slate-200 bg-slate-50",
                file.status === "uploading" && "border-blue-200 bg-blue-50"
              )}
            >
              {/* Preview/Icon */}
              {file.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                  <File className="w-5 h-5 text-slate-400" />
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.file.size / 1024).toFixed(0)} KB
                  {file.status === "uploading" && ` • ${file.progress}%`}
                  {file.errorMessage && (
                    <span className="text-red-600"> • {file.errorMessage}</span>
                  )}
                </p>
                
                {/* Progress Bar */}
                {file.status === "uploading" && (
                  <div className="w-full h-1 bg-blue-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Status/Action */}
              {file.status === "success" && (
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              )}
              {file.status === "error" && (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              {file.status === "uploading" && (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              )}
              {file.status === "pending" && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                  className="p-1 hover:bg-slate-200 rounded"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {pendingCount > 0 && (
        <Button
          onClick={handleUpload}
          disabled={isUploading || disabled}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Wird hochgeladen...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {pendingCount} {pendingCount === 1 ? "Datei" : "Dateien"} hochladen
            </>
          )}
        </Button>
      )}

      {/* Info */}
      <p className="text-xs text-slate-400 text-center">
        Belege werden zur Freigabe durch einen Mitarbeiter eingereicht
      </p>
    </div>
  );
}
