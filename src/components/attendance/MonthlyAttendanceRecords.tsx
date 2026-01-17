"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Pencil, Trash2, X } from "lucide-react";
import type { Attendance } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type DraftAttendance = {
  clockIn: string;
  clockOut: string;
  breakMinutes: string;
  workMode: string;
  sleepHours: string;
  note: string;
};

interface MonthlyAttendanceRecordsProps {
  attendances: Attendance[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onUpdate: () => void | Promise<void>;
}

const DEFAULT_WORK_MODE = "Office";

const toTimeValue = (value: Date | null) => (value ? format(value, "HH:mm") : "");

const buildDateTime = (date: Date, time: string) => {
  if (!time) return null;
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number.parseInt(hourStr ?? "", 10);
  const minute = Number.parseInt(minuteStr ?? "", 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute
  ).toISOString();
};

const formatDuration = (clockIn: Date, clockOut: Date, breakMinutes: number) => {
  const diff = clockOut.getTime() - clockIn.getTime();
  const totalMinutes = Math.floor(diff / 60000) - breakMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

export function MonthlyAttendanceRecords({
  attendances,
  selectedDate,
  onSelectDate,
  onUpdate,
}: MonthlyAttendanceRecordsProps) {
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftAttendance | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedAttendance = useMemo(() => {
    if (!selectedDate) return null;
    return (
      attendances.find((attendance) =>
        isSameDay(new Date(attendance.date), selectedDate)
      ) ?? null
    );
  }, [attendances, selectedDate]);

  const isSelectedDateMissing = !!selectedDate && !selectedAttendance;

  const startEdit = (attendance: Attendance) => {
    setEditingId(attendance.id);
    setDraft({
      clockIn: toTimeValue(attendance.clockIn ? new Date(attendance.clockIn) : null),
      clockOut: toTimeValue(attendance.clockOut ? new Date(attendance.clockOut) : null),
      breakMinutes: String(attendance.breakMinutes ?? 0),
      workMode: attendance.workMode ?? DEFAULT_WORK_MODE,
      sleepHours:
        attendance.sleepHours !== null && attendance.sleepHours !== undefined
          ? String(attendance.sleepHours)
          : "",
      note: attendance.note ?? "",
    });
  };

  const stopEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  useEffect(() => {
    if (!selectedDate) return;
    if (!selectedAttendance) {
      stopEdit();
      return;
    }
    startEdit(selectedAttendance);
    const row = rowRefs.current[selectedAttendance.id];
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedDate, selectedAttendance]);

  const handleSave = async (attendance: Attendance) => {
    if (!draft) return;
    setIsSaving(true);
    try {
      const date = new Date(attendance.date);
      const res = await fetch(`/api/attendance/${attendance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clockIn: buildDateTime(date, draft.clockIn),
          clockOut: buildDateTime(date, draft.clockOut),
          breakMinutes: Number.parseInt(draft.breakMinutes, 10) || 0,
          workMode: draft.workMode || null,
          sleepHours:
            draft.sleepHours === ""
              ? null
              : Number.isNaN(Number.parseFloat(draft.sleepHours))
                ? null
                : Number.parseFloat(draft.sleepHours),
          note: draft.note || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        console.error("Failed to update attendance:", error);
        alert("出退勤記録の更新に失敗しました");
        return;
      }

      await onUpdate();
      stopEdit();
    } catch (error) {
      console.error("Failed to update attendance:", error);
      alert("出退勤記録の更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (attendance: Attendance) => {
    const dateLabel = format(new Date(attendance.date), "yyyy/MM/dd (E)", {
      locale: ja,
    });
    if (!confirm(`${dateLabel} のレコードを削除してええ？`)) return;

    try {
      const res = await fetch(`/api/attendance/${attendance.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        console.error("Failed to delete attendance:", error);
        alert("出退勤記録の削除に失敗しました");
        return;
      }

      await onUpdate();
      if (editingId === attendance.id) {
        stopEdit();
      }
    } catch (error) {
      console.error("Failed to delete attendance:", error);
      alert("出退勤記録の削除に失敗しました");
    }
  };

  if (attendances.length === 0) {
    return (
      <div className="space-y-3">
        {selectedDate && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            {format(selectedDate, "yyyy/MM/dd (E)", { locale: ja })} のレコードは未作成やで〜
          </div>
        )}
        <div className="text-center py-8 text-muted-foreground">
          No attendance records found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isSelectedDateMissing && selectedDate && (
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          {format(selectedDate, "yyyy/MM/dd (E)", { locale: ja })} のレコードは未作成やで〜
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Date</TableHead>
            <TableHead className="whitespace-nowrap">Clock In</TableHead>
            <TableHead className="whitespace-nowrap">Clock Out</TableHead>
            <TableHead className="whitespace-nowrap">Break</TableHead>
            <TableHead className="whitespace-nowrap">Work Mode</TableHead>
            <TableHead className="whitespace-nowrap">Sleep</TableHead>
            <TableHead className="whitespace-nowrap">Working Hours</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="w-[120px] whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {attendances.map((attendance) => {
            const date = new Date(attendance.date);
            const isSelected =
              !!selectedDate && isSameDay(new Date(attendance.date), selectedDate);
            const isEditing = editingId === attendance.id;

            return (
              <TableRow
                key={attendance.id}
                ref={(node) => {
                  rowRefs.current[attendance.id] = node;
                }}
                className={cn("cursor-pointer", isSelected && "bg-primary/5")}
                onClick={() => {
                  onSelectDate(date);
                  if (!isEditing) startEdit(attendance);
                }}
              >
                <TableCell className="whitespace-nowrap">
                  {format(date, "yyyy/MM/dd (E)", { locale: ja })}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  {isEditing ? (
                    <Input
                      type="time"
                      value={draft?.clockIn ?? ""}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev ? { ...prev, clockIn: e.target.value } : prev
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-[110px]"
                    />
                  ) : attendance.clockIn ? (
                    format(new Date(attendance.clockIn), "HH:mm")
                  ) : (
                    "-"
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  {isEditing ? (
                    <Input
                      type="time"
                      value={draft?.clockOut ?? ""}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev ? { ...prev, clockOut: e.target.value } : prev
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-[110px]"
                    />
                  ) : attendance.clockOut ? (
                    format(new Date(attendance.clockOut), "HH:mm")
                  ) : (
                    "-"
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={draft?.breakMinutes ?? "0"}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev
                            ? { ...prev, breakMinutes: e.target.value }
                            : prev
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-[90px] text-right tabular-nums"
                    />
                  ) : (
                    `${attendance.breakMinutes}m`
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  {isEditing ? (
                    <Select
                      value={draft?.workMode ?? DEFAULT_WORK_MODE}
                      onValueChange={(value) =>
                        setDraft((prev) =>
                          prev ? { ...prev, workMode: value } : prev
                        )
                      }
                    >
                      <SelectTrigger
                        className="h-9 w-[160px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent onClick={(e) => e.stopPropagation()}>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Telework">Telework</SelectItem>
                        <SelectItem value="Out of Office">Out of Office</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    attendance.workMode || "-"
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={draft?.sleepHours ?? ""}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev ? { ...prev, sleepHours: e.target.value } : prev
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-[90px] text-right tabular-nums"
                    />
                  ) : attendance.sleepHours !== null &&
                    attendance.sleepHours !== undefined ? (
                    `${attendance.sleepHours}h`
                  ) : (
                    "-"
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  {attendance.clockIn && attendance.clockOut
                    ? formatDuration(
                        new Date(attendance.clockIn),
                        new Date(attendance.clockOut),
                        attendance.breakMinutes
                      )
                    : "-"}
                </TableCell>

                <TableCell className="min-w-[240px]">
                  {isEditing ? (
                    <Textarea
                      value={draft?.note ?? ""}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev ? { ...prev, note: e.target.value } : prev
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="min-h-[2.25rem] resize-y"
                      placeholder="備考やメモ..."
                    />
                  ) : (
                    attendance.note || "-"
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap">
                  {isEditing ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSave(attendance)}
                        disabled={isSaving}
                        aria-label="Save"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={stopEdit}
                        disabled={isSaving}
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(attendance)}
                        disabled={isSaving}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(attendance)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(attendance)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

