"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSeconds } from "@/lib/utils";

interface WbsSummaryTableProps {
  wbsSummary: Record<string, number>;
}

interface WbsRowProps {
  wbs: string;
  seconds: number;
}

const WbsRow = memo(function WbsRow({ wbs, seconds }: WbsRowProps) {
  return (
    <TableRow>
      <TableCell>{wbs}</TableCell>
      <TableCell>{formatSeconds(seconds)}</TableCell>
    </TableRow>
  );
});

export const WbsSummaryTable = memo(function WbsSummaryTable({
  wbsSummary,
}: WbsSummaryTableProps) {
  const sortedEntries = useMemo(
    () => Object.entries(wbsSummary).sort((a, b) => b[1] - a[1]),
    [wbsSummary]
  );

  const isEmpty = sortedEntries.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time by Project/WBS</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="text-center py-8 text-muted-foreground">
            No tracked time for this period
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project - WBS</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map(([wbs, seconds]) => (
                <WbsRow key={wbs} wbs={wbs} seconds={seconds} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
});
