"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Pencil } from "lucide-react";
import { format, addDays, subDays, startOfDay, startOfToday } from "date-fns";
import { ja } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Attendance {
  id: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  breakMinutes: number;
  workMode?: string | null;
  sleepHours?: number | null;
  note: string | null;
}

interface DailyAttendanceBannerProps {
  attendance: Attendance | null;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  maxDate?: Date;
  onClockOut?: () => void;
  showClockOut?: boolean;
  onAttendanceUpdated?: () => void;
  additionalBreakMinutes?: number;
}

export default function DailyAttendanceBanner({
  attendance,
  currentDate,
  onDateChange,
  maxDate,
  onClockOut,
  showClockOut = false,
  onAttendanceUpdated,
  additionalBreakMinutes = 0,
}: DailyAttendanceBannerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState({
    clockIn: "",
    clockOut: "",
    breakMinutes: "",
    workMode: "",
    sleepHours: "",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getClockRange = () => {
    if (!attendance || !attendance.clockIn) return 0;

    const start = new Date(attendance.clockIn);
    const end = attendance.clockOut
      ? new Date(attendance.clockOut)
      : new Date();
    return (end.getTime() - start.getTime()) / (1000 * 60);
  };

  const totalBreakMinutes =
    (attendance?.breakMinutes ?? 0) + additionalBreakMinutes;
  const stayMinutes = getClockRange();
  const workingHours =
    stayMinutes > 0
      ? Math.max(0, (stayMinutes - totalBreakMinutes) / 60)
      : 0;
  const stayHours = stayMinutes > 0 ? stayMinutes / 60 : 0;

  const handlePrevDay = () => {
    onDateChange(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    const nextDate = addDays(currentDate, 1);
    if (maxDate && startOfDay(nextDate) > startOfDay(maxDate)) return;
    onDateChange(nextDate);
  };

  const handleToday = () => {
    onDateChange(startOfToday());
  };

  const isToday =
    format(currentDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const currentDay = startOfDay(currentDate);
  const maxDay = maxDate ? startOfDay(maxDate) : null;
  const isNextDisabled = maxDay ? addDays(currentDay, 1) > maxDay : false;
  const isFutureDate = maxDay ? currentDay > maxDay : false;

  useEffect(() => {
    if (!attendance) {
      setFormState({
        clockIn: "",
        clockOut: "",
        breakMinutes: "",
        workMode: "",
        sleepHours: "",
        note: "",
      });
      return;
    }
    setFormState({
      clockIn: attendance.clockIn
        ? format(new Date(attendance.clockIn), "HH:mm")
        : "",
      clockOut: attendance.clockOut
        ? format(new Date(attendance.clockOut), "HH:mm")
        : "",
      breakMinutes:
        attendance.breakMinutes !== null &&
        attendance.breakMinutes !== undefined
          ? String(attendance.breakMinutes)
          : "",
      workMode: attendance.workMode || "",
      sleepHours:
        attendance.sleepHours !== null &&
        attendance.sleepHours !== undefined
          ? String(attendance.sleepHours)
          : "",
      note: attendance.note || "",
    });
  }, [attendance]);

  const handleAttendanceUpdate = async () => {
    if (!attendance?.id) return;
    if (!formState.clockIn) {
      alert("出勤時間を入力してください");
      return;
    }
    setIsSubmitting(true);
    const toDateTime = (time: string) => {
      if (!time) return null;
      const [hours, minutes] = time.split(":").map(Number);
      const date = new Date(currentDate);
      date.setHours(hours, minutes, 0, 0);
      return date.toISOString();
    };
    try {
      const response = await fetch(`/api/attendance/${attendance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clockIn: toDateTime(formState.clockIn),
          clockOut: formState.clockOut ? toDateTime(formState.clockOut) : null,
          breakMinutes:
            formState.breakMinutes === "" ? 0 : Number(formState.breakMinutes),
          workMode: formState.workMode || null,
          sleepHours:
            formState.sleepHours === "" ? null : Number(formState.sleepHours),
          note: formState.note || null,
        }),
      });
      if (response.ok) {
        onAttendanceUpdated?.();
        setIsEditing(false);
      } else {
        const error = await response.json();
        console.error("Failed to update attendance:", error);
        alert("勤怠の更新に失敗しました");
      }
    } catch (error) {
      console.error("Failed to update attendance:", error);
      alert("勤怠の更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="py-2">
        <div className="flex items-center justify-between">
          {/* Left: Date Navigation - Reportsページと同じスタイル */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[160px] text-center">
              {format(currentDate, "yyyy年 M月d日", { locale: ja })} (
              {format(currentDate, "E", { locale: ja })})
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextDay}
              disabled={isNextDisabled}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant={isToday ? "secondary" : "outline"}
              onClick={handleToday}
              size="sm"
              disabled={isToday}
            >
              <Calendar className="h-4 w-4 mr-1" />
              今日
            </Button>
          </div>

          {/* Right: Attendance Info - よりコンパクトに */}
          <div className="flex items-center gap-3 text-xs leading-tight">
            {attendance ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">出勤:</span>
                  <span className="font-medium">
                    {attendance.clockIn
                      ? format(new Date(attendance.clockIn), "HH:mm")
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">退勤:</span>
                  <span className="font-medium">
                    {attendance.clockOut
                      ? format(new Date(attendance.clockOut), "HH:mm")
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">休憩:</span>
                  <span className="font-medium">{totalBreakMinutes}分</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">出社形態:</span>
                  <span className="font-medium">
                    {attendance.workMode || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">睡眠:</span>
                  <span className="font-medium">
                    {attendance.sleepHours !== null &&
                    attendance.sleepHours !== undefined
                      ? (() => {
                          const h = Math.floor(attendance.sleepHours);
                          const m = Math.round((attendance.sleepHours - h) * 60);
                          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                        })()
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">滞在:</span>
                  <span className="font-semibold">{stayHours.toFixed(2)}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">総労働:</span>
                  <span className="font-semibold">
                    {workingHours.toFixed(2)}h
                  </span>
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">
                {isFutureDate ? "未来日は表示できません" : "勤怠記録なし"}
              </span>
            )}
            {showClockOut && attendance?.clockIn && !attendance.clockOut && (
              <Button size="sm" onClick={onClockOut}>
                退勤する
              </Button>
            )}
            {attendance && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setIsEditing((prev) => !prev)}
                aria-label={isEditing ? "閉じる" : "編集"}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {attendance && isEditing && (
          <div className="mt-4 border-t pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="editClockIn">出勤時間</Label>
                <Input
                  id="editClockIn"
                  type="time"
                  value={formState.clockIn}
                  onChange={(e) =>
                    setFormState({ ...formState, clockIn: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editClockOut">退勤時間</Label>
                <Input
                  id="editClockOut"
                  type="time"
                  value={formState.clockOut}
                  onChange={(e) =>
                    setFormState({ ...formState, clockOut: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editBreak">休憩（分）</Label>
                <Input
                  id="editBreak"
                  type="number"
                  min="0"
                  step="1"
                  value={formState.breakMinutes}
                  onChange={(e) =>
                    setFormState({ ...formState, breakMinutes: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3 mt-4">
              <div className="space-y-2">
                <Label htmlFor="editWorkMode">出社形態</Label>
                <Select
                  value={formState.workMode || "none"}
                  onValueChange={(value) =>
                    setFormState({
                      ...formState,
                      workMode: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger id="editWorkMode">
                    <SelectValue placeholder="出社形態を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未設定</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Telework">Telework</SelectItem>
                    <SelectItem value="Out of Office">Out of Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSleepHours">睡眠時間</Label>
                <Input
                  id="editSleepHours"
                  type="time"
                  value={formState.sleepHours}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      sleepHours: e.target.value,
                    })
                  }
                  placeholder="例: 07:30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNote">メモ</Label>
                <Input
                  id="editNote"
                  value={formState.note}
                  onChange={(e) =>
                    setFormState({ ...formState, note: e.target.value })
                  }
                  placeholder="任意"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleAttendanceUpdate} disabled={isSubmitting}>
                {isSubmitting ? "更新中..." : "勤怠を更新"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
