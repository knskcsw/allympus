"use client";

import { memo, useMemo } from "react";
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
import type { Holiday } from "@/generated/prisma/client";
import { HOLIDAY_TYPE_CALENDAR_COLORS, type HolidayType, type FiscalYear } from "@/lib/holidays";

interface HolidayCalendarProps {
  fiscalYear: FiscalYear;
  holidays: Holiday[];
  onDateClick: (date: Date) => void;
}

// 会計年度の月順（4月から3月）
const FISCAL_MONTHS = [
  { month: 4, name: "4月" },
  { month: 5, name: "5月" },
  { month: 6, name: "6月" },
  { month: 7, name: "7月" },
  { month: 8, name: "8月" },
  { month: 9, name: "9月" },
  { month: 10, name: "10月" },
  { month: 11, name: "11月" },
  { month: 12, name: "12月" },
  { month: 1, name: "1月" },
  { month: 2, name: "2月" },
  { month: 3, name: "3月" },
] as const;

const WEEK_DAYS = ["月", "火", "水", "木", "金", "土", "日"] as const;

// 休日データをMap形式に変換（検索を高速化）
function createHolidayMap(holidays: Holiday[]): Map<string, Holiday> {
  const map = new Map<string, Holiday>();
  for (const holiday of holidays) {
    const dateKey = format(new Date(holiday.date), "yyyy-MM-dd");
    map.set(dateKey, holiday);
  }
  return map;
}

interface WeekDayHeaderProps {
  day: string;
  index: number;
}

const WeekDayHeader = memo(function WeekDayHeader({ day, index }: WeekDayHeaderProps) {
  return (
    <div
      className={cn(
        "p-1 text-center text-xs font-medium",
        index === 5 ? "text-blue-500" : index === 6 ? "text-red-500" : "text-muted-foreground"
      )}
    >
      {day}
    </div>
  );
});

interface DayCellProps {
  day: Date;
  holiday: Holiday | undefined;
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
}

const DayCell = memo(function DayCell({
  day,
  holiday,
  isCurrentMonth,
  isToday,
  onClick,
}: DayCellProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "min-h-[60px] p-1 border rounded cursor-pointer transition-colors hover:border-primary",
        !isCurrentMonth && "bg-muted/30 text-muted-foreground",
        isToday && "ring-2 ring-primary",
        holiday && HOLIDAY_TYPE_CALENDAR_COLORS[holiday.type as HolidayType]
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
});

interface MonthCalendarProps {
  month: number;
  monthName: string;
  yearNum: number;
  holidayMap: Map<string, Holiday>;
  today: Date;
  onDateClick: (date: Date) => void;
}

const MonthCalendar = memo(function MonthCalendar({
  month,
  monthName,
  yearNum,
  holidayMap,
  today,
  onDateClick,
}: MonthCalendarProps) {
  const { days, currentDate } = useMemo(() => {
    const year = month >= 4 ? yearNum : yearNum + 1;
    const currentDate = new Date(year, month - 1);
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    return { days, currentDate };
  }, [month, yearNum]);

  return (
    <div className="border rounded-lg p-3">
      <h3 className="text-lg font-semibold mb-2">{monthName}</h3>
      <div className="grid grid-cols-7 gap-1">
        {WEEK_DAYS.map((day, idx) => (
          <WeekDayHeader key={day} day={day} index={idx} />
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const holiday = holidayMap.get(dateKey);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, today);

          return (
            <DayCell
              key={day.toISOString()}
              day={day}
              holiday={holiday}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              onClick={() => isCurrentMonth && onDateClick(day)}
            />
          );
        })}
      </div>
    </div>
  );
});

export const HolidayCalendar = memo(function HolidayCalendar({
  fiscalYear,
  holidays,
  onDateClick,
}: HolidayCalendarProps) {
  const yearNum = useMemo(
    () => parseInt(fiscalYear.replace("FY", ""), 10) + 2000,
    [fiscalYear]
  );

  const holidayMap = useMemo(() => createHolidayMap(holidays), [holidays]);

  const today = useMemo(() => new Date(), []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {FISCAL_MONTHS.map(({ month, name }) => (
        <MonthCalendar
          key={month}
          month={month}
          monthName={name}
          yearNum={yearNum}
          holidayMap={holidayMap}
          today={today}
          onDateClick={onDateClick}
        />
      ))}
    </div>
  );
});
