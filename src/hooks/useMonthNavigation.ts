"use client";

import { useState, useCallback, useMemo } from "react";
import { addMonths, subMonths } from "date-fns";

interface UseMonthNavigationReturn {
  currentDate: Date;
  selectedDate: Date | null;
  year: number;
  month: number;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  handleToday: () => void;
  setSelectedDate: (date: Date | null) => void;
}

export function useMonthNavigation(): UseMonthNavigationReturn {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Memoize year and month derivations
  const year = useMemo(() => currentDate.getFullYear(), [currentDate]);
  const month = useMemo(() => currentDate.getMonth() + 1, [currentDate]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate((prev) => subMonths(prev, 1));
    setSelectedDate(null);
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => addMonths(prev, 1));
    setSelectedDate(null);
  }, []);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  return {
    currentDate,
    selectedDate,
    year,
    month,
    handlePrevMonth,
    handleNextMonth,
    handleToday,
    setSelectedDate,
  };
}
