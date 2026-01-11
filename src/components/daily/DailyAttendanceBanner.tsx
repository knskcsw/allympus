"use client";

import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

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
}

export default function DailyAttendanceBanner({
  attendance,
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

  if (!attendance) {
    return (
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>勤怠記録なし</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
