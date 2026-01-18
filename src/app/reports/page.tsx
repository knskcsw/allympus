"use client";

import { useState, useCallback } from "react";
import { BarChart3 } from "lucide-react";
import { useReportData } from "@/hooks/useReportData";
import {
  SummaryCards,
  DailyBreakdownTable,
  WbsSummaryTable,
  MonthNavigator,
} from "@/components/reports";

export default function ReportsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { report, isLoading } = useReportData(year, month);

  const handleExportCSV = useCallback(() => {
    window.open(
      `/api/reports?year=${year}&month=${month}&type=month&export=csv`,
      "_blank"
    );
  }, [year, month]);

  if (isLoading || !report) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>
        <MonthNavigator
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={report.summary} />

      {/* Daily Breakdown and WBS Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <DailyBreakdownTable dailyData={report.dailyData} />
        <WbsSummaryTable wbsSummary={report.wbsSummary} />
      </div>
    </div>
  );
}
