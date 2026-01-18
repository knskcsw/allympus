/**
 * 週データ取得フック
 * 勤怠、タスク、週報データを取得
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { WeekRange } from './useWeekNavigation';

interface Attendance {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number;
  workMode: string | null;
  note: string | null;
}

interface DailyTask {
  id: string;
  date: string;
  title: string;
  status: string;
  priority: string;
}

interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  content: string;
}

interface WeeklyData {
  attendances: Attendance[];
  tasks: DailyTask[];
  weeklyReport: WeeklyReport | null;
}

export function useWeeklyData(weekRange: WeekRange) {
  const [data, setData] = useState<WeeklyData>({
    attendances: [],
    tasks: [],
    weeklyReport: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = format(weekRange.start, 'yyyy-MM-dd');
        const endDate = format(weekRange.end, 'yyyy-MM-dd');

        // 並列でデータ取得
        const [attendanceRes, tasksRes, reportRes] = await Promise.all([
          fetch(`/api/attendance?startDate=${startDate}&endDate=${endDate}`),
          fetch(`/api/daily-tasks?startDate=${startDate}&endDate=${endDate}`),
          fetch(`/api/weekly-reports?weekStart=${startDate}`),
        ]);

        if (!attendanceRes.ok || !tasksRes.ok || !reportRes.ok) {
          throw new Error('データ取得に失敗しました');
        }

        const [attendances, tasks, report] = await Promise.all([
          attendanceRes.json(),
          tasksRes.json(),
          reportRes.json(),
        ]);

        setData({
          attendances: attendances || [],
          tasks: tasks || [],
          weeklyReport: report || null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラー');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [weekRange.start, weekRange.end]);

  return { data, loading, error };
}
