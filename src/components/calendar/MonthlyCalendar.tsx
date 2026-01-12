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
import { cn } from "@/lib/utils";
import type { Attendance, Holiday } from "@/generated/prisma/client";

interface MonthlyCalendarProps {
  year: number;
  month: number;
  attendances: Attendance[];
  holidays: Holiday[];
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
  holidays,
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

  const getHolidayForDay = (day: Date) =>
    holidays.find((holiday) => isSameDay(new Date(holiday.date), day));

  const holidayStyleMap: Record<string, { cell: string; text: string }> = {
    PUBLIC_HOLIDAY: {
      cell: "bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700",
      text: "text-red-600 dark:text-red-300",
    },
    WEEKEND: {
      cell: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600",
      text: "text-slate-600 dark:text-slate-300",
    },
    SPECIAL_HOLIDAY: {
      cell: "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700",
      text: "text-blue-600 dark:text-blue-300",
    },
    PAID_LEAVE: {
      cell: "bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700",
      text: "text-emerald-600 dark:text-emerald-300",
    },
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
          const holiday = getHolidayForDay(day);
          const holidayStyle = holiday
            ? holidayStyleMap[holiday.type] ?? {
                cell: "bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700",
                text: "text-amber-600 dark:text-amber-300",
              }
            : null;
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
                hasWorked && "bg-green-50 dark:bg-green-950",
                holidayStyle?.cell
              )}
            >
              <div className="text-sm font-medium">{format(day, "d")}</div>
              {isCurrentMonth && (
                <div className="mt-1 text-xs space-y-0.5">
                  {holiday && (
                    <div className={cn("text-[10px] font-medium", holidayStyle?.text)}>
                      {holiday.name}
                    </div>
                  )}
                  {attendance?.clockIn && (
                    <div className="text-green-600">
                      In: {format(new Date(attendance.clockIn), "HH:mm")}
                    </div>
                  )}
                  {attendance?.clockOut && (
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
