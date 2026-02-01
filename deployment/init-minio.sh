#!/bin/sh
# Wait for MinIO to be ready and create the default bucket

set -e

MINIO_HOST="${MINIO_HOST:-minio:9000}"
MINIO_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-minioadmin123}"
BUCKET_NAME="${BUCKET_NAME:-kommunikation-uploads}"

echo "Waiting for MinIO to be ready..."
until curl -s "http://${MINIO_HOST}/minio/health/ready" > /dev/null 2>&1; do
  sleep 2
done

echo "MinIO is ready. Configuring mc client..."
mc alias set local "http://${MINIO_HOST}" "${MINIO_USER}" "${MINIO_PASS}"

echo "Creating bucket '${BUCKET_NAME}' if it doesn't exist..."
mc mb --ignore-existing "local/${BUCKET_NAME}"

echo "Bucket setup complete!"
mc ls local/
