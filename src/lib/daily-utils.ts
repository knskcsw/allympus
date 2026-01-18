/**
 * Utility functions for the Daily page
 */

import type { Project, TimeEntry, Attendance } from "@/types/daily";

/**
 * Check if a project represents a break (休憩/break)
 */
export function isBreakProject(
  project: Pick<Project, "code" | "name" | "abbreviation"> | null | undefined
): boolean {
  if (!project) return false;

  const labels = [project.code, project.name, project.abbreviation]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  return labels.some((value) => value === "休憩" || value === "break");
}

/**
 * Calculate total break minutes from time entries
 */
export function calculateBreakMinutesFromEntries(
  timeEntries: TimeEntry[]
): number {
  return timeEntries.reduce((acc, entry) => {
    if (!isBreakProject(entry.project)) return acc;
    return acc + (entry.duration || 0);
  }, 0) / 60;
}

/**
 * Calculate total working hours based on attendance and break time
 */
export function calculateTotalWorkingHours(
  attendance: Attendance | null,
  additionalBreakMinutes: number
): number | null {
  if (!attendance?.clockIn) return null;

  const start = new Date(attendance.clockIn);
  const end = attendance.clockOut
    ? new Date(attendance.clockOut)
    : new Date();

  const breakMinutes =
    (attendance.breakMinutes || 0) + Math.round(additionalBreakMinutes);
  const totalMinutes =
    (end.getTime() - start.getTime()) / (1000 * 60) - breakMinutes;

  return totalMinutes / 60;
}

/**
 * Parse time string (HH:mm) to decimal hours
 */
export function parseTimeToDecimalHours(timeString: string): number | null {
  const [hours, minutes] = timeString.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours + minutes / 60;
}

/**
 * Generic API fetch helper with error handling
 */
export async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  const response = await fetch(url, options);
  const responseText = await response.text();

  if (!response.ok) {
    let message = responseText;
    try {
      message = JSON.parse(responseText).error || responseText;
    } catch {
      // Fallback to raw text when not JSON
    }
    throw new Error(message || "API request failed");
  }

  return responseText ? JSON.parse(responseText) : null;
}
