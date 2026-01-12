"use client";

import { useEffect, useState, useCallback } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyCalendar } from "@/components/calendar/MonthlyCalendar";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { Attendance, Holiday } from "@/generated/prisma/client";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isHolidayLoading, setIsHolidayLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchAttendances = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(
      `/api/attendance?year=${year}&month=${month}`
    );
    const data = await response.json();
    setAttendances(data);
    setIsLoading(false);
  }, [year, month]);

  const getFiscalYear = (targetYear: number, targetMonth: number) => {
    const fiscalYear = targetMonth >= 4 ? targetYear : targetYear - 1;
    const suffix = String(fiscalYear % 100).padStart(2, "0");
    return `FY${suffix}`;
  };

  const fetchHolidays = useCallback(async () => {
    setIsHolidayLoading(true);
    try {
      const fiscalYear = getFiscalYear(year, month);
      const response = await fetch(`/api/holidays?fiscalYear=${fiscalYear}`);
      if (!response.ok) {
        throw new Error("Failed to fetch holidays");
      }
      const data = await response.json();
      setHolidays(data);
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
      setHolidays([]);
    } finally {
      setIsHolidayLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const workedDays = attendances.filter((a) => a.clockIn && a.clockOut).length;
  const totalMinutes = attendances.reduce((acc, a) => {
    if (a.clockIn && a.clockOut) {
      const diff =
        new Date(a.clockOut).getTime() - new Date(a.clockIn).getTime();
      return acc + Math.floor(diff / 60000) - a.breakMinutes;
    }
    return acc;
  }, 0);

  const isCalendarLoading = isLoading || isHolidayLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold">Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>
              {format(currentDate, "yyyy年 M月", { locale: ja })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCalendarLoading ? (
              <div className="flex items-center justify-center h-64">
                Loading...
              </div>
            ) : (
              <MonthlyCalendar
                year={year}
                month={month}
                attendances={attendances}
                holidays={holidays}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Days Worked</div>
              <div className="text-2xl font-bold">{workedDays} days</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
              <div className="text-2xl font-bold">
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Average Hours/Day
              </div>
              <div className="text-2xl font-bold">
                {workedDays > 0
                  ? `${Math.floor(totalMinutes / workedDays / 60)}h ${
                      Math.floor(totalMinutes / workedDays) % 60
                    }m`
                  : "0h 0m"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
