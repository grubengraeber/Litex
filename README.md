# Litex - ALB Klientenportal

Kommunikations- und Aufgabenplattform zur strukturierten Klärung offener Buchungen.

> **Hinweis:** Dies ist ein privates Kundenprojekt.

## Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Framework | Next.js 14+ (App Router) |
| Sprache | TypeScript |
| Datenbank | PostgreSQL 15 + Drizzle ORM |
| Auth | Auth.js v5 (Passwordless Magic Links) |
| Storage | MinIO (S3-kompatibel) |
| Styling | Tailwind CSS + shadcn/ui |
| Hosting | Coolify (Self-Hosted PaaS) |

## MVP Features

- ✅ Passwordless Login (Magic Link + 6-stelliger Code)
- ✅ Session Management (30 Tage)
- ✅ Aufgabenliste mit Monats-Tabs und Ampel-Status
- ✅ Aufgaben-Detailansicht
- ✅ Kommentar-Funktion
- ✅ Beleg-Upload zu MinIO
- ✅ CSV-Import via Coolify Cron
- ✅ Rollen: Kunde vs. Mitarbeiter
- ✅ Benutzer einladen per Magic Link

## Getting Started

### Voraussetzungen

- Node.js 18+
- PostgreSQL 15
- MinIO (oder S3-kompatibler Storage)

### Installation

```bash
# Repository klonen
git clone https://github.com/grubengraeber/Litex.git
cd Litex

# Dependencies installieren
npm install

# Environment einrichten
cp .env.example .env
# .env mit eigenen Werten befüllen

# Datenbank migrieren
npm run db:generate
npm run db:migrate

# Development Server starten
npm run dev
```

Öffne http://localhost:3000

## Projektstruktur

```
src/
├── app/
│   ├── (auth)/           # Auth Seiten (Login, Verify)
│   ├── (dashboard)/      # Dashboard Seiten
│   └── api/              # API Routes
├── components/
│   ├── ui/               # shadcn/ui Komponenten
│   ├── layout/           # Layout Komponenten (Sidebar, Header)
│   └── tasks/            # Task Komponenten
├── db/
│   ├── schema.ts         # Drizzle Schema
│   └── index.ts          # DB Connection
└── lib/
    ├── auth.ts           # Auth.js Konfiguration
    └── utils.ts          # Utility Functions
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=...
MINIO_ENDPOINT=...
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=kommunikation-uploads
```

## Deployment

Das Projekt ist für Coolify (Self-Hosted PaaS) optimiert.

1. Coolify Projekt erstellen
2. Git Repository verbinden
3. Environment Variables setzen
4. Deploy

---

*ALB Kanzlei - Kommunikations- und Aufgabenplattform*
