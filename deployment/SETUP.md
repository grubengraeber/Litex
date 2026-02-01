# Litex Deployment Setup

## Option 1: Quick Local Development (ohne Coolify)

Schnellster Weg zum Testen:

```bash
cd deployment

# Services starten (PostgreSQL + MinIO)
docker compose up -d

# App lokal starten
cd ..
npm install
npm run dev
```

**URLs:**
- App: http://localhost:3000
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)
- PostgreSQL: localhost:5432 (litex / litex_secret_2026)

---

## Option 2: Full Stack mit Docker (ohne Coolify)

Alles in Docker inkl. App:

```bash
cd deployment

# Alles starten (baut die App)
docker compose -f docker-compose.local.yml up -d --build

# Logs ansehen
docker compose -f docker-compose.local.yml logs -f litex-app
```

**URLs:**
- App: http://localhost:3000
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5432

Von anderen Geräten im Netzwerk erreichbar unter:
- App: http://<DEINE-IP>:3000
- MinIO: http://<DEINE-IP>:9001

IP finden: `hostname -I` (Linux) oder `ipconfig` (Windows)

---

## Option 3: Coolify Setup (Self-Hosted PaaS)

### 1. Coolify installieren

```bash
# Auf dem Host-System (nicht in Docker!)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Nach der Installation:
- Coolify UI: http://localhost:8000
- Erstelle einen Admin-Account

### 2. Server in Coolify hinzufügen

1. Settings → Servers → Add Server
2. "Localhost" wählen (für lokale Entwicklung)
3. Docker Daemon verbinden lassen

### 3. PostgreSQL in Coolify erstellen

1. Resources → New → Database → PostgreSQL
2. Konfiguration:
   - Name: `litex-postgres`
   - User: `litex`
   - Password: `litex_secret_2026`
   - Database: `litex`
3. Deploy

### 4. MinIO in Coolify erstellen

1. Resources → New → Service → Docker Compose
2. Paste:

```yaml
services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

volumes:
  minio_data:
```

3. Deploy

### 5. Litex App in Coolify deployen

1. Resources → New → Application → GitHub
2. Repository: `grubengraeber/Litex`
3. Build Pack: Dockerfile
4. Environment Variables setzen:

```
DATABASE_URL=postgresql://litex:litex_secret_2026@litex-postgres:5432/litex
AUTH_SECRET=dein-geheimer-key-hier
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=kommunikation-uploads
S3_REGION=eu-central-1
```

5. Deploy

### 6. MinIO Bucket erstellen

Nach dem MinIO Deploy, Bucket `kommunikation-uploads` erstellen:

**Option A: MinIO Console (empfohlen)**
1. MinIO Console öffnen: `http://<server-ip>:9001`
2. Login: `minioadmin` / `minioadmin123`
3. Buckets → Create Bucket → Name: `kommunikation-uploads`
4. Access Policy: Private (Default)

**Option B: MinIO CLI**
```bash
# MinIO Client installieren
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc

# MinIO konfigurieren
./mc alias set litex http://localhost:9000 minioadmin minioadmin123

# Bucket erstellen
./mc mb litex/kommunikation-uploads
```

### 7. Datenbank-Migrationen ausführen

Nach dem ersten App-Deploy müssen die Tabellen erstellt werden:

```bash
# Lokal (mit DATABASE_URL gesetzt)
npm run db:generate  # Generiert Migration-Files
npm run db:migrate   # Führt Migrationen aus

# Oder: Drizzle Studio für DB-Verwaltung
npm run db:studio
```

In Coolify: App → Terminal → Commands ausführen

---

## Environment Variables

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://litex:pass@host:5432/litex` |
| `AUTH_SECRET` | Auth.js Secret (min 32 chars) | `openssl rand -base64 32` |
| `S3_ENDPOINT` | MinIO/S3 API URL | `http://minio:9000` |
| `S3_ACCESS_KEY` | S3 Access Key | `minioadmin` |
| `S3_SECRET_KEY` | S3 Secret Key | `minioadmin123` |
| `S3_BUCKET` | Upload Bucket Name | `kommunikation-uploads` |
| `S3_REGION` | S3 Region | `eu-central-1` |
| `SMTP_HOST` | E-Mail Server | `smtp.office365.com` |
| `SMTP_PORT` | SMTP Port | `587` |
| `SMTP_USER` | SMTP Username | `mail@domain.com` |
| `SMTP_PASS` | SMTP Password | `app-password` |
| `EMAIL_FROM` | Absender E-Mail | `noreply@litex.at` |

---

## Netzwerk-Zugriff von anderen Geräten

1. Firewall-Ports öffnen:
   - 3000 (App)
   - 9000 (MinIO API)
   - 9001 (MinIO Console)
   - 8000 (Coolify UI, falls verwendet)

2. Lokale IP finden:
   ```bash
   # Linux/Mac
   hostname -I | awk '{print $1}'
   
   # Windows (PowerShell)
   (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}).IPAddress
   ```

3. Von anderem Gerät aufrufen:
   - `http://192.168.x.x:3000`
