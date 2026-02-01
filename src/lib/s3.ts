import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.S3_REGION || "eu-central-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET = process.env.S3_BUCKET || "kommunikation-uploads";

export interface UploadUrlResult {
  uploadUrl: string;
  storageKey: string;
  bucket: string;
}

export interface DownloadUrlResult {
  downloadUrl: string;
}

/**
 * Generate a presigned URL for uploading a file
 */
export async function getUploadUrl(
  taskId: string,
  fileName: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<UploadUrlResult> {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storageKey = `tasks/${taskId}/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    uploadUrl,
    storageKey,
    bucket: BUCKET,
  };
}

/**
 * Generate a presigned URL for downloading a file
 */
export async function getDownloadUrl(
  storageKey: string,
  fileName?: string,
  expiresIn: number = 3600
): Promise<DownloadUrlResult> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
    ResponseContentDisposition: fileName 
      ? `attachment; filename="${fileName}"` 
      : undefined,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    downloadUrl,
  };
}

/**
 * Delete a file from S3/MinIO
 */
export async function deleteFile(storageKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
  });

  await s3Client.send(command);
}

/**
 * Generate a storage key for a file
 */
export function generateStorageKey(taskId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `tasks/${taskId}/${timestamp}-${sanitizedFileName}`;
}
