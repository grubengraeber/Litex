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

// Task status from schema
export const TASK_STATUS_LABELS = {
  open: "Offen",
  submitted: "Eingereicht",
  completed: "Erledigt",
} as const;

// Traffic light system (Ampel)
// 🟡 Gelb: Nicht bearbeitet (Standard)
// 🟢 Grün: Bearbeitet (Kommentar oder Beleg vorhanden)
// 🔴 Rot: Überfällig (75-Tage-Frist überschritten)
export const TRAFFIC_LIGHT_CONFIG = {
  yellow: {
    label: "Nicht bearbeitet",
    color: "bg-yellow-500",
    bgLight: "bg-yellow-100",
    text: "text-yellow-800",
    description: "Noch keine Aktion durchgeführt",
  },
  green: {
    label: "Bearbeitet",
    color: "bg-green-500",
    bgLight: "bg-green-100",
    text: "text-green-800",
    description: "Kommentar oder Beleg vorhanden",
  },
  red: {
    label: "Überfällig",
    color: "bg-red-500",
    bgLight: "bg-red-100",
    text: "text-red-800",
    description: "75-Tage-Frist überschritten",
  },
} as const;

export type TrafficLight = keyof typeof TRAFFIC_LIGHT_CONFIG;

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
    canApproveFiles: false,     // Kann keine Belege freigeben
  },
  employee: {
    canSeeAllTasks: true,       // Alle Aufgaben
    canSeeAllCompanies: true,   // Alle Mandanten
    canSeeTeam: true,           // Team-Zugriff
    canApproveFiles: true,      // Kann Belege freigeben
  },
} as const;

// File upload status
export const FILE_STATUS = {
  pending: {
    label: "Hochgeladen",
    description: "Wartet auf Freigabe",
    color: "bg-yellow-100 text-yellow-800",
  },
  approved: {
    label: "Freigegeben",
    description: "Von Mitarbeiter bestätigt",
    color: "bg-green-100 text-green-800",
  },
  rejected: {
    label: "Abgelehnt",
    description: "Bitte erneut hochladen",
    color: "bg-red-100 text-red-800",
  },
} as const;

export type FileStatus = keyof typeof FILE_STATUS;

// Filter options
export const FILTER_OPTIONS = [
  { key: "all", label: "Alle", icon: "Filter" },
  { key: "this-week", label: "Diese Woche", icon: "Calendar" },
  { key: "yellow", label: "Nicht bearbeitet", icon: "Circle" },
  { key: "green", label: "Bearbeitet", icon: "CheckCircle" },
  { key: "red", label: "Überfällig", icon: "AlertCircle" },
  { key: "completed", label: "Erledigt", icon: "CheckCircle2" },
] as const;

// 75-day deadline for overdue calculation
export const OVERDUE_DAYS = 75;
