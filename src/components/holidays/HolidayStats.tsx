"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Holiday } from "@/generated/prisma/client";
import { calculateHolidayStats } from "@/lib/holidays";

interface HolidayStatsProps {
  holidays: Holiday[];
}

interface StatItemProps {
  label: string;
  value: number;
  highlight?: boolean;
  colorClass?: string;
}

const StatItem = memo(function StatItem({
  label,
  value,
  highlight = false,
  colorClass,
}: StatItemProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`text-2xl font-bold ${
          highlight ? "text-primary" : colorClass || ""
        }`}
      >
        {value}日
      </p>
    </div>
  );
});

export const HolidayStats = memo(function HolidayStats({
  holidays,
}: HolidayStatsProps) {
  const stats = useMemo(() => calculateHolidayStats(holidays), [holidays]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>統計情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem label="定休日" value={stats.weekendCount} />
          <StatItem label="祝日" value={stats.publicHolidayCount} />
          <StatItem label="特別休日" value={stats.specialHolidayCount} />
          <StatItem label="年間休日数" value={stats.annualHolidayCount} highlight />
          <StatItem
            label="有休取得数"
            value={stats.paidLeaveCount}
            colorClass="text-blue-600 dark:text-blue-400"
          />
        </div>
      </CardContent>
    </Card>
  );
});
