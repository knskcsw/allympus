import type { Holiday } from "@/generated/prisma/client";

// 休日種別の型定義
export type HolidayType = "PUBLIC_HOLIDAY" | "WEEKEND" | "SPECIAL_HOLIDAY" | "PAID_LEAVE";

// 年間休日としてカウントする種別
export const ANNUAL_HOLIDAY_TYPES: HolidayType[] = ["WEEKEND", "PUBLIC_HOLIDAY", "SPECIAL_HOLIDAY"];

// 会計年度の定義
export const FISCAL_YEARS = ["FY25", "FY26", "FY27"] as const;
export type FiscalYear = (typeof FISCAL_YEARS)[number];

// 休日種別のラベル
export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  PUBLIC_HOLIDAY: "祝日",
  WEEKEND: "定休日",
  SPECIAL_HOLIDAY: "特別休日",
  PAID_LEAVE: "有給休暇",
};

// 休日種別の色（バッジ用）
export const HOLIDAY_TYPE_BADGE_COLORS: Record<HolidayType, string> = {
  PUBLIC_HOLIDAY: "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700",
  WEEKEND: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
  SPECIAL_HOLIDAY: "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700",
  PAID_LEAVE: "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700",
};

// 休日種別の色（カレンダー用）
export const HOLIDAY_TYPE_CALENDAR_COLORS: Record<HolidayType, string> = {
  PUBLIC_HOLIDAY: "bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700",
  WEEKEND: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600",
  SPECIAL_HOLIDAY: "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700",
  PAID_LEAVE: "bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700",
};

// 休日追加時のデータ型
export interface AddHolidayData {
  date: Date;
  name: string;
  type: HolidayType;
}

// 統計情報の型
export interface HolidayStats {
  weekendCount: number;
  publicHolidayCount: number;
  specialHolidayCount: number;
  paidLeaveCount: number;
  annualHolidayCount: number;
}

// 休日の統計情報を計算する
export function calculateHolidayStats(holidays: Holiday[]): HolidayStats {
  const weekendCount = holidays.filter((h) => h.type === "WEEKEND").length;
  const publicHolidayCount = holidays.filter((h) => h.type === "PUBLIC_HOLIDAY").length;
  const specialHolidayCount = holidays.filter((h) => h.type === "SPECIAL_HOLIDAY").length;
  const paidLeaveCount = holidays.filter((h) => h.type === "PAID_LEAVE").length;
  const annualHolidayCount = weekendCount + publicHolidayCount + specialHolidayCount;

  return {
    weekendCount,
    publicHolidayCount,
    specialHolidayCount,
    paidLeaveCount,
    annualHolidayCount,
  };
}
