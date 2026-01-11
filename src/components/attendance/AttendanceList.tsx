"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { Attendance } from "@/generated/prisma/client";
import { EditAttendanceDialog } from "./EditAttendanceDialog";

interface AttendanceListProps {
  attendances: Attendance[];
  onUpdate: () => void;
}

function formatDuration(clockIn: Date, clockOut: Date, breakMinutes: number): string {
  const diff = clockOut.getTime() - clockIn.getTime();
  const totalMinutes = Math.floor(diff / 60000) - breakMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function AttendanceList({ attendances, onUpdate }: AttendanceListProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  const handleEdit = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    onUpdate();
  };

  if (attendances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No attendance records found
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Clock In</TableHead>
            <TableHead>Clock Out</TableHead>
            <TableHead>Break</TableHead>
            <TableHead>Working Hours</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
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
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(attendance)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditAttendanceDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        attendance={selectedAttendance}
        onSave={handleSave}
      />
    </>
  );
}
