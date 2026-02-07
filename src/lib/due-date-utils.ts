import { addDays, endOfMonth, parse, format } from "date-fns";

/**
 * Calculate the default due date for a booking task.
 * Rule: 45 days after the end of the booking period month.
 * @param period - The booking period in "YYYY-MM" format
 * @returns ISO date string (YYYY-MM-DD)
 */
export function calculateDefaultDueDate(period: string): string {
  const periodDate = parse(period, "yyyy-MM", new Date());
  const monthEnd = endOfMonth(periodDate);
  const dueDate = addDays(monthEnd, 45);
  return format(dueDate, "yyyy-MM-dd");
}

/**
 * Check if a task is overdue based on its due date.
 * @param dueDate - The due date as a string (YYYY-MM-DD)
 * @returns true if the current date is past the due date
 */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const now = new Date();
  const due = new Date(dueDate);
  return now > due;
}

/**
 * Get the number of days until (or past) the due date.
 * Positive = days remaining, negative = days overdue.
 * @param dueDate - The due date as a string (YYYY-MM-DD)
 * @returns Number of days (negative if overdue)
 */
export function daysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
