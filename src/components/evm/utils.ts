import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
} from "date-fns";
import type { Holiday } from "./types";

/**
 * Format hours value for display
 */
export function formatHours(value: number): string {
  return `${value.toFixed(1)}h`;
}

/**
 * Get fiscal year string (e.g., "FY24")
 */
export function getFiscalYear(year: number, month: number): string {
  const fiscalYear = month >= 4 ? year : year - 1;
  const suffix = String(fiscalYear % 100).padStart(2, "0");
  return `FY${suffix}`;
}

/**
 * Calculate cumulative values from daily values
 */
export function calculateCumulative(values: number[]): number[] {
  let sum = 0;
  return values.map((value) => {
    sum += value;
    return sum;
  });
}

/**
 * Get all weekdays (Monday to Friday) in a month
 */
export function getWeekdaysInMonth(currentDate: Date): Date[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  return eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(
    (day) => {
      const dayOfWeek = day.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    }
  );
}

/**
 * Get dates for a specific weekday in a month (excluding holidays)
 */
export function getWeekdayDates(
  currentDate: Date,
  weekday: number,
  holidays: Holiday[]
): string[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  return eachDayOfInterval({ start: monthStart, end: monthEnd })
    .filter((day) => day.getDay() === weekday)
    .filter((day) => !getHolidayForDay(day, holidays))
    .map((day) => format(day, "yyyy-MM-dd"));
}

/**
 * Get all working days (excluding weekends and holidays)
 */
export function getWorkingDays(
  currentDate: Date,
  holidays: Holiday[]
): string[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  return eachDayOfInterval({ start: monthStart, end: monthEnd })
    .filter((day) => day.getDay() >= 1 && day.getDay() <= 5)
    .filter((day) => !getHolidayForDay(day, holidays))
    .map((day) => format(day, "yyyy-MM-dd"));
}

/**
 * Find holiday for a specific day
 */
export function getHolidayForDay(
  day: Date,
  holidays: Holiday[]
): Holiday | undefined {
  return holidays.find((holiday) => isSameDay(new Date(holiday.date), day));
}

/**
 * Group tasks by day
 */
export function groupTasksByDay<T extends { date: string }>(
  tasks: T[],
  days: string[]
): Record<string, T[]> {
  const tasksByDay: Record<string, T[]> = {};
  for (const day of days) {
    tasksByDay[day] = [];
  }
  for (const task of tasks) {
    const taskDay = format(new Date(task.date), "yyyy-MM-dd");
    if (tasksByDay[taskDay]) {
      tasksByDay[taskDay].push(task);
    }
  }
  return tasksByDay;
}

/**
 * Calculate calendar padding for first weekday
 */
export function getCalendarPadding(weekdays: Date[]): number {
  const firstWeekday = weekdays[0];
  return firstWeekday && firstWeekday.getDay() > 0
    ? firstWeekday.getDay() - 1
    : 0;
}
