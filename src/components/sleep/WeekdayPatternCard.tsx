"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WEEKDAY_LABELS, formatHours } from "./types";

interface WeekdayBarProps {
  label: string;
  value: number;
  maxValue: number;
}

const WeekdayBar = memo(function WeekdayBar({
  label,
  value,
  maxValue,
}: WeekdayBarProps) {
  const widthPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 text-xs text-muted-foreground">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary/70"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <div className="w-10 text-right text-xs font-medium">
        {value > 0 ? formatHours(value) : "--"}
      </div>
    </div>
  );
});

interface WeekdayPatternCardProps {
  weekdayAverages: number[];
}

function WeekdayPatternCardComponent({
  weekdayAverages,
}: WeekdayPatternCardProps) {
  const maxWeekdayValue = useMemo(
    () => Math.max(1, ...weekdayAverages),
    [weekdayAverages]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekday Pattern</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {weekdayAverages.map((value, index) => (
          <WeekdayBar
            key={WEEKDAY_LABELS[index]}
            label={WEEKDAY_LABELS[index]}
            value={value}
            maxValue={maxWeekdayValue}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export const WeekdayPatternCard = memo(WeekdayPatternCardComponent);
