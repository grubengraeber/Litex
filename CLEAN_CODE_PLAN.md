# Clean Code Refactoring Plan - Litex

## Übersicht

Dieser Plan strukturiert die Säuberung der Codebase in sequenzielle Phasen. Ziel ist eine wartbare, testbare und skalierbare Anwendung nach Clean Code Prinzipien.

### Aktuelle Situation
- **34 Dateien** mit >200 Zeilen (größte: 752 Zeilen)
- **Keine Tests** vorhanden (0 Test-Dateien gefunden)
- Logik und Views oft vermischt
- Fehlende Separation of Concerns in großen Komponenten

### Ziele
- Dateien maximal 75 Zeilen
- Klare Trennung: Logik / Views / State / Types
- Vollständige Test-Abdeckung (Unit + Integration)
- Single Responsibility Principle
- Wiederverwendbare Subcomponents

---

## Phase 1: Infrastruktur & Testing Setup

### 1.1 Testing Framework einrichten
- [ ] Vitest installieren und konfigurieren
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom
  ```
- [ ] Testing-Scripts in `package.json` hinzufügen
  ```json
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
  ```
- [ ] Vitest Config erstellen (`vitest.config.ts`)
- [ ] Test-Utilities Ordner anlegen (`src/test-utils/`)
- [ ] Mock-Provider für Tests erstellen

### 1.2 Ordnerstruktur erweitern
- [ ] `src/types/` - Alle Type Definitions
- [ ] `src/services/` - Business Logic & API Calls
- [ ] `src/hooks/` - Custom Hooks (bereits vorhanden, erweitern)
- [ ] `src/utils/` - Utility Functions
- [ ] `src/constants/` - Konstanten (aus `lib/constants.ts`)
- [ ] `src/__tests__/` - Test-Dateien strukturiert nach Feature
- [ ] `src/components/` nach Feature organisieren

### 1.3 Linting & Code Quality
- [ ] ESLint Regeln verschärfen
- [ ] Prettier konfigurieren
- [ ] Husky für Pre-commit Hooks einrichten
- [ ] `lint-staged` konfigurieren
- [ ] Max-lines ESLint Rule aktivieren (75 Zeilen)

---

## Phase 2: Type System & Datenmodelle

### 2.1 Zentrale Type Definitions
- [ ] `src/types/task.types.ts` - Task-bezogene Types
- [ ] `src/types/user.types.ts` - User & Auth Types
- [ ] `src/types/company.types.ts` - Company Types
- [ ] `src/types/file.types.ts` - File Upload Types
- [ ] `src/types/audit.types.ts` - Audit Log Types
- [ ] `src/types/api.types.ts` - API Response/Request Types
- [ ] `src/types/permission.types.ts` - Permission & Role Types
- [ ] Bestehende Interface Definitions extrahieren

### 2.2 Zod Schemas separieren
- [ ] `src/schemas/task.schema.ts`
- [ ] `src/schemas/user.schema.ts`
- [ ] `src/schemas/auth.schema.ts`
- [ ] `src/schemas/file.schema.ts`
- [ ] Validierung aus Komponenten extrahieren

---

## Phase 3: Services Layer (Business Logic)

### 3.1 API Services erstellen
- [ ] `src/services/api/task.service.ts`
  - `getTasks()`, `getTaskById()`, `createTask()`, `updateTask()`
- [ ] `src/services/api/user.service.ts`
  - User CRUD Operations
- [ ] `src/services/api/company.service.ts`
- [ ] `src/services/api/file.service.ts`
- [ ] `src/services/api/auth.service.ts`
- [ ] `src/services/api/notification.service.ts`
- [ ] `src/services/api/audit.service.ts`

### 3.2 Business Logic Services
- [ ] `src/services/task-status.service.ts`
  - Traffic Light Logik
  - Status Transitions
- [ ] `src/services/permission.service.ts`
  - Permission Checks
  - Role-based Access
- [ ] `src/services/notification.service.ts`
  - Notification Logic
- [ ] `src/services/file-validation.service.ts`
  - File Upload Validation
  - Size/Type Checks

### 3.3 Tests für Services
- [ ] Unit Tests für jeden Service
- [ ] Mock API Responses
- [ ] Edge Cases testen
- [ ] Error Handling testen

---

## Phase 4: Custom Hooks Refactoring

### 4.1 Bestehende Hooks refactorn
- [ ] `use-notifications.ts` - Max 75 Zeilen, Logic extrahieren
- [ ] `use-comments.ts` - Service Layer verwenden
- [ ] `use-task-filters.ts` - Business Logic auslagern
- [ ] `use-role.ts` - Vereinfachen

### 4.2 Neue Hooks erstellen
- [ ] `use-task-actions.ts` - Task Actions (submit, complete, return)
- [ ] `use-file-upload.ts` - File Upload Logic
- [ ] `use-permission.ts` - Permission Checking
- [ ] `use-debounced-search.ts` - Search Funktionalität
- [ ] `use-data-table.ts` - Generischer DataTable Hook

### 4.3 Hook Tests
- [ ] Unit Tests für jeden Hook
- [ ] React Testing Library verwenden
- [ ] Custom Render mit Providern

---

## Phase 5: UI Components Refactoring (Kritische Dateien)

### 5.1 Sidebar (752 Zeilen) → Aufteilen
**Ziel: 10-12 Komponenten à 60-75 Zeilen**

- [ ] `sidebar/sidebar-provider.tsx` (Context + State)
- [ ] `sidebar/sidebar-container.tsx` (Main Container)
- [ ] `sidebar/sidebar-trigger.tsx` (Toggle Button)
- [ ] `sidebar/sidebar-inset.tsx`
- [ ] `sidebar/sidebar-content.tsx`
- [ ] `sidebar/sidebar-header.tsx`
- [ ] `sidebar/sidebar-footer.tsx`
- [ ] `sidebar/sidebar-menu.tsx`
- [ ] `sidebar/sidebar-menu-item.tsx`
- [ ] `sidebar/sidebar-menu-button.tsx`
- [ ] `sidebar/sidebar-group.tsx`
- [ ] `sidebar/sidebar-separator.tsx`
- [ ] `sidebar/types.ts` (Sidebar Types)
- [ ] `sidebar/constants.ts` (Sidebar Constants)
- [ ] `sidebar/hooks/use-sidebar.ts` (Hook separat)
- [ ] Tests für jede Komponente

### 5.2 Task Detail Page (530 Zeilen) → Aufteilen
**Ziel: 8-10 Komponenten**

- [ ] `tasks/[id]/task-detail-header.tsx`
  - Breadcrumb, Title, Edit Button
- [ ] `tasks/[id]/task-info-card.tsx`
  - Company, Amount, Dates
- [ ] `tasks/[id]/task-status-badge.tsx`
  - Status + Traffic Light
- [ ] `tasks/[id]/task-actions-panel.tsx`
  - Action Buttons (Submit, Complete, Return)
- [ ] `tasks/[id]/task-files-section.tsx`
  - File Upload + List
- [ ] `tasks/[id]/task-comments-section.tsx`
  - Comments UI
- [ ] `tasks/[id]/task-detail-layout.tsx`
  - Layout Wrapper
- [ ] `tasks/[id]/use-task-detail.ts`
  - Hook für Data Fetching + Actions
- [ ] `tasks/[id]/task-detail.types.ts`
- [ ] Integration Tests

### 5.3 Users Page (508 Zeilen) → Aufteilen
- [ ] `users/users-page-header.tsx`
- [ ] `users/invite-user-dialog.tsx`
- [ ] `users/edit-user-dialog.tsx`
- [ ] `users/user-role-badge.tsx`
- [ ] `users/use-users-data.ts`
- [ ] `users/use-user-actions.ts`
- [ ] Tests

### 5.4 Chat Panel (480 Zeilen) → Aufteilen
- [ ] `chat/chat-panel-container.tsx`
- [ ] `chat/chat-message-list.tsx`
- [ ] `chat/chat-message-item.tsx`
- [ ] `chat/chat-input-form.tsx`
- [ ] `chat/chat-header.tsx`
- [ ] `chat/use-chat-messages.ts`
- [ ] Tests

### 5.5 Dashboard Page (377 Zeilen) → Aufteilen
- [ ] `dashboard/dashboard-header.tsx`
- [ ] `dashboard/stats-cards.tsx`
- [ ] `dashboard/stat-card.tsx`
- [ ] `dashboard/deadline-warnings.tsx`
- [ ] `dashboard/deadline-warning-card.tsx`
- [ ] `dashboard/recent-activity.tsx`
- [ ] `dashboard/use-dashboard-data.ts`
- [ ] Tests

### 5.6 Roles Page (427 Zeilen) → Aufteilen
- [ ] `roles/roles-page-header.tsx`
- [ ] `roles/create-role-dialog.tsx`
- [ ] `roles/edit-role-dialog.tsx`
- [ ] `roles/role-permissions-form.tsx`
- [ ] `roles/use-roles-data.ts`
- [ ] Tests

---

## Phase 6: API Routes Refactoring

### 6.1 Route Handler Extraktion
Für jeden API Route (z.B. `/api/tasks/route.ts`):

- [ ] Controller erstellen: `src/controllers/task.controller.ts`
- [ ] Validation Middleware: `src/middleware/validation.middleware.ts`
- [ ] Error Handler: `src/middleware/error.middleware.ts`
- [ ] Route bleibt minimal (nur Handler-Aufruf)

### 6.2 Spezifische Routes
- [ ] `/api/tasks/route.ts` (294 Zeilen) → Controller + Service
- [ ] `/api/users/route.ts` (294 Zeilen) → Controller + Service
- [ ] `/api/tasks/[id]/files/route.ts` (250 Zeilen) → Aufteilen
- [ ] `/api/cron/notifications/route.ts` (257 Zeilen) → Service Layer
- [ ] Alle anderen API Routes vereinfachen

### 6.3 API Tests
- [ ] Integration Tests für jeden Endpoint
- [ ] Mock Database Queries
- [ ] Auth/Permission Tests
- [ ] Error Case Tests

---

## Phase 7: Database Layer

### 7.1 Queries Refactoring (470 Zeilen)
- [ ] `db/queries/task.queries.ts`
- [ ] `db/queries/user.queries.ts`
- [ ] `db/queries/company.queries.ts`
- [ ] `db/queries/file.queries.ts`
- [ ] `db/queries/audit.queries.ts`
- [ ] `db/queries/notification.queries.ts`
- [ ] Jede Query-Datei max 75 Zeilen

### 7.2 Schema Refactoring (306 Zeilen)
- [ ] `db/schema/users.schema.ts`
- [ ] `db/schema/tasks.schema.ts`
- [ ] `db/schema/companies.schema.ts`
- [ ] `db/schema/files.schema.ts`
- [ ] `db/schema/audit.schema.ts`
- [ ] `db/schema/index.ts` (Re-exports)

### 7.3 Database Tests
- [ ] Query Tests mit Test-DB
- [ ] Transaction Tests
- [ ] Migration Tests

---

## Phase 8: Smaller Components

### 8.1 Weitere große Komponenten
- [ ] `file-upload.tsx` (315 Zeilen) → Aufteilen
- [ ] `create-task-dialog.tsx` (255 Zeilen) → Form Components
- [ ] `tasks-table.tsx` (246 Zeilen) → Table Components
- [ ] `chat-view.tsx` (377 Zeilen) → Wie Chat Panel
- [ ] `settings/page.tsx` (343 Zeilen) → Settings Components
- [ ] `companies/page.tsx` (280 Zeilen) → Company Components

### 8.2 Table Components generalisieren
- [ ] `data-table/data-table-base.tsx`
- [ ] `data-table/data-table-header.tsx`
- [ ] `data-table/data-table-pagination.tsx`
- [ ] `data-table/data-table-filters.tsx`
- [ ] `data-table/use-data-table.ts`
- [ ] Spezifische Tables als Komposition

---

## Phase 9: Authentication & Authorization

### 9.1 Auth Refactoring
- [ ] `lib/auth.ts` (244 Zeilen) → Aufteilen
- [ ] `lib/auth/config.ts`
- [ ] `lib/auth/providers.ts`
- [ ] `lib/auth/callbacks.ts`
- [ ] `lib/auth/session.ts`

### 9.2 Permission System
- [ ] `lib/permissions.ts` (206 Zeilen) → Aufteilen
- [ ] `lib/permissions/role-permissions.ts`
- [ ] `lib/permissions/permission-checks.ts`
- [ ] `lib/permissions/constants.ts`
- [ ] Tests für Permission Logic

---

## Phase 10: Integration Tests

### 10.1 End-to-End Flows
- [ ] Playwright installieren und konfigurieren
- [ ] Login Flow Test
- [ ] Task Creation Flow
- [ ] File Upload Flow
- [ ] Comment Flow
- [ ] User Invitation Flow
- [ ] Role Management Flow

### 10.2 API Integration Tests
- [ ] Task CRUD Tests
- [ ] User Management Tests
- [ ] File Management Tests
- [ ] Auth Flow Tests
- [ ] Permission Tests

---

## Phase 11: State Management Optimierung

### 11.1 React Query / TanStack Query Integration
- [ ] TanStack Query installieren
  ```bash
  npm install @tanstack/react-query
  ```
- [ ] Query Provider einrichten
- [ ] Query Hooks erstellen:
  - [ ] `use-tasks-query.ts`
  - [ ] `use-task-query.ts`
  - [ ] `use-users-query.ts`
  - [ ] `use-notifications-query.ts`
- [ ] Mutation Hooks erstellen:
  - [ ] `use-create-task.ts`
  - [ ] `use-update-task.ts`
  - [ ] `use-delete-task.ts`
- [ ] Optimistic Updates implementieren
- [ ] Cache Invalidation strategisch planen

### 11.2 State Management Audit
- [ ] Lokalen State identifizieren
- [ ] Server State mit React Query
- [ ] Form State mit React Hook Form
- [ ] UI State mit Zustand (falls nötig)
- [ ] Unnötige Re-renders eliminieren

---

## Phase 12: Performance Optimierung

### 12.1 Code Splitting
- [ ] Dynamic Imports für große Komponenten
- [ ] Route-based Code Splitting prüfen
- [ ] Bundle Analyzer installieren und analysieren

### 12.2 Memoization
- [ ] `useMemo` für teure Berechnungen
- [ ] `useCallback` für Event Handler
- [ ] `React.memo` für Pure Components
- [ ] Performance Profiling mit React DevTools

### 12.3 Data Fetching
- [ ] Loading States verbessern
- [ ] Skeleton Screens
- [ ] Pagination optimieren
- [ ] Infinite Scroll für lange Listen

---

## Phase 13: Documentation & Clean-up

### 13.1 Code Documentation
- [ ] JSDoc Comments für alle Public APIs
- [ ] README pro Feature-Ordner
- [ ] Architektur-Diagramme
- [ ] Komponentenbibliothek (Storybook optional)

### 13.2 Type Safety
- [ ] `strict: true` in tsconfig.json
- [ ] `any` Types eliminieren
- [ ] Type Coverage prüfen

### 13.3 Dead Code Elimination
- [ ] Ungenutzte Imports entfernen
- [ ] Ungenutzte Komponenten löschen
- [ ] Ungenutzte Utilities entfernen
- [ ] `eslint-plugin-unused-imports` verwenden

---

## Phase 14: CI/CD & Quality Gates

### 14.1 GitHub Actions / GitLab CI
- [ ] Lint auf jedem Push
- [ ] Tests auf jedem Pull Request
- [ ] Build Check
- [ ] Type Check
- [ ] Test Coverage Report

### 14.2 Quality Gates
- [ ] Minimum Test Coverage: 80%
- [ ] Max File Size: 75 Zeilen
- [ ] No `any` Types
- [ ] No ESLint Errors
- [ ] Build muss erfolgreich sein

---

## Priorisierung & Reihenfolge

### Kritischer Pfad (Zuerst)
1. **Phase 1** - Testing Setup (Foundation)
2. **Phase 2** - Types (Enables better refactoring)
3. **Phase 3** - Services (Business Logic raus)
4. **Phase 5.2** - Task Detail Page (Meist benutzt)
5. **Phase 5.1** - Sidebar (Überall sichtbar)

### Mittlere Priorität
6. **Phase 4** - Hooks
7. **Phase 6** - API Routes
8. **Phase 7** - Database Layer
9. **Phase 5.3-5.6** - Weitere große Pages

### Niedrige Priorität (Later)
10. **Phase 8** - Kleinere Components
11. **Phase 9** - Auth Refactoring
12. **Phase 10** - E2E Tests
13. **Phase 11** - React Query Migration
14. **Phase 12** - Performance
15. **Phase 13** - Documentation
16. **Phase 14** - CI/CD

---

## Success Metrics

### Quantitative Metriken
- ✅ 0 Dateien > 75 Zeilen
- ✅ >80% Test Coverage
- ✅ 0 ESLint Errors
- ✅ 0 TypeScript `any` Types
- ✅ Build Time < 30 Sekunden
- ✅ Lighthouse Score > 90

### Qualitative Metriken
- ✅ Klare Separation of Concerns
- ✅ Single Responsibility per File
- ✅ Wiederverwendbare Components
- ✅ Wartbarer Code
- ✅ Verständliche Architektur

---

## Notizen & Best Practices

### Während des Refactorings
- **Immer kleine Commits**: Ein Feature/Component pro Commit
- **Tests zuerst**: Test vor Refactoring schreiben (wenn möglich)
- **Nicht alles auf einmal**: Phase für Phase abarbeiten
- **Reviews**: Code Reviews nach jeder Phase
- **Documentation**: README updates zeitgleich mit Code

### Anti-Patterns vermeiden
- ❌ Keine Gott-Komponenten (>75 Zeilen)
- ❌ Keine Business Logic in Components
- ❌ Keine Props Drilling (Context/Query verwenden)
- ❌ Keine Magic Numbers (Constants verwenden)
- ❌ Keine ungetesteten Komponenten

### Clean Code Prinzipien
- ✅ **KISS** - Keep It Simple, Stupid
- ✅ **DRY** - Don't Repeat Yourself
- ✅ **YAGNI** - You Aren't Gonna Need It
- ✅ **SOLID** - Single Responsibility, Open/Closed, etc.
- ✅ **Composition over Inheritance**

---

## Start Here

**Nächster Schritt**: Phase 1.1 - Testing Framework einrichten

```bash
# Start mit Testing Setup
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom @vitest/ui
```

Danach: Type Definitions extrahieren (Phase 2.1)

---

*Letztes Update: 2026-02-04*
