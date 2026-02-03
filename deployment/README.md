# Litex Deployment Guide

> Komplette Anleitung für das Deployment auf Coolify.

## Inhaltsverzeichnis

1. [PostgreSQL Setup](#1-postgresql-setup)
2. [MinIO Setup](#2-minio-setup)
3. [SMTP Email Setup](#3-smtp-email-setup)
4. [Litex App Deployment](#4-litex-app-deployment)
5. [Cron Jobs](#5-cron-jobs)
6. [Troubleshooting](#troubleshooting)

---

## 1. PostgreSQL Setup

### Coolify Container Konfiguration

1. **In Coolify:** Resources → New → Database → PostgreSQL 15
2. **Konfiguration:**
   - Name: `litex-postgres`
   - Image: `postgres:15-alpine`
   - Username: `litex`
   - Password: `<sicheres-passwort-generieren>`
   - Database: `litex`
   
3. **Persistent Volume:** Automatisch von Coolify erstellt

### DATABASE_URL Format

```
postgresql://<user>:<password>@<host>:<port>/<database>
```

**Beispiele:**

```bash
# Coolify intern (Container-zu-Container)
DATABASE_URL=postgresql://litex:password@litex-postgres:5432/litex

# Extern (mit Public Port)
DATABASE_URL=postgresql://litex:password@100.75.73.111:5432/litex
```

### Initial Migration

Nach dem ersten Deploy der App:

```bash
# In der Coolify App Console oder via SSH
npx drizzle-kit migrate
```

Oder manuell via `psql`:

```bash
# Von Host-Machine
docker exec -it <postgres-container-id> psql -U litex -d litex
```

### Backup-Strategie

**Option 1: Coolify Backups (empfohlen)**
- In der PostgreSQL Resource: Settings → Backups
- Schedule: Täglich um 03:00 UTC
- Retention: 7 Tage

**Option 2: Manueller Backup Script**

```bash
#!/bin/bash
# backup-postgres.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER="litex-postgres"
BACKUP_DIR="/backups/postgres"

mkdir -p $BACKUP_DIR

docker exec $CONTAINER pg_dump -U litex litex | gzip > "$BACKUP_DIR/litex_$TIMESTAMP.sql.gz"

# Alte Backups löschen (älter als 14 Tage)
find $BACKUP_DIR -name "*.sql.gz" -mtime +14 -delete
```

**Cron einrichten:**
```bash
# Täglich um 03:00
0 3 * * * /opt/scripts/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1
```

**Restore:**
```bash
gunzip -c backup.sql.gz | docker exec -i litex-postgres psql -U litex litex
```

---

## 2. MinIO Setup

### Coolify Container Konfiguration

1. **In Coolify:** Resources → New → Service → Docker Compose
2. **Compose File:**

```yaml
services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-changeme123!}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"   # API
      - "9001:9001"   # Console
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  minio_data:
```

3. **Environment Variables setzen:**
   - `MINIO_ROOT_USER`: Admin Username
   - `MINIO_ROOT_PASSWORD`: Admin Password (min. 8 Zeichen)

### Bucket-Struktur

Nach dem Start von MinIO, Buckets erstellen:

**Via MinIO Console (http://100.75.73.111:9001):**
1. Login mit Root Credentials
2. Buckets → Create Bucket
3. Erstellen:
   - `kommunikation-uploads` - Für Datei-Uploads von Usern
   - `kommunikation-imports` - Für BMD CSV Imports

**Via mc CLI:**
```bash
# MinIO Client konfigurieren
mc alias set litex http://100.75.73.111:9000 minioadmin changeme123!

# Buckets erstellen
mc mb litex/kommunikation-uploads
mc mb litex/kommunikation-imports

# Ordnerstruktur für Imports
mc cp /dev/null litex/kommunikation-imports/pending/.gitkeep
mc cp /dev/null litex/kommunikation-imports/processed/.gitkeep
mc cp /dev/null litex/kommunikation-imports/failed/.gitkeep
```

### Environment Variables für Litex

```bash
# MinIO/S3 Konfiguration
S3_ENDPOINT=http://minio:9000           # Intern (Container-zu-Container)
S3_ENDPOINT=http://100.75.73.111:9000   # Extern
S3_REGION=eu-central-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=changeme123!
S3_BUCKET=kommunikation-uploads

# Import Bucket (für Cron)
S3_IMPORT_BUCKET=kommunikation-imports
```

### CORS Konfiguration für Presigned URLs

Falls Uploads aus dem Browser fehlschlagen, CORS aktivieren:

**Via mc CLI:**
```bash
# cors.json erstellen
cat > /tmp/cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://100.75.73.111:3333", "https://litex.example.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-meta-*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# CORS setzen
mc cors set litex/kommunikation-uploads /tmp/cors.json
mc cors set litex/kommunikation-imports /tmp/cors.json
```

**Via MinIO Console:**
1. Bucket → Settings → Access Rules
2. CORS Configuration hinzufügen

### Service Account für App (Best Practice)

Statt Root Credentials einen Service Account erstellen:

1. MinIO Console → Identity → Service Accounts
2. Create Service Account
3. Policy: `readwrite` auf `kommunikation-*` Buckets

---

## 3. SMTP Email Setup

### Unterstützte Provider

| Provider | Host | Port | Secure |
|----------|------|------|--------|
| Microsoft 365 | smtp.office365.com | 587 | STARTTLS |
| Gmail | smtp.gmail.com | 587 | STARTTLS |
| Amazon SES | email-smtp.eu-central-1.amazonaws.com | 587 | STARTTLS |
| Mailgun | smtp.mailgun.org | 587 | STARTTLS |
| Custom | - | - | - |

### Environment Variables

```bash
# SMTP Konfiguration
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false                    # true für Port 465
SMTP_USER=noreply@litex.at
SMTP_PASS=<app-password>
EMAIL_FROM="Litex <noreply@litex.at>"

# Optional: Für Test-Emails
SMTP_TEST_RECIPIENT=admin@example.com
```

### Microsoft 365 App-Password

1. Microsoft 365 Admin Center
2. User → Security → App Passwords
3. Neues App-Password erstellen
4. Als `SMTP_PASS` verwenden

### Test-Email senden

```bash
# Via API (nach Deploy)
curl -X POST http://100.75.73.111:3333/api/test-email \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

Oder in der App Console:
```bash
npx tsx -e "
const { sendTestEmail } = require('./src/lib/email');
sendTestEmail('test@example.com').then(console.log);
"
```

---

## 4. Litex App Deployment

### Coolify App Konfiguration

1. **In Coolify:** Resources → New → Application → GitHub
2. **Repository:** `grubengraeber/Litex`
3. **Branch:** `main`
4. **Build Pack:** Dockerfile

### Alle Environment Variables

```bash
# === Database ===
DATABASE_URL=postgresql://litex:password@litex-postgres:5432/litex

# === Auth ===
AUTH_SECRET=<mindestens-32-zeichen-generieren>
NEXTAUTH_URL=http://100.75.73.111:3333

# === S3/MinIO ===
S3_ENDPOINT=http://minio:9000
S3_REGION=eu-central-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=changeme123!
S3_BUCKET=kommunikation-uploads
S3_IMPORT_BUCKET=kommunikation-imports

# === SMTP ===
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@litex.at
SMTP_PASS=<app-password>
EMAIL_FROM="Litex <noreply@litex.at>"

# === Cron ===
CRON_SECRET=<mindestens-32-zeichen-generieren>

# === Optional ===
NODE_ENV=production
```

### Nach dem ersten Deploy

```bash
# Migrations ausführen
npx drizzle-kit migrate

# Optional: Seed-Daten
npx tsx src/db/seed.ts
```

---

## 5. Cron Jobs

### In Coolify einrichten

Coolify unterstützt Cron Jobs für Apps:

1. App → Settings → Scheduled Tasks
2. Hinzufügen:

| Name | Schedule | Command |
|------|----------|---------|
| Traffic Light Update | `*/15 * * * *` | `curl -X POST http://localhost:3000/api/cron/deadlines -H "Authorization: Bearer $CRON_SECRET"` |
| BMD Import | `0 */2 * * *` | `curl -X POST http://localhost:3000/api/cron/import -H "Authorization: Bearer $CRON_SECRET"` |

### Alternative: System Cron

Falls Coolify Cron nicht verfügbar:

```bash
# /etc/cron.d/litex
CRON_SECRET=<secret>

# Traffic Light alle 15 Minuten
*/15 * * * * root curl -s -X POST http://localhost:3000/api/cron/deadlines -H "Authorization: Bearer $CRON_SECRET" >> /var/log/litex-cron.log 2>&1

# BMD Import alle 2 Stunden
0 */2 * * * root curl -s -X POST http://localhost:3000/api/cron/import -H "Authorization: Bearer $CRON_SECRET" >> /var/log/litex-cron.log 2>&1
```

### BMD CSV Import Workflow

1. CSV-Datei nach `kommunikation-imports/pending/` hochladen
2. Cron Job läuft alle 2 Stunden
3. Erfolgreich verarbeitete Dateien → `processed/`
4. Fehlerhafte Dateien → `failed/`

**CSV Format:**
```csv
bmd_booking_id,bmd_client_id,client_name,booking_text,amount,document_date,booking_date,period,due_date
BK-2025-001,C-100,Musterfirma GmbH,Rechnung #123,1500.00,2025-01-15,2025-01-20,2025-01,2025-02-15
```

---

## Troubleshooting

### PostgreSQL Verbindung fehlgeschlagen

```bash
# Container Status prüfen
docker ps | grep postgres

# Logs ansehen
docker logs litex-postgres

# Verbindung testen
docker exec -it litex-postgres psql -U litex -d litex -c "SELECT 1"
```

### MinIO nicht erreichbar

```bash
# Container Status
docker ps | grep minio

# Health Check
curl http://100.75.73.111:9000/minio/health/live

# Logs
docker logs litex-minio
```

### Emails werden nicht gesendet

1. SMTP Credentials prüfen
2. Firewall für Port 587 offen?
3. App-Password statt normales Passwort verwenden
4. Logs prüfen: `docker logs litex-app | grep -i mail`

### Presigned URLs funktionieren nicht

1. CORS Konfiguration prüfen
2. S3_ENDPOINT erreichbar von Client?
3. Bucket Policy prüfen

---

## Quick Reference

| Service | Intern | Extern |
|---------|--------|--------|
| PostgreSQL | litex-postgres:5432 | 100.75.73.111:5432 |
| MinIO API | minio:9000 | 100.75.73.111:9000 |
| MinIO Console | - | 100.75.73.111:9001 |
| Litex App | - | 100.75.73.111:3333 |
| Coolify | - | 100.75.73.111:8000 |

**Secrets generieren:**
```bash
# AUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -hex 32
```
