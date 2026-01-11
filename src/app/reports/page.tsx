"use client";

import { useEffect, useState, useCallback } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

interface DailyData {
  date: string;
  dayOfWeek: string;
  workingMinutes: number;
  trackedSeconds: number;
  hasAttendance: boolean;
}

interface ReportData {
  period: { start: string; end: string; type: string };
  dailyData: DailyData[];
  summary: {
    totalWorkingMinutes: number;
    totalTrackedSeconds: number;
    workedDays: number;
    totalDays: number;
  };
  wbsSummary: Record<string, number>;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export default function ReportsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(
      `/api/reports?year=${year}&month=${month}&type=month`
    );
    const data = await response.json();
    setReport(data);
    setIsLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleExportCSV = () => {
    window.open(
      `/api/reports?year=${year}&month=${month}&type=month&export=csv`,
      "_blank"
    );
  };

  if (isLoading || !report) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
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
          <Button onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Days Worked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.summary.workedDays} / {report.summary.totalDays}
            </div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Working Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(report.summary.totalWorkingMinutes)}
            </div>
            <p className="text-xs text-muted-foreground">attendance based</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tracked Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatSeconds(report.summary.totalTrackedSeconds)}
            </div>
            <p className="text-xs text-muted-foreground">time entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average Hours/Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.summary.workedDays > 0
                ? formatDuration(
                    Math.floor(
                      report.summary.totalWorkingMinutes /
                        report.summary.workedDays
                    )
                  )
                : "0h 0m"}
            </div>
            <p className="text-xs text-muted-foreground">per working day</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Working</TableHead>
                  <TableHead>Tracked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.dailyData
                  .filter((d) => d.hasAttendance)
                  .map((day) => (
                    <TableRow key={day.date}>
                      <TableCell>{format(new Date(day.date), "MM/dd")}</TableCell>
                      <TableCell>{day.dayOfWeek}</TableCell>
                      <TableCell>{formatDuration(day.workingMinutes)}</TableCell>
                      <TableCell>{formatSeconds(day.trackedSeconds)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time by Project/WBS</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(report.wbsSummary).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tracked time for this period
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project - WBS</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(report.wbsSummary)
                    .sort((a, b) => b[1] - a[1])
                    .map(([wbs, seconds]) => (
                      <TableRow key={wbs}>
                        <TableCell>{wbs}</TableCell>
                        <TableCell>{formatSeconds(seconds)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
