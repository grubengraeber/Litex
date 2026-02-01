# Litex - ALB Klientenportal

Kommunikations- und Aufgabenplattform zur strukturierten Klärung offener Buchungen.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL 15 + Drizzle ORM
- **Auth:** Auth.js v5 (Passwordless Magic Links)
- **Storage:** MinIO (S3-kompatibel)
- **Styling:** Tailwind CSS + shadcn/ui
- **Hosting:** Coolify (Self-Hosted PaaS)

## Features

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

1. **Clone the repository:**
   ```bash
   git clone https://github.com/grubengraeber/Litex.git
   cd Litex
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Setup database:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

6. **Open http://localhost:3000**

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth pages (login, verify)
│   ├── (dashboard)/      # Dashboard pages
│   └── api/              # API routes
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── tasks/            # Task-related components
├── db/
│   ├── schema.ts         # Drizzle schema
│   └── index.ts          # Database connection
└── lib/
    ├── auth.ts           # Auth.js configuration
    └── utils.ts          # Utility functions
```

## License

Private - ALB Kanzlei
