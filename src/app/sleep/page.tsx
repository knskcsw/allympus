"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, MoonStar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SleepLineChart from "@/components/sleep/SleepLineChart";
import type { Attendance } from "@/generated/prisma/client";

const TARGET_SLEEP = 8;

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHours(value: number) {
  return `${value.toFixed(1)}h`;
}

export default function SleepPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/attendance?year=${year}&month=${month}`);
    const result = await response.json();
    setAttendances(result);
    setIsLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const {
    dailyData,
    recordedCount,
    missingCount,
    totalHours,
    averageHours,
    maxHours,
    minHours,
    hitRate,
    recentAverage,
    weekdayAverages,
  } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    });

    const sleepByDate = new Map<string, number>();
    attendances.forEach((attendance) => {
      if (attendance.sleepHours === null || attendance.sleepHours === undefined) {
        return;
      }
      const key = format(new Date(attendance.date), "yyyy-MM-dd");
      sleepByDate.set(key, attendance.sleepHours);
    });

    const daily = daysInMonth.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      return {
        date: day,
        hours: sleepByDate.get(key) ?? null,
      };
    });

    const values = daily
      .map((item) => item.hours)
      .filter((value): value is number => value !== null);

    const total = values.reduce((acc, value) => acc + value, 0);
    const avg = values.length ? total / values.length : 0;
    const max = values.length ? Math.max(...values) : 0;
    const min = values.length ? Math.min(...values) : 0;
    const hitDays = values.filter((value) => value >= TARGET_SLEEP).length;
    const recentValues = values.slice(-7);
    const recentAvg = recentValues.length
      ? recentValues.reduce((acc, value) => acc + value, 0) / recentValues.length
      : 0;

    const weekdayTotals = Array.from({ length: 7 }, () => ({
      sum: 0,
      count: 0,
    }));

    daily.forEach((item) => {
      if (item.hours === null) return;
      const dayIndex = item.date.getDay();
      weekdayTotals[dayIndex].sum += item.hours;
      weekdayTotals[dayIndex].count += 1;
    });

    const weekdayAvg = weekdayTotals.map((item) =>
      item.count ? item.sum / item.count : 0
    );

    return {
      recordedCount: values.length,
      missingCount: daysInMonth.length - values.length,
      totalHours: total,
      averageHours: avg,
      maxHours: max,
      minHours: min,
      hitRate: values.length ? (hitDays / values.length) * 100 : 0,
      recentAverage: recentAvg,
      weekdayAverages: weekdayAvg,
      dailyData: daily,
    };
  }, [attendances, currentDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  const maxWeekdayValue = Math.max(1, ...weekdayAverages);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <MoonStar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Sleep</h1>
            <p className="text-sm text-muted-foreground">
              Monthly sleep insights from attendance logs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[120px] text-center">
            {format(currentDate, "yyyy年 M月", { locale: ja })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Sleep
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-bold">
              {averageHours ? formatHours(averageHours) : "--"}
            </div>
            <div className="text-xs text-muted-foreground">
              Target {TARGET_SLEEP}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sleep
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-bold">
              {totalHours ? formatHours(totalHours) : "--"}
            </div>
            <div className="text-xs text-muted-foreground">
              Recorded {recordedCount} nights
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best / Shortest
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Best</span>
              <span className="font-semibold">
                {maxHours ? formatHours(maxHours) : "--"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Shortest</span>
              <span className="font-semibold">
                {minHours ? formatHours(minHours) : "--"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Consistency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">
                {recordedCount ? `${Math.round(hitRate)}%` : "--"}
              </div>
              <Badge variant="secondary">Target hit</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Missing {missingCount} nights this month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Monthly Trend</CardTitle>
            <div className="text-xs text-muted-foreground">
              Last 7 average: {recentAverage ? formatHours(recentAverage) : "--"}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SleepLineChart data={dailyData} targetHours={TARGET_SLEEP} />
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--chart-1)]" />
                Sleep hours
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full border border-dashed border-primary/60" />
                Target {TARGET_SLEEP}h
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekday Pattern</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weekdayAverages.map((value, index) => (
              <div key={weekdayLabels[index]} className="flex items-center gap-3">
                <div className="w-10 text-xs text-muted-foreground">
                  {weekdayLabels[index]}
                </div>
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary/70"
                    style={{ width: `${(value / maxWeekdayValue) * 100}%` }}
                  />
                </div>
                <div className="w-10 text-right text-xs font-medium">
                  {value ? formatHours(value) : "--"}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Log</CardTitle>
          <span className="text-xs text-muted-foreground">
            {recordedCount} nights recorded
          </span>
        </CardHeader>
        <CardContent>
          {recordedCount === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No sleep records for this month yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Sleep</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyData.map((entry) => {
                  const isMissing = entry.hours === null;
                  const isShort = entry.hours !== null && entry.hours < TARGET_SLEEP;
                  return (
                    <TableRow key={entry.date.toISOString()}>
                      <TableCell>
                        {format(entry.date, "yyyy/MM/dd (E)", { locale: ja })}
                      </TableCell>
                      <TableCell>
                        {entry.hours !== null ? formatHours(entry.hours) : "--"}
                      </TableCell>
                      <TableCell>
                        {isMissing ? "No entry" : isShort ? "Below target" : "On track"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
