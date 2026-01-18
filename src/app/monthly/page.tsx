"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyCalendar } from "@/components/calendar/MonthlyCalendar";
import { MonthlyAttendanceRecords } from "@/components/attendance/MonthlyAttendanceRecords";
import { MonthlySummaryCard } from "@/components/calendar/MonthlySummaryCard";
import { MonthlyPageHeader } from "@/components/calendar/MonthlyPageHeader";
import { LoadingPlaceholder } from "@/components/calendar/LoadingPlaceholder";
import { useMonthlyData } from "@/hooks/useMonthlyData";
import { useMonthNavigation } from "@/hooks/useMonthNavigation";

export default function MonthlyPage() {
  const {
    currentDate,
    selectedDate,
    year,
    month,
    handlePrevMonth,
    handleNextMonth,
    handleToday,
    setSelectedDate,
  } = useMonthNavigation();

  const {
    attendances,
    holidays,
    summary,
    isAttendanceLoading,
    isSummaryLoading,
    isCalendarLoading,
    refetchAttendances,
  } = useMonthlyData(year, month);

  return (
    <div className="space-y-6">
      <MonthlyPageHeader
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      <div className="grid gap-6 md:grid-cols-4">
        <div className="space-y-6 md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {format(currentDate, "yyyy年 M月", { locale: ja })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isCalendarLoading ? (
                <LoadingPlaceholder height="h-64" />
              ) : (
                <MonthlyCalendar
                  year={year}
                  month={month}
                  attendances={attendances}
                  holidays={holidays}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>This Month&apos;s Records</CardTitle>
            </CardHeader>
            <CardContent>
              {isAttendanceLoading ? (
                <LoadingPlaceholder height="h-32" />
              ) : (
                <MonthlyAttendanceRecords
                  attendances={attendances}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onUpdate={refetchAttendances}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <MonthlySummaryCard summary={summary} isLoading={isSummaryLoading} />
      </div>
    </div>
  );
}
