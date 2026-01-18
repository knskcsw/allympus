/**
 * 週単位ページ
 * 土曜日〜金曜日の週単位でカレンダーと週報エディタを表示
 */

'use client';

import { useWeekNavigation } from '@/hooks/useWeekNavigation';
import { useWeeklyData } from '@/hooks/useWeeklyData';
import { WeeklyPageHeader } from '@/components/calendar/WeeklyPageHeader';
import { WeeklyCalendar } from '@/components/calendar/WeeklyCalendar';
import { WeeklyReportEditor } from '@/components/calendar/WeeklyReportEditor';
import { Loader2 } from 'lucide-react';

export default function WeeklyPage() {
  const {
    weekRange,
    goToPreviousWeek,
    goToNextWeek,
    goToThisWeek,
  } = useWeekNavigation();

  const { data, loading, error } = useWeeklyData(weekRange);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">
          エラー: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">週次カレンダー</h1>

      <WeeklyPageHeader
        weekRange={weekRange}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onThisWeek={goToThisWeek}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <WeeklyCalendar
            weekRange={weekRange}
            attendances={data.attendances}
            tasks={data.tasks}
          />

          <WeeklyReportEditor
            weekRange={weekRange}
            initialContent={data.weeklyReport?.content || ''}
          />
        </>
      )}
    </div>
  );
}
