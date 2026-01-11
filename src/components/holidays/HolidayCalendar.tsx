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
import type { Holiday } from "@/generated/prisma/client";

interface HolidayCalendarProps {
  fiscalYear: string;
  holidays: Holiday[];
  onDateClick: (date: Date) => void;
}

const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]; // April to March
const MONTH_NAMES = [
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
  "1月",
  "2月",
  "3月",
];

const HOLIDAY_TYPE_COLORS: { [key: string]: string } = {
  PUBLIC_HOLIDAY: "bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700",
  WEEKEND: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600",
  SPECIAL_HOLIDAY: "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700",
};

export function HolidayCalendar({
  fiscalYear,
  holidays,
  onDateClick,
}: HolidayCalendarProps) {
  const yearNum = parseInt(fiscalYear.replace("FY", ""), 10) + 2000;

  const getHolidayForDay = (day: Date) => {
    return holidays.find((h) => {
      const holidayDate = new Date(h.date);
      return isSameDay(holidayDate, day);
    });
  };

  const renderMonth = (month: number, monthName: string) => {
    const year = month >= 4 ? yearNum : yearNum + 1;
    const currentDate = new Date(year, month - 1);
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const today = new Date();

    const weekDays = ["月", "火", "水", "木", "金", "土", "日"];

    return (
      <div key={month} className="border rounded-lg p-3">
        <h3 className="text-lg font-semibold mb-2">{monthName}</h3>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={cn(
                "p-1 text-center text-xs font-medium",
                idx === 5 ? "text-blue-500" : idx === 6 ? "text-red-500" : "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
          {days.map((day) => {
            const holiday = getHolidayForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                onClick={() => isCurrentMonth && onDateClick(day)}
                className={cn(
                  "min-h-[60px] p-1 border rounded cursor-pointer transition-colors hover:border-primary",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isToday && "ring-2 ring-primary",
                  holiday && HOLIDAY_TYPE_COLORS[holiday.type]
                )}
              >
                <div className="text-xs font-medium">{format(day, "d")}</div>
                {holiday && isCurrentMonth && (
                  <div className="mt-1 text-[10px] leading-tight line-clamp-2">
                    {holiday.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {MONTHS.map((month, idx) => renderMonth(month, MONTH_NAMES[idx]))}
    </div>
  );
}
