"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addDays, subDays, startOfToday } from "date-fns";
import { ja } from "date-fns/locale";

interface Attendance {
  id: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  breakMinutes: number;
  note: string | null;
}

interface DailyAttendanceBannerProps {
  attendance: Attendance | null;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DailyAttendanceBanner({
  attendance,
  currentDate,
  onDateChange,
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
    onDateChange(addDays(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(startOfToday());
  };

  const isToday =
    format(currentDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <Card className="bg-muted/30">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          {/* Left: Date Navigation - Reportsページと同じスタイル */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium min-w-[180px] text-center">
              {format(currentDate, "yyyy年 M月d日", { locale: ja })} (
              {format(currentDate, "E", { locale: ja })})
            </span>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
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
          <div className="flex items-center gap-4 text-sm">
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
                  <span className="text-muted-foreground">総労働:</span>
                  <span className="font-semibold">
                    {workingHours.toFixed(2)}h
                  </span>
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">勤怠記録なし</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
