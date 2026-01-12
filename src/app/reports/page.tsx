"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { BarChart3, ChevronLeft, ChevronRight, Download } from "lucide-react";
import EvmLineChart from "@/components/evm/EvmLineChart";
import type { WorkType } from "@/lib/workTypes";

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

interface WorkTypeSeries {
  workType: WorkType;
  label: string;
  pvDaily: number[];
  acDaily: number[];
  bacTotal: number;
}

interface WorkTypeReportData {
  period: { start: string; end: string };
  days: string[];
  types: WorkTypeSeries[];
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

function toCumulative(values: number[]) {
  return values.reduce<number[]>((acc, value) => {
    const prev = acc.length ? acc[acc.length - 1] : 0;
    acc.push(prev + value);
    return acc;
  }, []);
}

export default function ReportsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workTypeReport, setWorkTypeReport] =
    useState<WorkTypeReportData | null>(null);
  const [isWorkTypeLoading, setIsWorkTypeLoading] = useState(true);
  const [ratioViewMode, setRatioViewMode] = useState<"daily" | "cumulative">(
    "daily"
  );

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

  const fetchWorkTypeReport = useCallback(async () => {
    setIsWorkTypeLoading(true);
    const response = await fetch(
      `/api/reports/worktype?year=${year}&month=${month}`
    );
    const data = await response.json();
    if (data.error) {
      console.error("Failed to fetch work type report:", data.error);
      setWorkTypeReport(null);
    } else {
      setWorkTypeReport(data);
    }
    setIsWorkTypeLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchReport();
    fetchWorkTypeReport();
  }, [fetchReport, fetchWorkTypeReport]);

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

  const workTypeCharts = useMemo(() => {
    if (!workTypeReport || !workTypeReport.days || !workTypeReport.types) return null;
    const { days, types } = workTypeReport;
    const totalPvDaily = days.map((_, index) =>
      types.reduce((acc, type) => acc + (type.pvDaily[index] || 0), 0)
    );
    const totalAcDaily = days.map((_, index) =>
      types.reduce((acc, type) => acc + (type.acDaily[index] || 0), 0)
    );
    const totalBac = types.reduce((acc, type) => acc + type.bacTotal, 0);

    const totalsPv = ratioViewMode === "daily" ? totalPvDaily : toCumulative(totalPvDaily);
    const totalsAc = ratioViewMode === "daily" ? totalAcDaily : toCumulative(totalAcDaily);
    const cumulativeTotalsAc = toCumulative(totalAcDaily);

    return {
      days,
      types: types.map((type) => {
        const pvSeries =
          ratioViewMode === "daily" ? type.pvDaily : toCumulative(type.pvDaily);
        const acSeries =
          ratioViewMode === "daily" ? type.acDaily : toCumulative(type.acDaily);
        const cumulativeAc = toCumulative(type.acDaily);
        const bacRatio = totalBac ? (type.bacTotal / totalBac) * 100 : 0;

        const pvRatio = pvSeries.map((value, index) =>
          totalsPv[index] ? (value / totalsPv[index]) * 100 : 0
        );
        const acRatio = acSeries.map((value, index) =>
          totalsAc[index] ? (value / totalsAc[index]) * 100 : 0
        );
        const bacSeries = days.map(() => bacRatio);
        const forecastSeries = days.map((_, index) => {
          const elapsed = index + 1;
          const remaining = days.length - elapsed;
          const currentType = cumulativeAc[index] || 0;
          const currentTotal = cumulativeTotalsAc[index] || 0;
          const typeForecast =
            currentType === 0 ? 0 : currentType + (currentType / elapsed) * remaining;
          const totalForecast =
            currentTotal === 0 ? 0 : currentTotal + (currentTotal / elapsed) * remaining;
          return totalForecast ? (typeForecast / totalForecast) * 100 : 0;
        });

        return {
          label: type.label,
          pvRatio,
          acRatio,
          bacSeries,
          forecastSeries,
        };
      }),
    };
  }, [ratioViewMode, workTypeReport]);

  const pvColor = "#3b82f6";
  const acColor = "#ef4444";
  const bacColor = "#10b981";
  const forecastColor = "#f59e0b";

  if (isLoading || !report) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold">Reports</h1>
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

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>稼働タイプ別 割合推移</CardTitle>
            <p className="text-sm text-muted-foreground">
              PV/ACの割合推移とBAC/予測の基準ライン
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={ratioViewMode === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => setRatioViewMode("daily")}
            >
              日次
            </Button>
            <Button
              variant={ratioViewMode === "cumulative" ? "default" : "outline"}
              size="sm"
              onClick={() => setRatioViewMode("cumulative")}
            >
              累積
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isWorkTypeLoading || !workTypeCharts ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading work type ratios...
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pvColor }} />
                  <span>PV割合</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: acColor }} />
                  <span>AC割合</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bacColor }} />
                  <span>BAC割合</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: forecastColor }} />
                  <span>予測割合</span>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                {workTypeCharts.types.map((type) => (
                  <Card key={type.label}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{type.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EvmLineChart
                        dates={workTypeCharts.days}
                        maxValue={100}
                        valueFormatter={(value) => `${value.toFixed(1)}%`}
                        series={[
                          { label: "PV", color: pvColor, data: type.pvRatio },
                          { label: "AC", color: acColor, data: type.acRatio },
                          { label: "BAC", color: bacColor, data: type.bacSeries },
                          { label: "予測", color: forecastColor, data: type.forecastSeries },
                        ]}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
