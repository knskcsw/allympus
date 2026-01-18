"use client";

import { useCallback, useState } from "react";
import { MoonStar } from "lucide-react";
import {
  SleepStatsCards,
  WeekdayPatternCard,
  MonthlyLogTable,
  MonthNavigator,
  MonthlyTrendCard,
  useSleepData,
} from "@/components/sleep";

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">Loading...</div>
  );
}

function PageHeader({
  currentDate,
  onDateChange,
}: {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <MoonStar className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Sleep</h1>
        </div>
      </div>
      <MonthNavigator currentDate={currentDate} onDateChange={onDateChange} />
    </div>
  );
}

export default function SleepPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const { isLoading, statistics } = useSleepData(currentDate);

  if (isLoading) {
    return <LoadingState />;
  }

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
  } = statistics;

  return (
    <div className="space-y-6">
      <PageHeader currentDate={currentDate} onDateChange={handleDateChange} />

      <SleepStatsCards
        averageHours={averageHours}
        totalHours={totalHours}
        recordedCount={recordedCount}
        maxHours={maxHours}
        minHours={minHours}
        hitRate={hitRate}
        missingCount={missingCount}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <MonthlyTrendCard dailyData={dailyData} recentAverage={recentAverage} />
        <WeekdayPatternCard weekdayAverages={weekdayAverages} />
      </div>

      <MonthlyLogTable dailyData={dailyData} recordedCount={recordedCount} />
    </div>
  );
}
