"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Attendance } from "@/generated/prisma/client";

interface EditAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: Attendance | null;
  onSave: () => void;
}

export function EditAttendanceDialog({
  open,
  onOpenChange,
  attendance,
  onSave,
}: EditAttendanceDialogProps) {
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("");
  const [workMode, setWorkMode] = useState("Office");
  const [sleepHours, setSleepHours] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (attendance) {
      setClockIn(
        attendance.clockIn
          ? format(new Date(attendance.clockIn), "HH:mm")
          : ""
      );
      setClockOut(
        attendance.clockOut
          ? format(new Date(attendance.clockOut), "HH:mm")
          : ""
      );
      setBreakMinutes(attendance.breakMinutes?.toString() || "0");
      setWorkMode(attendance.workMode || "Office");
      setSleepHours(
        attendance.sleepHours !== null && attendance.sleepHours !== undefined
          ? attendance.sleepHours.toString()
          : ""
      );
      setNote(attendance.note || "");
    }
  }, [attendance]);

  const handleSave = async () => {
    if (!attendance) return;

    setSaving(true);
    try {
      const date = new Date(attendance.date);
      const clockInDateTime = clockIn
        ? new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            parseInt(clockIn.split(":")[0]),
            parseInt(clockIn.split(":")[1])
          )
        : null;

      const clockOutDateTime = clockOut
        ? new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            parseInt(clockOut.split(":")[0]),
            parseInt(clockOut.split(":")[1])
          )
        : null;

      const res = await fetch(`/api/attendance/${attendance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clockIn: clockInDateTime?.toISOString(),
          clockOut: clockOutDateTime?.toISOString(),
          breakMinutes: parseInt(breakMinutes) || 0,
          workMode,
          sleepHours:
            sleepHours === ""
              ? null
              : Number.isNaN(Number.parseFloat(sleepHours))
                ? null
                : Number.parseFloat(sleepHours),
          note: note || null,
        }),
      });

      if (res.ok) {
        onSave();
        onOpenChange(false);
      } else {
        const error = await res.json();
        console.error("Failed to update attendance:", error);
        alert("出退勤記録の更新に失敗しました");
      }
    } catch (error) {
      console.error("Failed to update attendance:", error);
      alert("出退勤記録の更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (!attendance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>出退勤記録を編集</DialogTitle>
          <DialogDescription>
            {format(new Date(attendance.date), "yyyy年M月d日(E)", {
              locale: ja,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clockIn">出勤時刻</Label>
              <Input
                id="clockIn"
                type="time"
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clockOut">退勤時刻</Label>
              <Input
                id="clockOut"
                type="time"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="breakMinutes">休憩時間（分）</Label>
            <Input
              id="breakMinutes"
              type="number"
              min="0"
              step="1"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workMode">出社形態</Label>
              <Select value={workMode} onValueChange={setWorkMode}>
                <SelectTrigger id="workMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Telework">Telework</SelectItem>
                  <SelectItem value="Out of Office">Out of Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleepHours">睡眠時間（h）</Label>
              <Input
                id="sleepHours"
                type="number"
                min="0"
                step="0.1"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">メモ</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="備考やメモを入力..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
