"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SleepLineChart from "./SleepLineChart";
import { TARGET_SLEEP_HOURS, formatHours, type DailySleepData } from "./types";

interface MonthlyTrendCardProps {
  dailyData: DailySleepData[];
  recentAverage: number;
}

function MonthlyTrendCardComponent({
  dailyData,
  recentAverage,
}: MonthlyTrendCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Monthly Trend</CardTitle>
        <div className="text-xs text-muted-foreground">
          Last 7 average: {recentAverage > 0 ? formatHours(recentAverage) : "--"}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SleepLineChart data={dailyData} targetHours={TARGET_SLEEP_HOURS} />
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--chart-1)]" />
            Sleep hours
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full border border-dashed border-primary/60" />
            Target {TARGET_SLEEP_HOURS}h
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export const MonthlyTrendCard = memo(MonthlyTrendCardComponent);
