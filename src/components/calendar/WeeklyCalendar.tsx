/**
 * 週カレンダーコンポーネント
 * 土曜日〜金曜日の7日間を表示
 * 各日に勤怠情報と完了済みタスクを表示
 */

import { format, addDays, differenceInMinutes, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WeekRange } from '@/hooks/useWeekNavigation';

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

interface WeeklyCalendarProps {
  weekRange: WeekRange;
  attendances: Attendance[];
  tasks: DailyTask[];
}

export function WeeklyCalendar({
  weekRange,
  attendances,
  tasks,
}: WeeklyCalendarProps) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekRange.start, i));

  const getAttendanceForDate = (date: Date) => {
    return attendances.find((att) => isSameDay(new Date(att.date), date));
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(
      (task) => isSameDay(new Date(task.date), date) && task.status === 'DONE'
    );
  };

  const formatWorkTime = (attendance: Attendance | undefined) => {
    if (!attendance?.clockIn) return '-';

    const clockIn = new Date(attendance.clockIn);
    const clockOut = attendance.clockOut ? new Date(attendance.clockOut) : null;

    const clockInStr = format(clockIn, 'HH:mm');
    const clockOutStr = clockOut ? format(clockOut, 'HH:mm') : '-';

    let workTime = '';
    if (clockOut) {
      const totalMinutes = differenceInMinutes(clockOut, clockIn);
      const workMinutes = totalMinutes - (attendance.breakMinutes || 0);
      const hours = Math.floor(workMinutes / 60);
      const minutes = workMinutes % 60;
      workTime = `${hours}h${minutes}m`;
    }

    return { clockInStr, clockOutStr, workTime };
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((date) => {
        const attendance = getAttendanceForDate(date);
        const doneTasks = getTasksForDate(date);
        const timeInfo = formatWorkTime(attendance);

        return (
          <Card key={date.toISOString()} className="min-h-[200px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {format(date, 'M/d (E)', { locale: ja })}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              {/* 勤怠情報 */}
              {timeInfo !== '-' && typeof timeInfo === 'object' ? (
                <div className="space-y-1 border-b pb-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">出勤:</span>
                    <span>{timeInfo.clockInStr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">退勤:</span>
                    <span>{timeInfo.clockOutStr}</span>
                  </div>
                  {timeInfo.workTime && (
                    <div className="flex justify-between font-medium">
                      <span className="text-muted-foreground">勤務:</span>
                      <span>{timeInfo.workTime}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground border-b pb-2">勤怠なし</div>
              )}

              {/* 完了済みタスク一覧 */}
              {doneTasks.length > 0 ? (
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  <div className="text-muted-foreground font-medium">完了タスク</div>
                  {doneTasks.map((task) => (
                    <div
                      key={task.id}
                      className="text-xs bg-green-50 dark:bg-green-950 px-2 py-1 rounded"
                    >
                      ✓ {task.title}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">完了タスクなし</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
