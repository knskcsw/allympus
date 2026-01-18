"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MonthlySummary } from "@/types/monthly";

interface SummaryItemProps {
  label: string;
  value: string;
  subtext?: string;
  isHighlighted?: boolean;
  isLoading?: boolean;
}

const SummaryItem = memo(function SummaryItem({
  label,
  value,
  subtext,
  isHighlighted = false,
  isLoading = false,
}: SummaryItemProps) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div
        className={cn(
          "text-2xl font-bold",
          isHighlighted && "text-orange-600 dark:text-orange-400"
        )}
      >
        {isLoading ? "--" : value}
      </div>
      {subtext && !isLoading && (
        <div className="text-xs text-muted-foreground">{subtext}</div>
      )}
    </div>
  );
});

interface MonthlySummaryCardProps {
  summary: MonthlySummary;
  isLoading: boolean;
}

function formatHours(hours: number | null): string {
  if (hours === null) return "--";
  return `${hours.toFixed(1)}h`;
}

function formatMinutesAsHoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export const MonthlySummaryCard = memo(function MonthlySummaryCard({
  summary,
  isLoading,
}: MonthlySummaryCardProps) {
  const {
    workedDays,
    totalMinutes,
    standardHours,
    expectedHours,
    overtimeHours,
    forecastOvertimeHours,
    forecastActualHours,
    vacationHours,
  } = summary;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SummaryItem
          label="Days Worked"
          value={`${workedDays} days`}
        />

        <SummaryItem
          label="Total Hours"
          value={formatMinutesAsHoursMinutes(totalMinutes)}
        />

        <SummaryItem
          label="Standard Hours"
          value={formatHours(standardHours)}
          isLoading={isLoading}
        />

        <SummaryItem
          label="Standard Hours (minus vacation)"
          value={formatHours(expectedHours)}
          subtext={
            expectedHours !== null
              ? `Vacation: ${vacationHours.toFixed(1)}h`
              : undefined
          }
          isLoading={isLoading}
        />

        <SummaryItem
          label="Overtime"
          value={formatHours(overtimeHours)}
          isHighlighted={overtimeHours !== null && overtimeHours > 0}
          isLoading={isLoading}
        />

        <SummaryItem
          label="Overtime Forecast"
          value={formatHours(forecastOvertimeHours)}
          subtext={
            forecastActualHours !== null
              ? `Forecast total: ${forecastActualHours.toFixed(1)}h`
              : undefined
          }
          isHighlighted={forecastOvertimeHours !== null && forecastOvertimeHours > 0}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
});
