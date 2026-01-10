"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Attendance } from "@/generated/prisma/client";

interface AttendanceListProps {
  attendances: Attendance[];
}

function formatDuration(clockIn: Date, clockOut: Date, breakMinutes: number): string {
  const diff = clockOut.getTime() - clockIn.getTime();
  const totalMinutes = Math.floor(diff / 60000) - breakMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function AttendanceList({ attendances }: AttendanceListProps) {
  if (attendances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No attendance records found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Clock In</TableHead>
          <TableHead>Clock Out</TableHead>
          <TableHead>Break</TableHead>
          <TableHead>Working Hours</TableHead>
          <TableHead>Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attendances.map((attendance) => (
          <TableRow key={attendance.id}>
            <TableCell>
              {format(new Date(attendance.date), "yyyy/MM/dd (E)", {
                locale: ja,
              })}
            </TableCell>
            <TableCell>
              {attendance.clockIn
                ? format(new Date(attendance.clockIn), "HH:mm")
                : "-"}
            </TableCell>
            <TableCell>
              {attendance.clockOut
                ? format(new Date(attendance.clockOut), "HH:mm")
                : "-"}
            </TableCell>
            <TableCell>{attendance.breakMinutes}m</TableCell>
            <TableCell>
              {attendance.clockIn && attendance.clockOut
                ? formatDuration(
                    new Date(attendance.clockIn),
                    new Date(attendance.clockOut),
                    attendance.breakMinutes
                  )
                : "-"}
            </TableCell>
            <TableCell>{attendance.note || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
