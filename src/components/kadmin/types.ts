// Kadmin related type definitions

export interface Project {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface MonthlyWorkHours {
  estimatedHours: number;
  actualHours: number;
  overtimeHours: number;
  workingDays: number;
}

export interface WorkHoursData {
  [projectId: string]: {
    [month: number]: MonthlyWorkHours;
  };
}

export interface VacationData {
  [month: number]: { hours: number };
}

export interface WorkingDaysData {
  [month: number]: number;
}

export type WorkHoursField = "estimatedHours" | "actualHours" | "overtimeHours" | "workingDays";
export type EditableField = "estimatedHours" | "actualHours";

// Constants
export const FISCAL_YEAR = "FY25";
export const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3] as const;
export const MONTH_NAMES = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"] as const;

export const DEFAULT_WORKING_DAYS: Readonly<Record<number, number>> = {
  4: 21, 5: 21, 6: 22, 7: 23, 8: 22, 9: 21, 10: 23, 11: 21, 12: 22,
  1: 20, 2: 20, 3: 21
};

// Utility functions
export const parseNumber = (value: string | null): number => {
  if (!value) return 0;
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const isLikelyNumber = (value: string): boolean => {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return false;
  return /^-?\d+(\.\d+)?$/.test(normalized);
};

export const roundToTenth = (value: number): number => Math.round(value * 10) / 10;

export const calculateStandardHours = (workingDays: number): number => workingDays * 7.5;

export const getGroupKey = (project: Project): "active" | "inactive" =>
  project.isActive ? "active" : "inactive";

// Default monthly work hours factory
export const createDefaultMonthlyWorkHours = (month: number): MonthlyWorkHours => ({
  estimatedHours: 0,
  actualHours: 0,
  overtimeHours: 0,
  workingDays: DEFAULT_WORKING_DAYS[month] || 20,
});
