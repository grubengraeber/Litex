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

// Task status labels in German
export const TASK_STATUS_LABELS = {
  open: "Offen",
  submitted: "Eingereicht",
  completed: "Erledigt",
} as const;

// Traffic light labels in German
export const TRAFFIC_LIGHT_LABELS = {
  green: "Im Plan",
  yellow: "Prüfung nötig",
  red: "Überfällig",
} as const;

// User roles
export type UserRole = "customer" | "employee";

export const ROLE_LABELS = {
  customer: "Kunde",
  employee: "Mitarbeiter",
} as const;

// Filter options
export const FILTER_OPTIONS = [
  { key: "all", label: "Alle", icon: "Filter" },
  { key: "this-week", label: "Diese Woche", icon: "Calendar" },
  { key: "priorities", label: "Prioritäten", icon: "Star" },
  { key: "completed", label: "Erledigt", icon: "CheckCircle" },
  { key: "archived", label: "Archiviert", icon: "Archive" },
] as const;
