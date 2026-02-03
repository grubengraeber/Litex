/**
 * File utility functions for validation, compression, and security
 */

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  // Images
  "image/jpeg": { ext: [".jpg", ".jpeg"], maxSize: 10 * 1024 * 1024 }, // 10MB
  "image/png": { ext: [".png"], maxSize: 10 * 1024 * 1024 },
  "image/gif": { ext: [".gif"], maxSize: 5 * 1024 * 1024 },
  "image/webp": { ext: [".webp"], maxSize: 10 * 1024 * 1024 },
  // Documents
  "application/pdf": { ext: [".pdf"], maxSize: 25 * 1024 * 1024 }, // 25MB
  // Office documents
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: [".docx"], maxSize: 10 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: [".xlsx"], maxSize: 10 * 1024 * 1024 },
  "application/vnd.ms-excel": { ext: [".xls"], maxSize: 10 * 1024 * 1024 },
  "text/csv": { ext: [".csv"], maxSize: 5 * 1024 * 1024 },
};

// Dangerous file extensions (executables, scripts)
const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".scr", ".vbs", ".js", ".jar",
  ".app", ".deb", ".rpm", ".sh", ".bash", ".ps1", ".msi", ".dmg",
  ".dll", ".so", ".dylib", ".run"
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): ValidationResult {
  // Check file name
  const fileName = file.name.toLowerCase();

  // Block dangerous extensions
  const hasDangerousExt = DANGEROUS_EXTENSIONS.some(ext => fileName.endsWith(ext));
  if (hasDangerousExt) {
    return {
      valid: false,
      error: "Dieser Dateityp ist aus Sicherheitsgründen nicht erlaubt.",
    };
  }

  // Check MIME type
  const allowedType = ALLOWED_MIME_TYPES[file.type as keyof typeof ALLOWED_MIME_TYPES];
  if (!allowedType) {
    return {
      valid: false,
      error: `Dateityp "${file.type}" ist nicht erlaubt. Erlaubt sind: PDF, Bilder (JPG, PNG, WebP), Excel, Word.`,
    };
  }

  // Check file extension matches MIME type
  const hasValidExt = allowedType.ext.some(ext => fileName.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: `Dateiendung stimmt nicht mit dem Dateityp überein.`,
    };
  }

  // Check file size
  if (file.size > allowedType.maxSize) {
    const maxSizeMB = (allowedType.maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `Datei ist zu groß. Maximum: ${maxSizeMB} MB`,
    };
  }

  // Warn about large files that could be compressed
  if (file.type.startsWith("image/") && file.size > 1024 * 1024) {
    return {
      valid: true,
      warning: "Große Bilddatei wird komprimiert...",
    };
  }

  return { valid: true };
}

/**
 * Compress image file
 */
export async function compressImage(file: File, maxWidth = 2048, quality = 0.85): Promise<File> {
  // Only compress images
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Don't compress GIFs (would lose animation)
  if (file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Only use compressed version if it's smaller
            if (blob.size < file.size) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error("Fehler beim Laden des Bildes"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Fehler beim Lesen der Datei"));
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "Unbekannt";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file icon based on MIME type
 */
export function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return "📄";

  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📕";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType === "text/csv") return "📋";

  return "📄";
}
