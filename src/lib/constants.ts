// German month names
export const MONTHS = [
  { short: "JAN", full: "Januar", key: "01" },
  { short: "FEB", full: "Februar", key: "02" },
  { short: "MÄR", full: "März", key: "03" },
  { short: "APR", full: "April", key: "04" },
  { short: "MAI", full: "Mai", key: "05" },
  { short: "JUN", full: "Juni", key: "06" },
  { short: "JUL", full: "Juli", key: "07" },
  { short: "AUG", full: "August", key: "08" },
  { short: "SEP", full: "September", key: "09" },
  { short: "OKT", full: "Oktober", key: "10" },
  { short: "NOV", full: "November", key: "11" },
  { short: "DEZ", full: "Dezember", key: "12" },
] as const;

// Task status workflow: Offen → Eingereicht → Erledigt
export const TASK_STATUS = {
  open: {
    label: "Offen",
    color: "bg-slate-100 text-slate-700",
    description: "Wartet auf Bearbeitung durch Kunden",
  },
  submitted: {
    label: "Eingereicht",
    color: "bg-primary/10 text-primary",
    description: "Vom Kunden eingereicht, wartet auf Prüfung",
  },
  completed: {
    label: "Erledigt",
    color: "bg-green-100 text-green-700",
    description: "Abgeschlossen durch Mitarbeiter",
  },
} as const;

export type TaskStatus = keyof typeof TASK_STATUS;

// Traffic light system (Ampel) - basiert auf Bearbeitungsstatus und Fälligkeit
// 🟡 Gelb: Nicht bearbeitet (Standardstatus)
// 🟢 Grün: Vom Kunden bearbeitet
// 🔴 Rot: Überfällig (dueDate überschritten)
export const TRAFFIC_LIGHT_CONFIG = {
  yellow: {
    label: "Nicht bearbeitet",
    color: "bg-yellow-500",
    bgLight: "bg-yellow-100",
    text: "text-yellow-800",
    description: "Noch nicht vom Kunden bearbeitet",
  },
  green: {
    label: "Bearbeitet",
    color: "bg-green-500",
    bgLight: "bg-green-100",
    text: "text-green-800",
    description: "Vom Kunden bearbeitet",
  },
  red: {
    label: "Überfällig",
    color: "bg-red-500",
    bgLight: "bg-red-100",
    text: "text-red-800",
    description: "Fälligkeitsdatum überschritten",
  },
} as const;

export type TrafficLight = keyof typeof TRAFFIC_LIGHT_CONFIG;

// Calculate traffic light based on task status and due date
export function calculateTrafficLight(
  status: "open" | "submitted" | "completed",
  dueDate: string | null
): TrafficLight {
  if (status === "completed") return "green";
  if (status === "submitted") return "green";
  if (dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    if (now > due) return "red";
  }
  return "yellow";
}

// Traffic light sort priority (red first = highest priority)
export const TRAFFIC_LIGHT_PRIORITY: Record<TrafficLight, number> = {
  red: 0,    // Höchste Priorität
  yellow: 1,
  green: 2,  // Niedrigste Priorität
};

// Task types
export const TASK_TYPES = {
  general: {
    label: "Allgemeine Aufgabe",
    description: "Manuell erstellte Aufgabe",
  },
  booking: {
    label: "Ungeklärte Buchung",
    description: "Importierte Buchung aus BMD",
  },
} as const;

export type TaskType = keyof typeof TASK_TYPES;

// User roles
export type UserRole = "customer" | "employee";

export const ROLE_LABELS = {
  customer: "Kunde",
  employee: "Mitarbeiter",
} as const;

// Role permissions
export const ROLE_PERMISSIONS = {
  customer: {
    canSeeAllTasks: false,      // Nur eigene Aufgaben
    canSeeAllCompanies: false,  // Nur eigene Firma
    canSeeTeam: false,          // Kein Team-Zugriff
    canSubmitTask: true,        // Kann "Einreichen"
    canCompleteTask: false,     // Kann nicht "Abschließen"
    canReturnTask: false,       // Kann nicht "Zurück an Kunde"
    canInviteUsers: false,      // Kann keine Benutzer einladen
    canUploadFiles: true,       // Kann Belege hochladen
    canComment: true,           // Kann kommentieren
    canViewAuditLogs: false,    // Kann Audit Logs nicht sehen
  },
  employee: {
    canSeeAllTasks: true,       // Alle Aufgaben
    canSeeAllCompanies: true,   // Alle Mandanten
    canSeeTeam: true,           // Team-Zugriff
    canSubmitTask: false,       // Nicht "Einreichen"
    canCompleteTask: true,      // Kann "Abschließen"
    canReturnTask: true,        // Kann "Zurück an Kunde"
    canInviteUsers: true,       // Kann Benutzer einladen
    canUploadFiles: true,       // Kann Belege hochladen
    canComment: true,           // Kann kommentieren
    canViewAuditLogs: true,     // Kann Audit Logs sehen
  },
} as const;

// File upload config
export const FILE_UPLOAD_CONFIG = {
  maxSizeMB: 10,
  acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
  acceptedExtensions: ".pdf,.jpg,.jpeg,.png",
} as const;

// Filter options for sidebar
export const FILTER_OPTIONS = [
  { key: "all", label: "Alle", icon: "Filter" },
  { key: "open", label: "Offen", icon: "Circle" },
  { key: "submitted", label: "Eingereicht", icon: "Clock" },
  { key: "completed", label: "Erledigt", icon: "CheckCircle2" },
  { key: "red", label: "Überfällig", icon: "AlertCircle", color: "text-red-500" },
  { key: "yellow", label: "Nicht bearbeitet", icon: "AlertTriangle", color: "text-yellow-500" },
] as const;
