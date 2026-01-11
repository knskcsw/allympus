"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addDays, subDays, startOfDay, startOfToday } from "date-fns";
import { ja } from "date-fns/locale";

interface Attendance {
  id: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  breakMinutes: number;
  workMode?: string | null;
  sleepHours?: number | null;
  note: string | null;
}

interface DailyAttendanceBannerProps {
  attendance: Attendance | null;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  maxDate?: Date;
  onClockOut?: () => void;
  showClockOut?: boolean;
}

export default function DailyAttendanceBanner({
  attendance,
  currentDate,
  onDateChange,
  maxDate,
  onClockOut,
  showClockOut = false,
}: DailyAttendanceBannerProps) {
  // Calculate total working hours
  const calculateWorkingHours = () => {
    if (!attendance || !attendance.clockIn) return 0;

    const start = new Date(attendance.clockIn);
    const end = attendance.clockOut
      ? new Date(attendance.clockOut)
      : new Date();

    const totalMinutes =
      (end.getTime() - start.getTime()) / (1000 * 60) - attendance.breakMinutes;

    return totalMinutes / 60; // Return as hours
  };

  const workingHours = calculateWorkingHours();

  const handlePrevDay = () => {
    onDateChange(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    const nextDate = addDays(currentDate, 1);
    if (maxDate && startOfDay(nextDate) > startOfDay(maxDate)) return;
    onDateChange(nextDate);
  };

  const handleToday = () => {
    onDateChange(startOfToday());
  };

  const isToday =
    format(currentDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const currentDay = startOfDay(currentDate);
  const maxDay = maxDate ? startOfDay(maxDate) : null;
  const isNextDisabled = maxDay ? addDays(currentDay, 1) > maxDay : false;
  const isFutureDate = maxDay ? currentDay > maxDay : false;

  return (
    <Card className="bg-muted/30">
      <CardContent className="py-2">
        <div className="flex items-center justify-between">
          {/* Left: Date Navigation - Reportsページと同じスタイル */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[160px] text-center">
              {format(currentDate, "yyyy年 M月d日", { locale: ja })} (
              {format(currentDate, "E", { locale: ja })})
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextDay}
              disabled={isNextDisabled}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant={isToday ? "secondary" : "outline"}
              onClick={handleToday}
              size="sm"
              disabled={isToday}
            >
              <Calendar className="h-4 w-4 mr-1" />
              今日
            </Button>
          </div>

          {/* Right: Attendance Info - よりコンパクトに */}
          <div className="flex items-center gap-3 text-xs leading-tight">
            {attendance ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">出勤:</span>
                  <span className="font-medium">
                    {attendance.clockIn
                      ? format(new Date(attendance.clockIn), "HH:mm")
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">退勤:</span>
                  <span className="font-medium">
                    {attendance.clockOut
                      ? format(new Date(attendance.clockOut), "HH:mm")
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">休憩:</span>
                  <span className="font-medium">{attendance.breakMinutes}分</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">出社形態:</span>
                  <span className="font-medium">
                    {attendance.workMode || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">睡眠:</span>
                  <span className="font-medium">
                    {attendance.sleepHours !== null &&
                    attendance.sleepHours !== undefined
                      ? `${attendance.sleepHours}h`
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">総労働:</span>
                  <span className="font-semibold">
                    {workingHours.toFixed(2)}h
                  </span>
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">
                {isFutureDate ? "未来日は表示できません" : "勤怠記録なし"}
              </span>
            )}
            {showClockOut && attendance?.clockIn && !attendance.clockOut && (
              <Button size="sm" onClick={onClockOut}>
                退勤する
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
