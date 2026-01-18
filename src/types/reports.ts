import type { WorkType } from "@/lib/workTypes";

/** Daily attendance and time tracking data */
export interface DailyData {
  date: string;
  dayOfWeek: string;
  workingMinutes: number;
  trackedSeconds: number;
  hasAttendance: boolean;
}

/** Report summary statistics */
export interface ReportSummary {
  totalWorkingMinutes: number;
  totalTrackedSeconds: number;
  workedDays: number;
  totalDays: number;
}

/** Report period information */
export interface ReportPeriod {
  start: string;
  end: string;
  type: string;
}

/** Main report data structure */
export interface ReportData {
  period: ReportPeriod;
  dailyData: DailyData[];
  summary: ReportSummary;
  wbsSummary: Record<string, number>;
}

/** Work type time series data */
export interface WorkTypeSeries {
  workType: WorkType;
  label: string;
  pvDaily: number[];
  acDaily: number[];
  bacTotal: number;
}

/** Work type report data structure */
export interface WorkTypeReportData {
  period: { start: string; end: string };
  days: string[];
  types: WorkTypeSeries[];
}

/** Processed chart data for a single work type */
export interface WorkTypeChartData {
  label: string;
  pvRatio: number[];
  acRatio: number[];
  bacSeries: number[];
  forecastSeries: number[];
}

/** Processed work type charts data */
export interface WorkTypeChartsData {
  days: string[];
  types: WorkTypeChartData[];
}

/** View mode for ratio charts */
export type RatioViewMode = "daily" | "cumulative";
