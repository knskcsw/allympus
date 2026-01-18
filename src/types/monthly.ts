/**
 * Type definitions for the Monthly Calendar page
 */

import type { Attendance, Holiday } from "@/generated/prisma/client";

// Computed statistics for monthly summary
export interface MonthlySummary {
  workedDays: number;
  totalMinutes: number;
  standardHours: number | null;
  expectedHours: number | null;
  actualHours: number;
  overtimeHours: number | null;
  forecastActualHours: number | null;
  forecastOvertimeHours: number | null;
  vacationHours: number;
}

// Data loading state
export interface MonthlyDataState {
  attendances: Attendance[];
  holidays: Holiday[];
  workingDays: number | null;
  vacationHours: number;
}

// Loading flags
export interface MonthlyLoadingState {
  isAttendanceLoading: boolean;
  isHolidayLoading: boolean;
  isSummaryLoading: boolean;
}

// Aggregated loading state check
export interface MonthlyDataReturn extends MonthlyDataState, MonthlyLoadingState {
  fetchAttendances: () => Promise<void>;
  isCalendarLoading: boolean;
}

// Monthly vacation data from API
export interface MonthlyVacation {
  month: number;
  hours: number;
}

// Working days API response
export interface WorkingDaysResponse {
  workingDays: Record<number, number>;
}

/**
 * Calculate fiscal year string from calendar year and month
 * Japanese fiscal year runs from April to March
 */
export function getFiscalYear(targetYear: number, targetMonth: number): string {
  const fiscalYear = targetMonth >= 4 ? targetYear : targetYear - 1;
  const suffix = String(fiscalYear % 100).padStart(2, "0");
  return `FY${suffix}`;
}

/**
 * Calculate monthly summary statistics from attendance data
 */
export function calculateMonthlySummary(
  attendances: Attendance[],
  workingDays: number | null,
  vacationHours: number
): MonthlySummary {
  const workedDays = attendances.filter((a) => a.clockIn && a.clockOut).length;

  const totalMinutes = attendances.reduce((acc, a) => {
    if (a.clockIn && a.clockOut) {
      const diff = new Date(a.clockOut).getTime() - new Date(a.clockIn).getTime();
      return acc + Math.floor(diff / 60000) - a.breakMinutes;
    }
    return acc;
  }, 0);

  const standardHours = workingDays === null ? null : workingDays * 7.5;
  const expectedHours = standardHours === null ? null : standardHours - vacationHours;
  const actualHours = totalMinutes / 60;
  const overtimeHours = expectedHours === null ? null : actualHours - expectedHours;
  const forecastActualHours =
    workingDays && workedDays > 0 ? (actualHours / workedDays) * workingDays : null;
  const forecastOvertimeHours =
    expectedHours === null || forecastActualHours === null
      ? null
      : forecastActualHours - expectedHours;

  return {
    workedDays,
    totalMinutes,
    standardHours,
    expectedHours,
    actualHours,
    overtimeHours,
    forecastActualHours,
    forecastOvertimeHours,
    vacationHours,
  };
}
