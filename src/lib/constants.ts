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
    color: "bg-blue-100 text-blue-700",
    description: "Vom Kunden eingereicht, wartet auf Prüfung",
  },
  completed: {
    label: "Erledigt",
    color: "bg-green-100 text-green-700",
    description: "Abgeschlossen durch Mitarbeiter",
  },
} as const;

export type TaskStatus = keyof typeof TASK_STATUS;

// Traffic light system (Ampel) - basiert auf ALTER in Tagen
// 🟢 Grün: Neu (0-30 Tage)
// 🟡 Gelb: >30 Tage
// 🔴 Rot: >60 Tage
export const TRAFFIC_LIGHT_CONFIG = {
  green: {
    label: "Neu",
    color: "bg-green-500",
    bgLight: "bg-green-100",
    text: "text-green-800",
    description: "Weniger als 30 Tage alt",
    maxDays: 30,
  },
  yellow: {
    label: "Warnung",
    color: "bg-yellow-500",
    bgLight: "bg-yellow-100",
    text: "text-yellow-800",
    description: "Älter als 30 Tage",
    maxDays: 60,
  },
  red: {
    label: "Dringend",
    color: "bg-red-500",
    bgLight: "bg-red-100",
    text: "text-red-800",
    description: "Älter als 60 Tage",
    maxDays: Infinity,
  },
} as const;

export type TrafficLight = keyof typeof TRAFFIC_LIGHT_CONFIG;

// Calculate traffic light based on days since creation
export function calculateTrafficLight(daysSinceCreation: number): TrafficLight {
  if (daysSinceCreation <= 30) return "green";
  if (daysSinceCreation <= 60) return "yellow";
  return "red";
}

// Traffic light sort priority (red first = highest priority)
export const TRAFFIC_LIGHT_PRIORITY: Record<TrafficLight, number> = {
  red: 0,    // Höchste Priorität
  yellow: 1,
  green: 2,  // Niedrigste Priorität
};

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
  { key: "red", label: "Dringend (>60 Tage)", icon: "AlertCircle", color: "text-red-500" },
  { key: "yellow", label: "Warnung (>30 Tage)", icon: "AlertTriangle", color: "text-yellow-500" },
] as const;
