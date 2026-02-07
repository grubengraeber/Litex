# Litex - Implementation TODOs

> Source: Litex.pdf (6. Februar 2026)

---

## 1. Dashboard

- [ ] "Alles Ansicht" (overview of everything) on the Dashboard
- [ ] Activity Feed on Dashboard showing newest tasks and status changes
- [ ] Notifications grouped by month displayed in the Dashboard feed

---

## 2. Tasks (Aufgaben)

### 2.1 Task Types

- [ ] **Allgemeine Aufgaben (General Tasks):** Fields: Buchungstext (booking text), Mandant (client), Faelligkeitsdatum (due date)
- [ ] **Buchungsaufgaben (Booking Tasks):** Imported via Cron Job, should NOT be editable
- [ ] General tasks SHOULD be editable

### 2.2 Task List / Navigation

- [ ] Sidebar menu item "Aufgaben" (Tasks) with sub-items:
  - Ungeklaerte Buchungen (Unresolved Bookings)
  - Allgemeine Aufgaben (General Tasks)
- [ ] Dedicated view for Cron Job Imports
- [ ] Remove "New" button from `/tasks` view (keep it only on the General Tasks list)
- [ ] Remove Grid views from all lists (list view only)

### 2.3 Month Selection Panel

- [ ] Month selection panel above each task list
- [ ] "Alle" (All) option in the task list
- [ ] Allow selecting up to 2 years back
- [ ] Only months with recorded tasks should be selectable
- [ ] Completed tasks should be filtered out by default

### 2.4 Traffic Light System (Ampelsystem)

| Color  | Meaning                                         |
|--------|-------------------------------------------------|
| Yellow | Task has not been processed yet                 |
| Green  | Client/customer has processed the task          |
| Red    | Task is overdue                                 |

- [ ] Status and traffic light are identical (adjust columns, data, and filters accordingly)

### 2.5 Task Detail View

- [ ] Detail panel opens on the right side when clicking a task in the list
- [ ] Keep `/tasks/[id]` routing
- [ ] Remove "Task completed" banner
- [ ] Show Buchungsdaten (booking data), Frist (deadline), and Chat window directly accessible
- [ ] All task details in a single column without section headers

### 2.6 Default Due Dates

- [ ] Default due date for booking tasks: latest 45 days after end of month (when no UVA reconciliation is possible)
- [ ] Example: UVA sent on the 14th, SQL import on the 15th -> overdue in 30 days

---

## 3. Notifications (Benachrichtigungen)

- [ ] Notification badges with count
- [ ] Notifications grouped by month
- [ ] Show in Dashboard feed as well

---

## 4. Client/Company Selection (Mandantenauswahl)

- [ ] Company selector in the top-left corner for selecting Mandanten (clients)

---

## 5. Roles & Permissions

- [ ] Remove role logic for customers (but every user must have at least one role)
- [ ] Chats and Files routes restricted to employees only

### 5.1 SQL Query - Current

- [ ] Retrieve employee data

### 5.2 SQL Query - Future

- [ ] Determine employee responsibilities (which employee can see which clients)

---

## 6. Cron Job / SQL Import

- [ ] Booking data remains unchanged on re-import
- [ ] LfNr. (sequential number) is unique
- [ ] New imports should overwrite all old bookings with new booking data
- [ ] Design database concept for sync jobs

---

## 7. Integrations

### 7.1 BMD

- [ ] Add BMD button/link in the UI
- [ ] Implement BMD SQL Service
- [ ] Contact for support: ms@mesh-web.com

### 7.2 Finmatics

- [ ] Add Finmatics button/link in the UI
- [ ] Implement Finmatics REST API integration
- [ ] Contacts: bettina.nikolic@finmatics.com, elizabeth.stevic@finmatics.com

### 7.3 Email

- [ ] Set up email integration

---

## 8. UI / Design

- [ ] Implement Dark Mode
- [ ] Apply complete Corporate Identity (CI)
- [ ] Implement all UI change requests from designer review

---

## 9. Bug Fixes

- [ ] Fix File Upload (must work error-free)

---

## 10. Infrastructure / DevOps

- [ ] Deploy platform publicly with test data (for Kevin's review)
- [ ] Kevin's designer reviews the deployed app
- [ ] Get server access from Kevin (SSH or similar)
- [ ] Design and implement DB Backup concept
- [ ] Set up CI pipeline completely

---

## Next Steps (Action Items)

| Owner | Action |
|-------|--------|
| Kevin | Set up email |
| Fabio | Review BMD |
| Fabio | Review Finmatics |
| Fabio | Deploy app online for review |
| Kevin | Have designer review the app |
| Fabio | Get server access from Kevin |
