/**
 * 週ナビゲーション管理フック
 * 週の定義: 土曜日 00:00 〜 金曜日 23:59
 */

import { useState } from 'react';
import { startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay } from 'date-fns';

export interface WeekRange {
  start: Date;
  end: Date;
}

export function useWeekNavigation(initialDate: Date = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  const getWeekRange = (date: Date): WeekRange => {
    // 週の開始は土曜日
    const start = startOfWeek(date, { weekStartsOn: 6 });
    const end = endOfWeek(date, { weekStartsOn: 6 });
    return { start, end };
  };

  const weekRange = getWeekRange(currentDate);

  const goToPreviousWeek = () => {
    setCurrentDate(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };

  const goToThisWeek = () => {
    setCurrentDate(new Date());
  };

  const goToWeek = (date: Date) => {
    setCurrentDate(startOfDay(date));
  };

  return {
    weekRange,
    currentDate,
    goToPreviousWeek,
    goToNextWeek,
    goToThisWeek,
    goToWeek,
  };
}
