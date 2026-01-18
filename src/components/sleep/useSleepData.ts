"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import type { Attendance } from "@/generated/prisma/client";
import {
  TARGET_SLEEP_HOURS,
  type DailySleepData,
  type SleepStatistics,
  type UseSleepDataReturn,
} from "./types";

function calculateStatistics(
  attendances: Attendance[],
  currentDate: Date
): SleepStatistics {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  // Build a map of sleep hours by date
  const sleepByDate = new Map<string, number>();
  for (const attendance of attendances) {
    if (attendance.sleepHours == null) {
      continue;
    }
    const key = format(new Date(attendance.date), "yyyy-MM-dd");
    sleepByDate.set(key, attendance.sleepHours);
  }

  // Create daily data array
  const dailyData: DailySleepData[] = daysInMonth.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    return {
      date: day,
      hours: sleepByDate.get(key) ?? null,
    };
  });

  // Extract recorded values
  const values = dailyData
    .map((item) => item.hours)
    .filter((value): value is number => value !== null);

  // Calculate basic statistics
  const totalHours = values.reduce((acc, value) => acc + value, 0);
  const averageHours = values.length > 0 ? totalHours / values.length : 0;
  const maxHours = values.length > 0 ? Math.max(...values) : 0;
  const minHours = values.length > 0 ? Math.min(...values) : 0;

  // Calculate hit rate (days meeting target)
  const hitDays = values.filter((value) => value >= TARGET_SLEEP_HOURS).length;
  const hitRate = values.length > 0 ? (hitDays / values.length) * 100 : 0;

  // Calculate recent average (last 7 recorded days)
  const recentValues = values.slice(-7);
  const recentAverage =
    recentValues.length > 0
      ? recentValues.reduce((acc, value) => acc + value, 0) / recentValues.length
      : 0;

  // Calculate weekday averages
  const weekdayTotals = Array.from({ length: 7 }, () => ({
    sum: 0,
    count: 0,
  }));

  for (const item of dailyData) {
    if (item.hours === null) continue;
    const dayIndex = item.date.getDay();
    weekdayTotals[dayIndex].sum += item.hours;
    weekdayTotals[dayIndex].count += 1;
  }

  const weekdayAverages = weekdayTotals.map((item) =>
    item.count > 0 ? item.sum / item.count : 0
  );

  return {
    dailyData,
    recordedCount: values.length,
    missingCount: daysInMonth.length - values.length,
    totalHours,
    averageHours,
    maxHours,
    minHours,
    hitRate,
    recentAverage,
    weekdayAverages,
  };
}

export function useSleepData(currentDate: Date): UseSleepDataReturn {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/attendance?year=${year}&month=${month}`);
      const result = await response.json();
      setAttendances(result);
    } catch (error) {
      console.error("Failed to fetch sleep data:", error);
      setAttendances([]);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statistics = useMemo(
    () => calculateStatistics(attendances, currentDate),
    [attendances, currentDate]
  );

  return {
    attendances,
    isLoading,
    statistics,
  };
}
