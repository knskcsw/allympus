import type { Attendance } from "@/generated/prisma/client";

export const TARGET_SLEEP_HOURS = 8;

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface DailySleepData {
  date: Date;
  hours: number | null;
}

export interface SleepStatistics {
  dailyData: DailySleepData[];
  recordedCount: number;
  missingCount: number;
  totalHours: number;
  averageHours: number;
  maxHours: number;
  minHours: number;
  hitRate: number;
  recentAverage: number;
  weekdayAverages: number[];
}

export interface UseSleepDataReturn {
  attendances: Attendance[];
  isLoading: boolean;
  statistics: SleepStatistics;
}

export function formatHours(value: number): string {
  return `${value.toFixed(1)}h`;
}
