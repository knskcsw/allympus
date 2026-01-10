"use client";

import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { TimeEntry, Task } from "@/generated/prisma/client";

type TimeEntryWithTask = TimeEntry & { task: Task | null };

interface TimeEntryListProps {
  entries: TimeEntryWithTask[];
  onDelete: (id: string) => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function TimeEntryList({ entries, onDelete }: TimeEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No time entries for today
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Start</TableHead>
          <TableHead>End</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{entry.task?.title || "No task"}</TableCell>
            <TableCell>
              {format(new Date(entry.startTime), "HH:mm")}
            </TableCell>
            <TableCell>
              {entry.endTime ? format(new Date(entry.endTime), "HH:mm") : "-"}
            </TableCell>
            <TableCell>
              {entry.duration ? formatDuration(entry.duration) : "Running..."}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => onDelete(entry.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
