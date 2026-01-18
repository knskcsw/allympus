"use client";

import { memo } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TARGET_SLEEP_HOURS, formatHours, type DailySleepData } from "./types";

type SleepStatus = "no-entry" | "below-target" | "on-track";

function getSleepStatus(hours: number | null): SleepStatus {
  if (hours === null) return "no-entry";
  if (hours < TARGET_SLEEP_HOURS) return "below-target";
  return "on-track";
}

function getStatusLabel(status: SleepStatus): string {
  switch (status) {
    case "no-entry":
      return "No entry";
    case "below-target":
      return "Below target";
    case "on-track":
      return "On track";
  }
}

interface MonthlyLogRowProps {
  entry: DailySleepData;
}

const MonthlyLogRow = memo(function MonthlyLogRow({ entry }: MonthlyLogRowProps) {
  const status = getSleepStatus(entry.hours);
  const statusLabel = getStatusLabel(status);

  return (
    <TableRow>
      <TableCell>
        {format(entry.date, "yyyy/MM/dd (E)", { locale: ja })}
      </TableCell>
      <TableCell>
        {entry.hours !== null ? formatHours(entry.hours) : "--"}
      </TableCell>
      <TableCell>{statusLabel}</TableCell>
    </TableRow>
  );
});

interface MonthlyLogTableProps {
  dailyData: DailySleepData[];
  recordedCount: number;
}

function MonthlyLogTableComponent({
  dailyData,
  recordedCount,
}: MonthlyLogTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Log</CardTitle>
        <span className="text-xs text-muted-foreground">
          {recordedCount} nights recorded
        </span>
      </CardHeader>
      <CardContent>
        {recordedCount === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No sleep records for this month yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Sleep</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyData.map((entry) => (
                <MonthlyLogRow key={entry.date.toISOString()} entry={entry} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export const MonthlyLogTable = memo(MonthlyLogTableComponent);
