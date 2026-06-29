import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const IST_TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const IST_DATE_REGEX =
  /^(\d{4}):(\d{2}):(\d{2}):(\d{2}):(\d{2}):(\d{2})$/;

export function isValidISTFormat(dateStr: string): boolean {
  const match = dateStr.match(IST_DATE_REGEX);
  if (!match) return false;

  const [, year, month, day, hour, minute, second] = match.map(Number);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;

  const date = new Date(year, month - 1, day, hour, minute, second);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function getCurrentISTDateTime(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + IST_OFFSET_MS + now.getTimezoneOffset() * 60000);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${ist.getUTCFullYear()}:${pad(ist.getUTCMonth() + 1)}:${pad(ist.getUTCDate())}:${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())}`;
}

export function formatISTDate(date: Date | string): string {
  if (typeof date === "string") {
    if (isValidISTFormat(date)) return date;
    date = new Date(date);
  }

  const ist = new Date(date.getTime() + IST_OFFSET_MS + date.getTimezoneOffset() * 60000);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${ist.getUTCFullYear()}:${pad(ist.getUTCMonth() + 1)}:${pad(ist.getUTCDate())}:${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())}`;
}

export function parseISTDate(dateStr: string): Date {
  if (!isValidISTFormat(dateStr)) {
    throw new Error(`Invalid IST date format. Expected YYYY:MM:DD:HH:MM:SS, got: ${dateStr}`);
  }

  const [, year, month, day, hour, minute, second] = dateStr.match(IST_DATE_REGEX)!.map(Number);
  const utcMs = Date.UTC(year, month - 1, day, hour, minute, second) - IST_OFFSET_MS;
  return new Date(utcMs);
}

export function compareISTDates(a: string, b: string): number {
  return parseISTDate(a).getTime() - parseISTDate(b).getTime();
}

export function isTaskOverdue(dueDate: string, status: string): boolean {
  if (status === "COMPLETED" || status === "CANCELLED") return false;
  return compareISTDates(getCurrentISTDateTime(), dueDate) > 0;
}

export function getDaysBetweenIST(a: string, b: string): number {
  const diffMs = Math.abs(parseISTDate(a).getTime() - parseISTDate(b).getTime());
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export function getTaskTimelineMetric(
  dueDate: string,
  status: string,
  completionDate?: string | null
): { label: string; variant: "success" | "danger" | "warning" | "secondary" } {
  if (status === "COMPLETED" && completionDate) {
    if (compareISTDates(completionDate, dueDate) <= 0) {
      const daysEarly = getDaysBetweenIST(completionDate, dueDate);
      return {
        label: daysEarly === 0 ? "Completed on time" : `Completed ${daysEarly} day(s) early`,
        variant: "success",
      };
    }
    const daysLate = getDaysBetweenIST(completionDate, dueDate);
    return { label: `Completed ${daysLate} day(s) late`, variant: "danger" };
  }

  if (status !== "COMPLETED" && status !== "CANCELLED") {
    const now = getCurrentISTDateTime();
    if (compareISTDates(now, dueDate) > 0) {
      const daysOverdue = getDaysBetweenIST(now, dueDate);
      return { label: `${daysOverdue} day(s) overdue`, variant: "danger" };
    }
    return { label: "Within timeline", variant: "secondary" };
  }

  return { label: "—", variant: "secondary" };
}

export function generateTaskId(): string {
  const now = getCurrentISTDateTime().replace(/:/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TSK-${now.slice(0, 8)}-${random}`;
}

export function getRoleDashboardPath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "MANAGER":
      return "/dashboard/manager";
    case "SALESMAN":
      return "/dashboard/salesman";
    default:
      return "/login";
  }
}

export const IST_TIMEZONE_LABEL = IST_TIMEZONE;
