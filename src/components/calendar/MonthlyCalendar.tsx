"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Attendance } from "@/generated/prisma/client";

interface MonthlyCalendarProps {
  year: number;
  month: number;
  attendances: Attendance[];
}

function formatWorkingHours(clockIn: Date, clockOut: Date, breakMinutes: number): string {
  const diff = clockOut.getTime() - clockIn.getTime();
  const totalMinutes = Math.floor(diff / 60000) - breakMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h${mins}m`;
}

export function MonthlyCalendar({
  year,
  month,
  attendances,
}: MonthlyCalendarProps) {
  const currentDate = new Date(year, month - 1);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const today = new Date();

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getAttendanceForDay = (day: Date) => {
    return attendances.find((a) => {
      const attendanceDate = new Date(a.date);
      return isSameDay(attendanceDate, day);
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const attendance = getAttendanceForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, today);
          const hasWorked = attendance?.clockIn && attendance?.clockOut;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[80px] p-2 border rounded-md",
                !isCurrentMonth && "bg-muted/50 text-muted-foreground",
                isToday && "border-primary border-2",
                hasWorked && "bg-green-50 dark:bg-green-950"
              )}
            >
              <div className="text-sm font-medium">{format(day, "d")}</div>
              {attendance && isCurrentMonth && (
                <div className="mt-1 text-xs space-y-0.5">
                  {attendance.clockIn && (
                    <div className="text-green-600">
                      In: {format(new Date(attendance.clockIn), "HH:mm")}
                    </div>
                  )}
                  {attendance.clockOut && (
                    <div className="text-red-600">
                      Out: {format(new Date(attendance.clockOut), "HH:mm")}
                    </div>
                  )}
                  {hasWorked && (
                    <div className="text-blue-600 font-medium">
                      {formatWorkingHours(
                        new Date(attendance.clockIn!),
                        new Date(attendance.clockOut!),
                        attendance.breakMinutes
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
