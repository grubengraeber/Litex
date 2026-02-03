# S3/MinIO Security Implementation

## Overview

This document outlines the security measures implemented for file storage in the Litex application using AWS S3 or MinIO.

## Security Features Implemented

### 1. Presigned URLs with Short Expiration

**Upload URLs**: 15 minutes (900 seconds)
- Prevents unauthorized uploads after the initial request
- Reduces attack window for intercepted URLs
- Forces users to use fresh URLs for each upload

**Download URLs**: 5 minutes (300 seconds)
- Minimizes exposure time for sensitive documents
- Prevents long-term sharing of download links
- Forces re-authentication for extended access

### 2. Server-Side Encryption

All uploaded files are encrypted at rest using AES-256:
```typescript
ServerSideEncryption: "AES256"
```

### 3. Content-Type Validation

- MIME types validated before upload
- Only whitelisted file types allowed
- File extension matches content type

### 4. Access Control

**Application Layer (Implemented)**:
- Row-level security in database queries
- User can only access own files (customers)
- Employees with permissions can access all files
- All file operations check permissions

**Bucket Level (Recommended for Production)**:
- See bucket policy below

### 5. File Path Structure

Files are organized by task:
```
kommunikation-uploads/
└── tasks/
    └── {taskId}/
        └── {timestamp}-{sanitized-filename}
```

Benefits:
- Prevents path traversal attacks
- Easy to identify orphaned files
- Simplifies backup/cleanup

### 6. Filename Sanitization

All filenames are sanitized:
```typescript
fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
```

Prevents:
- Path traversal attacks
- Special character exploits
- Unicode attacks

## Production Bucket Policy (MinIO/S3)

### Recommended Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::kommunikation-uploads",
        "arn:aws:s3:::kommunikation-uploads/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "AllowApplicationAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT-ID:user/litex-app"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::kommunikation-uploads/*"
    },
    {
      "Sid": "DenyUnencryptedObjectUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::kommunikation-uploads/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

### IAM Policy for Application User

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::kommunikation-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::kommunikation-uploads"
    }
  ]
}
```

## MinIO Configuration

### 1. Enable Versioning

```bash
mc version enable myminio/kommunikation-uploads
```

Benefits:
- Recover accidentally deleted files
- Audit trail of file changes
- Protection against ransomware

### 2. Set Lifecycle Policies

```bash
cat > lifecycle.json <<EOF
{
  "Rules": [
    {
      "ID": "DeleteOldVersions",
      "Status": "Enabled",
      "Filter": {},
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    },
    {
      "ID": "DeleteOrphanedMultipartUploads",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 1
      }
    }
  ]
}
EOF

mc ilm import myminio/kommunikation-uploads < lifecycle.json
```

### 3. Enable Encryption

```bash
mc encrypt set sse-s3 myminio/kommunikation-uploads
```

### 4. Set Bucket Quota (Optional)

```bash
# Limit bucket to 100GB
mc admin bucket quota myminio/kommunikation-uploads --hard 100gb
```

## Network Security

### 1. VPC Configuration (AWS)

- Place S3 VPC Endpoint in private subnet
- Route all S3 traffic through VPC endpoint
- No public internet access needed

### 2. MinIO Reverse Proxy

Example Nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name minio.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Limit upload size
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering for large uploads
        proxy_request_buffering off;
    }
}
```

## Monitoring & Auditing

### 1. Enable Access Logging

**MinIO**:
```bash
mc admin config set myminio logger_webhook:logs endpoint=https://logs.example.com/webhook
mc admin service restart myminio
```

**AWS S3**:
```bash
aws s3api put-bucket-logging \
  --bucket kommunikation-uploads \
  --bucket-logging-status \
  file://logging.json
```

### 2. CloudWatch Alarms (AWS)

Monitor:
- 4xx errors (unauthorized access attempts)
- 5xx errors (system issues)
- Bandwidth usage anomalies
- Large file uploads

### 3. Audit Trail

Track in application database:
- Who uploaded what file
- When files were downloaded
- Who approved/rejected files
- When files were deleted

## Compliance Considerations

### GDPR

- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (HTTPS/TLS)
- ✅ Access controls implemented
- ✅ Audit trail of all operations
- ✅ Right to deletion (soft delete in DB, hard delete in S3)

### Data Retention

Recommended policy:
- Keep active files indefinitely
- Delete rejected files after 30 days
- Delete files from deleted tasks after 90 days
- Archive approved files to Glacier after 1 year (AWS only)

## Disaster Recovery

### Backup Strategy

**Option 1: Cross-Region Replication (AWS)**
```bash
aws s3api put-bucket-replication \
  --bucket kommunikation-uploads \
  --replication-configuration file://replication.json
```

**Option 2: Regular Backups (MinIO)**
```bash
# Daily backup script
mc mirror --preserve myminio/kommunikation-uploads /backup/path/$(date +%Y%m%d)/
```

### Recovery Procedures

1. **File Corruption**: Restore from previous version (if versioning enabled)
2. **Accidental Deletion**: Restore from version history or backup
3. **Bucket Deletion**: Restore from backup
4. **Region Failure**: Failover to replica (if replication enabled)

## Security Checklist

### Initial Setup
- [ ] Enable HTTPS/TLS for all connections
- [ ] Configure bucket policy (deny insecure transport)
- [ ] Enable server-side encryption
- [ ] Set up IAM user with minimal permissions
- [ ] Enable versioning
- [ ] Configure lifecycle policies
- [ ] Set up access logging
- [ ] Configure backup/replication

### Regular Maintenance
- [ ] Review access logs monthly
- [ ] Audit file permissions quarterly
- [ ] Update credentials annually
- [ ] Test disaster recovery procedures quarterly
- [ ] Review and update bucket policies semi-annually

### Incident Response
- [ ] Document all security incidents
- [ ] Rotate credentials if compromised
- [ ] Review access logs for suspicious activity
- [ ] Notify affected users if data breach occurs

## Environment Variables

Required environment variables:

```bash
# S3/MinIO Connection
S3_ENDPOINT=https://minio.example.com  # For MinIO; leave empty for AWS S3
S3_REGION=eu-central-1
S3_BUCKET=kommunikation-uploads
S3_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxx
S3_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Custom domain for presigned URLs
S3_CUSTOM_DOMAIN=cdn.example.com
```

**Security Notes**:
- Never commit credentials to version control
- Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate credentials regularly (every 90 days minimum)
- Use different credentials for dev/staging/production

## References

- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [MinIO Security Documentation](https://min.io/docs/minio/linux/administration/identity-access-management.html)
- [OWASP File Upload Security](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
