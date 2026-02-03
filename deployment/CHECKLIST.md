# Litex Deployment Checklist

> Checkliste für das initiale Deployment auf Coolify.

## Pre-Deployment

- [ ] Coolify installiert und erreichbar (http://100.75.73.111:8000)
- [ ] GitHub Repository Zugriff konfiguriert
- [ ] Sichere Passwörter generiert:
  ```bash
  # AUTH_SECRET
  openssl rand -base64 32
  
  # CRON_SECRET  
  openssl rand -hex 32
  
  # PostgreSQL Password
  openssl rand -base64 16
  
  # MinIO Password (min 8 Zeichen)
  openssl rand -base64 12
  ```

---

## 1. PostgreSQL Container

- [ ] PostgreSQL 15 Container in Coolify erstellt
- [ ] Konfiguration:
  - [ ] Name: `litex-postgres`
  - [ ] User: `litex`
  - [ ] Password: `<generiertes-passwort>`
  - [ ] Database: `litex`
- [ ] Container läuft (Status: Running)
- [ ] Verbindung getestet:
  ```bash
  docker exec -it <container-id> psql -U litex -d litex -c "SELECT 1"
  ```
- [ ] DATABASE_URL notiert: `postgresql://litex:<password>@litex-postgres:5432/litex`

---

## 2. MinIO Container

- [ ] MinIO Container in Coolify erstellt
- [ ] Konfiguration:
  - [ ] `MINIO_ROOT_USER` gesetzt
  - [ ] `MINIO_ROOT_PASSWORD` gesetzt (min 8 Zeichen)
- [ ] Container läuft (Status: Running)
- [ ] Console erreichbar: http://100.75.73.111:9001
- [ ] Buckets erstellt:
  - [ ] `kommunikation-uploads`
  - [ ] `kommunikation-imports`
- [ ] Import-Ordnerstruktur erstellt:
  - [ ] `kommunikation-imports/pending/`
  - [ ] `kommunikation-imports/processed/`
  - [ ] `kommunikation-imports/failed/`
- [ ] CORS konfiguriert (falls Browser-Uploads benötigt)
- [ ] S3 Credentials notiert:
  - [ ] `S3_ENDPOINT`
  - [ ] `S3_ACCESS_KEY`
  - [ ] `S3_SECRET_KEY`

---

## 3. SMTP Email

- [ ] SMTP Provider gewählt (Office365 / Gmail / SES / Custom)
- [ ] SMTP Credentials vorhanden:
  - [ ] `SMTP_HOST`
  - [ ] `SMTP_PORT`
  - [ ] `SMTP_USER`
  - [ ] `SMTP_PASS` (App-Password für Office365/Gmail)
  - [ ] `EMAIL_FROM`
- [ ] Test-Email gesendet und empfangen:
  ```bash
  # Nach App-Deploy testen
  curl -X POST http://100.75.73.111:3333/api/test-email \
    -H "Content-Type: application/json" \
    -d '{"to": "test@example.com"}'
  ```

---

## 4. Litex App

- [ ] App in Coolify erstellt
- [ ] GitHub Repository verbunden: `grubengraeber/Litex`
- [ ] Build Pack: Dockerfile
- [ ] Environment Variables gesetzt:

```
# Database
DATABASE_URL=postgresql://litex:<password>@litex-postgres:5432/litex

# Auth
AUTH_SECRET=<generiert>
NEXTAUTH_URL=http://100.75.73.111:3333

# S3/MinIO
S3_ENDPOINT=http://minio:9000
S3_REGION=eu-central-1
S3_ACCESS_KEY=<minio-user>
S3_SECRET_KEY=<minio-password>
S3_BUCKET=kommunikation-uploads
S3_IMPORT_BUCKET=kommunikation-imports

# SMTP
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
EMAIL_FROM=Litex <noreply@litex.at>

# Cron
CRON_SECRET=<generiert>

# Production
NODE_ENV=production
```

- [ ] Build erfolgreich
- [ ] App läuft (Status: Running)
- [ ] App erreichbar: http://100.75.73.111:3333

---

## 5. Database Migrations

- [ ] In App-Container eingeloggt oder Coolify Console geöffnet
- [ ] Migrations ausgeführt:
  ```bash
  npx drizzle-kit migrate
  ```
- [ ] Migrations erfolgreich (keine Fehler)
- [ ] Optional: Seed-Daten geladen:
  ```bash
  npx tsx src/db/seed.ts
  ```

---

## 6. Cron Jobs

- [ ] In Coolify App → Settings → Scheduled Tasks
- [ ] Traffic Light Update Job:
  - [ ] Name: `traffic-light-update`
  - [ ] Schedule: `*/15 * * * *` (alle 15 Min)
  - [ ] Command: 
    ```
    curl -s -X POST http://localhost:3000/api/cron/deadlines -H "Authorization: Bearer $CRON_SECRET"
    ```
- [ ] BMD Import Job:
  - [ ] Name: `bmd-import`
  - [ ] Schedule: `0 */2 * * *` (alle 2 Stunden)
  - [ ] Command:
    ```
    curl -s -X POST http://localhost:3000/api/cron/import -H "Authorization: Bearer $CRON_SECRET"
    ```
- [ ] Cron Jobs getestet (manueller Trigger)

---

## 7. Funktionstest

- [ ] Login-Seite lädt
- [ ] Magic Link Email wird gesendet
- [ ] Login mit Code funktioniert
- [ ] Dashboard lädt
- [ ] Tasks werden angezeigt
- [ ] Datei-Upload funktioniert
- [ ] Datei-Download funktioniert
- [ ] Kommentare können erstellt werden

---

## 8. Backup & Monitoring

- [ ] PostgreSQL Backup konfiguriert (Coolify oder Script)
- [ ] MinIO Backup überlegt (optional)
- [ ] Logs zugänglich:
  ```bash
  docker logs litex-app
  docker logs litex-postgres
  docker logs litex-minio
  ```

---

## Post-Deployment Notes

**Wichtige URLs:**
| Service | URL |
|---------|-----|
| Litex App | http://100.75.73.111:3333 |
| Coolify | http://100.75.73.111:8000 |
| MinIO Console | http://100.75.73.111:9001 |

**Secrets (sicher aufbewahren!):**
- [ ] AUTH_SECRET dokumentiert
- [ ] CRON_SECRET dokumentiert
- [ ] DB Password dokumentiert
- [ ] MinIO Password dokumentiert
- [ ] SMTP Password dokumentiert

**Nächste Schritte:**
- [ ] Admin-User erstellen
- [ ] Erste Company anlegen
- [ ] Test-Import mit BMD CSV durchführen
- [ ] Benutzer einladen

---

## Troubleshooting Quick Reference

**App startet nicht:**
```bash
docker logs litex-app --tail 100
```

**DB Verbindung fehlgeschlagen:**
```bash
docker exec -it litex-postgres psql -U litex -d litex
```

**MinIO nicht erreichbar:**
```bash
curl http://100.75.73.111:9000/minio/health/live
```

**Emails werden nicht gesendet:**
- SMTP Credentials prüfen
- App-Password statt normales Passwort?
- Port 587 offen?
