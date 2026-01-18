"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { Attendance, Holiday } from "@/generated/prisma/client";
import {
  getFiscalYear,
  calculateMonthlySummary,
  type MonthlySummary,
  type MonthlyVacation,
  type WorkingDaysResponse,
} from "@/types/monthly";

interface UseMonthlyDataReturn {
  // Data
  attendances: Attendance[];
  holidays: Holiday[];
  summary: MonthlySummary;
  // Loading states
  isAttendanceLoading: boolean;
  isHolidayLoading: boolean;
  isSummaryLoading: boolean;
  isCalendarLoading: boolean;
  // Actions
  refetchAttendances: () => Promise<void>;
}

export function useMonthlyData(year: number, month: number): UseMonthlyDataReturn {
  // Data states
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [workingDays, setWorkingDays] = useState<number | null>(null);
  const [vacationHours, setVacationHours] = useState(0);

  // Loading states
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
  const [isHolidayLoading, setIsHolidayLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  // Memoize fiscal year calculation
  const fiscalYear = useMemo(() => getFiscalYear(year, month), [year, month]);

  // Fetch attendance data
  const fetchAttendances = useCallback(async () => {
    setIsAttendanceLoading(true);
    try {
      const response = await fetch(`/api/attendance?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setAttendances(data);
      } else {
        console.error("Failed to fetch attendances");
        setAttendances([]);
      }
    } catch (error) {
      console.error("Failed to fetch attendances:", error);
      setAttendances([]);
    } finally {
      setIsAttendanceLoading(false);
    }
  }, [year, month]);

  // Fetch holidays data
  const fetchHolidays = useCallback(async () => {
    setIsHolidayLoading(true);
    try {
      const response = await fetch(`/api/holidays?fiscalYear=${fiscalYear}`);
      if (response.ok) {
        const data = await response.json();
        setHolidays(data);
      } else {
        console.error("Failed to fetch holidays");
        setHolidays([]);
      }
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
      setHolidays([]);
    } finally {
      setIsHolidayLoading(false);
    }
  }, [fiscalYear]);

  // Fetch summary metadata (working days and vacation hours)
  const fetchSummaryMeta = useCallback(async () => {
    setIsSummaryLoading(true);
    try {
      const [workingDaysRes, vacationRes] = await Promise.all([
        fetch(`/api/holidays/working-days?fiscalYear=${fiscalYear}`),
        fetch(`/api/kadmin/monthly-vacation?fiscalYear=${fiscalYear}`),
      ]);

      if (workingDaysRes.ok) {
        const workingDaysData: WorkingDaysResponse = await workingDaysRes.json();
        setWorkingDays(workingDaysData?.workingDays?.[month] ?? null);
      } else {
        setWorkingDays(null);
      }

      if (vacationRes.ok) {
        const vacationData: MonthlyVacation[] = await vacationRes.json();
        const monthVacation = Array.isArray(vacationData)
          ? vacationData.find((v) => v.month === month)
          : null;
        setVacationHours(monthVacation?.hours ?? 0);
      } else {
        setVacationHours(0);
      }
    } catch (error) {
      console.error("Failed to fetch summary meta:", error);
      setWorkingDays(null);
      setVacationHours(0);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [fiscalYear, month]);

  // Effects to fetch data
  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    fetchSummaryMeta();
  }, [fetchSummaryMeta]);

  // Memoize computed summary
  const summary = useMemo(
    () => calculateMonthlySummary(attendances, workingDays, vacationHours),
    [attendances, workingDays, vacationHours]
  );

  // Memoize combined loading state
  const isCalendarLoading = isAttendanceLoading || isHolidayLoading;

  return {
    attendances,
    holidays,
    summary,
    isAttendanceLoading,
    isHolidayLoading,
    isSummaryLoading,
    isCalendarLoading,
    refetchAttendances: fetchAttendances,
  };
}
