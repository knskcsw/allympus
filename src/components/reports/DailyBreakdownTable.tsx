"use client";

import { memo, useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMinutes, formatSeconds } from "@/lib/utils";
import type { DailyData } from "@/types/reports";

interface DailyBreakdownTableProps {
  dailyData: DailyData[];
}

interface DailyRowProps {
  day: DailyData;
}

const DailyRow = memo(function DailyRow({ day }: DailyRowProps) {
  return (
    <TableRow>
      <TableCell>{format(new Date(day.date), "MM/dd")}</TableCell>
      <TableCell>{day.dayOfWeek}</TableCell>
      <TableCell>{formatMinutes(day.workingMinutes)}</TableCell>
      <TableCell>{formatSeconds(day.trackedSeconds)}</TableCell>
    </TableRow>
  );
});

export const DailyBreakdownTable = memo(function DailyBreakdownTable({
  dailyData,
}: DailyBreakdownTableProps) {
  const filteredData = useMemo(
    () => dailyData.filter((d) => d.hasAttendance),
    [dailyData]
  );

  return (
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
            {filteredData.map((day) => (
              <DailyRow key={day.date} day={day} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});
