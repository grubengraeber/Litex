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
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=kommunikation-uploads
```

5. Deploy

---

## Environment Variables

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://litex:pass@host:5432/litex` |
| `AUTH_SECRET` | Auth.js Secret (min 32 chars) | `openssl rand -base64 32` |
| `MINIO_ENDPOINT` | MinIO API URL | `http://minio:9000` |
| `MINIO_ACCESS_KEY` | MinIO Access Key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO Secret Key | `minioadmin123` |
| `MINIO_BUCKET` | Upload Bucket Name | `kommunikation-uploads` |
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
