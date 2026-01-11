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
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          {/* Left: Date Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevDay}
                title="前の日"
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="px-3 py-1 bg-background rounded-md border min-w-[200px] text-center cursor-pointer hover:bg-accent transition-colors" onClick={handleToday}>
                <div className="text-lg font-bold">
                  {format(currentDate, "yyyy年M月d日", { locale: ja })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(currentDate, "EEEE", { locale: ja })}
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextDay}
                title="次の日"
                className="h-8 w-8"
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
          </div>

          {/* Right: Attendance Info */}
          <div className="flex items-center gap-6 text-sm">
            {attendance ? (
              <>
                {/* Clock In/Out Times */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">出勤:</span>
                  <span className="font-medium">
                    {attendance.clockIn
                      ? format(new Date(attendance.clockIn), "HH:mm")
                      : "-"}
                  </span>
                  <span className="text-muted-foreground mx-2">→</span>
                  <span className="text-muted-foreground">退勤:</span>
                  <span className="font-medium">
                    {attendance.clockOut
                      ? format(new Date(attendance.clockOut), "HH:mm")
                      : "-"}
                  </span>
                </div>

                {/* Break Time */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">休憩:</span>
                  <span className="font-medium">{attendance.breakMinutes}分</span>
                </div>

                {/* Total Working Hours */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">総労働時間:</span>
                  <span className="font-semibold text-lg">
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
