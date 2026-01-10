"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit } from "lucide-react";
import type { TimeEntry, Task, Project } from "@/generated/prisma/client";

type TaskWithProject = Task & { project: Project | null };
type TimeEntryWithTask = TimeEntry & { task: TaskWithProject | null };

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
  const [editingEntry, setEditingEntry] = useState<TimeEntryWithTask | null>(null);
  const [editedStartTime, setEditedStartTime] = useState("");
  const [editedEndTime, setEditedEndTime] = useState("");
  const [editedNote, setEditedNote] = useState("");

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No time entries for today
      </div>
    );
  }

  const handleEdit = (entry: TimeEntryWithTask) => {
    setEditingEntry(entry);
    setEditedStartTime(format(new Date(entry.startTime), "HH:mm"));
    setEditedEndTime(entry.endTime ? format(new Date(entry.endTime), "HH:mm") : "");
    setEditedNote(entry.note || "");
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    const startDate = new Date(editingEntry.startTime);
    const [startHours, startMinutes] = editedStartTime.split(":").map(Number);
    const newStartTime = new Date(startDate);
    newStartTime.setHours(startHours, startMinutes, 0, 0);

    let newEndTime = null;
    if (editedEndTime) {
      const [endHours, endMinutes] = editedEndTime.split(":").map(Number);
      newEndTime = new Date(startDate);
      newEndTime.setHours(endHours, endMinutes, 0, 0);
    }

    const updateData: Record<string, unknown> = {
      note: editedNote,
      startTime: newStartTime.toISOString(),
    };

    if (newEndTime) {
      updateData.endTime = newEndTime.toISOString();
    }

    await fetch(`/api/time-entries/${editingEntry.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    setEditingEntry(null);
    // 親コンポーネントのリフレッシュをトリガー
    window.location.reload();
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.task?.title || "No task"}</TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {entry.task?.project?.name || "-"}
                </span>
              </TableCell>
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
                <span className="text-xs text-muted-foreground">
                  {entry.note || "-"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(entry)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task</Label>
              <Input
                value={editingEntry?.task?.title || "No task"}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Input
                value={editingEntry?.task?.project?.name || "-"}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={editedStartTime}
                onChange={(e) => setEditedStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={editedEndTime}
                onChange={(e) => setEditedEndTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                value={editedNote}
                onChange={(e) => setEditedNote(e.target.value)}
                placeholder="Add a note..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
