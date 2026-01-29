import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getTodayDate(): string {
  return formatDate(new Date());
}

/**
 * Returns YYYY-MM-DD for "today" in the given IANA timezone (e.g. "America/New_York").
 * If timezone is missing or invalid, falls back to UTC (getTodayDate()).
 */
export function getTodayDateForTimezone(timezone?: string | null): string {
  if (!timezone || typeof timezone !== "string" || !timezone.trim()) {
    return getTodayDate();
  }
  try {
    const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: timezone.trim() });
    return dateStr;
  } catch {
    return getTodayDate();
  }
}

/**
 * Client-only: returns the user's IANA timezone (e.g. "America/New_York") for the X-Timezone header.
 * Safe to call on server (returns empty string); use when building fetch headers from the browser.
 */
export function getClientTimezone(): string {
  if (typeof Intl === "undefined" || !Intl.DateTimeFormat) return "";
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "";
  }
}

/**
 * Reads timezone from request headers (X-Timezone or Accept-Timezone). Returns null if missing.
 */
export function getTimezoneFromRequest(request: Request): string | null {
  const tz = request.headers.get("X-Timezone") ?? request.headers.get("Accept-Timezone");
  if (!tz || typeof tz !== "string" || !tz.trim()) return null;
  return tz.trim();
}

export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getStartOfQuarter(date: Date = new Date()): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
}

export function getStartOfYear(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1);
}
