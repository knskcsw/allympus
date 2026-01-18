"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TARGET_SLEEP_HOURS, formatHours } from "./types";

interface SleepStatsCardsProps {
  averageHours: number;
  totalHours: number;
  recordedCount: number;
  maxHours: number;
  minHours: number;
  hitRate: number;
  missingCount: number;
}

function SleepStatsCardsComponent({
  averageHours,
  totalHours,
  recordedCount,
  maxHours,
  minHours,
  hitRate,
  missingCount,
}: SleepStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average Sleep
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-3xl font-bold">
            {averageHours > 0 ? formatHours(averageHours) : "--"}
          </div>
          <div className="text-xs text-muted-foreground">
            Target {TARGET_SLEEP_HOURS}h
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
            {totalHours > 0 ? formatHours(totalHours) : "--"}
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
              {maxHours > 0 ? formatHours(maxHours) : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Shortest</span>
            <span className="font-semibold">
              {minHours > 0 ? formatHours(minHours) : "--"}
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
              {recordedCount > 0 ? `${Math.round(hitRate)}%` : "--"}
            </div>
            <Badge variant="secondary">Target hit</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Missing {missingCount} nights this month
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const SleepStatsCards = memo(SleepStatsCardsComponent);
