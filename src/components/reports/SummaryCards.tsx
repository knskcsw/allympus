"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinutes, formatSeconds } from "@/lib/utils";
import type { ReportSummary } from "@/types/reports";

interface SummaryCardsProps {
  summary: ReportSummary;
}

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
}

const SummaryCard = memo(function SummaryCard({
  title,
  value,
  description,
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
});

export const SummaryCards = memo(function SummaryCards({
  summary,
}: SummaryCardsProps) {
  const averageMinutes =
    summary.workedDays > 0
      ? Math.floor(summary.totalWorkingMinutes / summary.workedDays)
      : 0;

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <SummaryCard
        title="Days Worked"
        value={`${summary.workedDays} / ${summary.totalDays}`}
        description="days"
      />
      <SummaryCard
        title="Total Working Hours"
        value={formatMinutes(summary.totalWorkingMinutes)}
        description="attendance based"
      />
      <SummaryCard
        title="Tracked Time"
        value={formatSeconds(summary.totalTrackedSeconds)}
        description="time entries"
      />
      <SummaryCard
        title="Average Hours/Day"
        value={formatMinutes(averageMinutes)}
        description="per working day"
      />
    </div>
  );
});
