"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfDay } from "date-fns";
import DailyAttendanceBanner from "@/components/daily/DailyAttendanceBanner";
import DailyTaskPanel from "@/components/daily/DailyTaskPanel";
import StopwatchIntegrated from "@/components/daily/StopwatchIntegrated";
import DailyTimeEntryTable from "@/components/daily/DailyTimeEntryTable";
import WbsSummaryCard from "@/components/daily/WbsSummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkInTime, setCheckInTime] = useState(
    format(new Date(), "HH:mm")
  );
  const [workMode, setWorkMode] = useState("Office");
  const [sleepHours, setSleepHours] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch daily data
  const fetchDailyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(`/api/daily?date=${dateStr}`);
      const dailyData = await response.json();
      setData(dailyData);
    } catch (error) {
      console.error("Failed to fetch daily data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // Fetch projects (for dropdowns)
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      const projectsData = await response.json();
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  useEffect(() => {
    fetchDailyData();
    fetchProjects();
  }, [fetchDailyData, fetchProjects]);

  useEffect(() => {
    const today = startOfDay(new Date());
    if (startOfDay(selectedDate).getTime() === today.getTime()) {
      setCheckInTime(format(new Date(), "HH:mm"));
    }
  }, [selectedDate]);

  // Task handlers
  const handleTaskCreate = async (taskData: any) => {
    try {
      const response = await fetch("/api/daily-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskData,
          date: selectedDate,
        }),
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleTaskUpdate = async (id: string, taskData: any) => {
    try {
      const response = await fetch(`/api/daily-tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleTaskDelete = async (id: string) => {
    if (!confirm("このタスクを削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/daily-tasks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleTaskStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/daily-tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  // TimeEntry handlers
  const handleTimeEntryUpdate = async (id: string, entryData: any) => {
    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to update time entry:", error);
    }
  };

  const handleTimeEntryDelete = async (id: string) => {
    if (!confirm("この稼働実績を削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to delete time entry:", error);
    }
  };

  // Date change handler
  const handleDateChange = (newDate: Date) => {
    const today = startOfDay(new Date());
    if (startOfDay(newDate) > today) return;
    setSelectedDate(newDate);
  };

  const handleCheckIn = async () => {
    if (!checkInTime || sleepHours === "") {
      alert("出勤時間と睡眠時間を入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(selectedDate, "yyyy-MM-dd"),
          clockIn: checkInTime,
          workMode,
          sleepHours,
        }),
      });

      if (response.ok) {
        fetchDailyData();
      } else {
        const error = await response.json();
        console.error("Failed to check in:", error);
        alert("チェックインに失敗しました");
      }
    } catch (error) {
      console.error("Failed to check in:", error);
      alert("チェックインに失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clockOut" }),
      });

      if (response.ok) {
        fetchDailyData();
      } else {
        const error = await response.json();
        console.error("Failed to clock out:", error);
        alert("退勤に失敗しました");
      }
    } catch (error) {
      console.error("Failed to clock out:", error);
      alert("退勤に失敗しました");
    }
  };

  const handleRoutineToggle = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/morning-routine/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to update routine item:", error);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const selectedStart = startOfDay(selectedDate);
  const isFutureDate = selectedStart > today;
  const hasCheckedIn = Boolean(data.attendance?.clockIn);
  const routineItems = data.morningRoutine || [];
  const isRoutineComplete =
    routineItems.length > 0 && routineItems.every((item: any) => item.completed);
  const showNormalView = hasCheckedIn && isRoutineComplete;
  const canClockOut =
    showNormalView && selectedStart.getTime() === today.getTime();

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-3xl font-bold">Daily</h1>

      {/* Top: Attendance Banner with Date Navigation */}
      <DailyAttendanceBanner
        attendance={data.attendance}
        currentDate={selectedDate}
        onDateChange={handleDateChange}
        maxDate={today}
        onClockOut={handleClockOut}
        showClockOut={canClockOut}
      />

      {isFutureDate ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            未来の日付は表示できません
          </CardContent>
        </Card>
      ) : !hasCheckedIn ? (
        <Card>
          <CardHeader>
            <CardTitle>チェックイン</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="clockIn">出勤時間</Label>
                <Input
                  id="clockIn"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  required
                />
              </div>
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
                  placeholder="例: 6.5"
                  required
                />
              </div>
            </div>
            <Button onClick={handleCheckIn} disabled={isSubmitting}>
              {isSubmitting ? "チェックイン中..." : "チェックイン"}
            </Button>
          </CardContent>
        </Card>
      ) : !isRoutineComplete ? (
        <Card>
          <CardHeader>
            <CardTitle>Morning Routine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routineItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                ルーティンを準備中です...
              </div>
            ) : (
              <div className="space-y-3">
                {routineItems.map((item: any) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) =>
                        handleRoutineToggle(item.id, Boolean(checked))
                      }
                    />
                    <span
                      className={
                        item.completed
                          ? "text-muted-foreground line-through"
                          : ""
                      }
                    >
                      {item.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              すべて完了するとDailyが解放されます
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Tasks (col-span-3) */}
          <div className="col-span-3">
            <DailyTaskPanel
              date={selectedDate}
              tasks={data.dailyTasks || []}
              onTaskCreate={handleTaskCreate}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onTaskStatusChange={handleTaskStatusChange}
            />
          </div>

          {/* Middle: Time Tracking & Entries (col-span-6) */}
          <div className="col-span-6 space-y-4">
            <StopwatchIntegrated
              dailyTasks={data.dailyTasks || []}
              onEntryChange={fetchDailyData}
            />
            <DailyTimeEntryTable
              entries={data.timeEntries || []}
              dailyTasks={data.dailyTasks || []}
              projects={projects}
              onUpdate={handleTimeEntryUpdate}
              onDelete={handleTimeEntryDelete}
            />
          </div>

          {/* Right: Summary (col-span-3) */}
          <div className="col-span-3">
            <WbsSummaryCard summary={data.wbsSummary || []} />
          </div>
        </div>
      )}
    </div>
  );
}
