export const CHART_COLORS = {
  pv: "#3b82f6",
  ac: "#ef4444",
  acpv: "#f59e0b",
} as const;

export const HOLIDAY_TYPE_COLORS: Record<string, string> = {
  PUBLIC_HOLIDAY:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-700",
  SPECIAL_HOLIDAY:
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-700",
  PAID_LEAVE:
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-700",
} as const;

export const WEEKDAY_LABELS = ["月", "火", "水", "木", "金"] as const;
