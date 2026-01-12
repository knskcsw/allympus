"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfDay } from "date-fns";
import DailyAttendanceBanner from "@/components/daily/DailyAttendanceBanner";
import DailyTaskPanel from "@/components/daily/DailyTaskPanel";
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
import { ChevronDown, ChevronUp } from "lucide-react";

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkInTime, setCheckInTime] = useState(
    format(new Date(), "HH:mm")
  );
  const [workMode, setWorkMode] = useState("Office");
  const [sleepHours, setSleepHours] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routineTitleDraft, setRoutineTitleDraft] = useState("");
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingRoutineTitle, setEditingRoutineTitle] = useState("");
  const [isRoutineSubmitting, setIsRoutineSubmitting] = useState(false);
  const [isRoutineImporting, setIsRoutineImporting] = useState(false);
  const [isRoutineOpen, setIsRoutineOpen] = useState(true);

  const totalWorkingHours = (() => {
    if (!data?.attendance?.clockIn) return null;
    const start = new Date(data.attendance.clockIn);
    const end = data.attendance.clockOut
      ? new Date(data.attendance.clockOut)
      : new Date();
    const breakMinutes = data.attendance.breakMinutes || 0;
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60) - breakMinutes;
    return totalMinutes / 60;
  })();

  // Fetch daily data
  const fetchDailyData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(`/api/daily?date=${dateStr}`);
      const responseText = await response.text();
      if (!response.ok) {
        let message = responseText;
        try {
          message = JSON.parse(responseText).error || responseText;
        } catch {
          // Fallback to raw text when not JSON.
        }
        throw new Error(message || "Failed to fetch daily data");
      }
      const dailyData = responseText ? JSON.parse(responseText) : null;
      setData(dailyData);
    } catch (error) {
      console.error("Failed to fetch daily data:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to fetch daily data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // Fetch projects (for dropdowns)
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      const responseText = await response.text();
      if (!response.ok) {
        let message = responseText;
        try {
          message = JSON.parse(responseText).error || responseText;
        } catch {
          // Fallback to raw text when not JSON.
        }
        throw new Error(message || "Failed to fetch projects");
      }
      const projectsData = responseText ? JSON.parse(responseText) : [];
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

  useEffect(() => {
    setEditingRoutineId(null);
    setEditingRoutineTitle("");
    setRoutineTitleDraft("");
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

  const handleTimeEntryCreate = async (entryData: any) => {
    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      if (response.ok) {
        fetchDailyData();
      } else {
        const error = await response.json();
        console.error("Failed to create time entry:", error);
        alert("稼働実績の作成に失敗しました");
      }
    } catch (error) {
      console.error("Failed to create time entry:", error);
      alert("稼働実績の作成に失敗しました");
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

  const handleRoutineCreate = async () => {
    const title = routineTitleDraft.trim();
    if (!title) return;
    setIsRoutineSubmitting(true);
    try {
      const response = await fetch("/api/morning-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: selectedDate.toISOString(),
        }),
      });

      if (response.ok) {
        setRoutineTitleDraft("");
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to create routine item:", error);
    } finally {
      setIsRoutineSubmitting(false);
    }
  };

  const handleRoutineImport = async () => {
    if (isRoutineImporting) return;
    const hasExisting = routineItems.length > 0;
    if (
      hasExisting &&
      !confirm("既存のルーティンをテンプレートで上書きしますか？")
    ) {
      return;
    }
    setIsRoutineImporting(true);
    try {
      const response = await fetch("/api/morning-routine/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(selectedDate, "yyyy-MM-dd"),
          overwrite: hasExisting,
        }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        let message = responseText;
        try {
          message = JSON.parse(responseText).error || responseText;
        } catch {
          // Fallback to raw text when not JSON.
        }
        alert(message || "テンプレートの取り込みに失敗しました");
        return;
      }
      await fetchDailyData();
      setIsRoutineOpen(true);
    } catch (error) {
      console.error("Failed to import routine template:", error);
      alert("テンプレートの取り込みに失敗しました");
    } finally {
      setIsRoutineImporting(false);
    }
  };

  const handleRoutineEditStart = (id: string, title: string) => {
    setEditingRoutineId(id);
    setEditingRoutineTitle(title);
  };

  const handleRoutineEditCancel = () => {
    setEditingRoutineId(null);
    setEditingRoutineTitle("");
  };

  const handleRoutineEditSave = async (id: string) => {
    const title = editingRoutineTitle.trim();
    if (!title) return;
    setIsRoutineSubmitting(true);
    try {
      const response = await fetch(`/api/morning-routine/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        handleRoutineEditCancel();
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to update routine item:", error);
    } finally {
      setIsRoutineSubmitting(false);
    }
  };

  const handleRoutineDelete = async (id: string) => {
    if (!confirm("このルーティンを削除してもよろしいですか？")) return;
    setIsRoutineSubmitting(true);
    try {
      const response = await fetch(`/api/morning-routine/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (editingRoutineId === id) {
          handleRoutineEditCancel();
        }
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to delete routine item:", error);
    } finally {
      setIsRoutineSubmitting(false);
    }
  };


  const today = startOfDay(new Date());
  const selectedStart = startOfDay(selectedDate);
  const isFutureDate = selectedStart > today;
  const hasCheckedIn = Boolean(data?.attendance?.clockIn);
  const routineItems = data?.morningRoutine || [];
  const isRoutineComplete =
    routineItems.length > 0 && routineItems.every((item: any) => item.completed);
  const showNormalView = hasCheckedIn;
  const canClockOut =
    showNormalView && selectedStart.getTime() === today.getTime();

  useEffect(() => {
    setIsRoutineOpen(!isRoutineComplete);
  }, [isRoutineComplete]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm">読み込み中...</div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center h-screen px-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>読み込みに失敗しました</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button onClick={fetchDailyData}>再読み込み</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm">データが見つかりません</div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-4 p-6 min-h-screen text-sm ${
        isRoutineComplete
          ? ""
          : "bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100"
      }`}
    >

      {/* Top: Attendance Banner with Date Navigation */}
      <DailyAttendanceBanner
        attendance={data.attendance}
        currentDate={selectedDate}
        onDateChange={handleDateChange}
        maxDate={today}
        onClockOut={handleClockOut}
        showClockOut={canClockOut}
        onAttendanceUpdated={fetchDailyData}
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
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[35%_65%]">
            <Card
              className={
                isRoutineComplete ? "" : "border-amber-200 bg-amber-50/70"
              }
            >
              <CardHeader
                className={`flex flex-row items-center justify-between ${
                  isRoutineOpen ? "" : "py-2"
                }`}
              >
                <CardTitle className={isRoutineOpen ? "" : "text-sm"}>
                  Morning Routine
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRoutineImport}
                    disabled={isRoutineImporting}
                  >
                    {isRoutineImporting ? "取り込み中..." : "Import"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsRoutineOpen((prev) => !prev)}
                  >
                    {isRoutineOpen ? (
                      <span className="flex items-center gap-1">
                        折りたたむ
                        <ChevronUp className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        開く
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {isRoutineOpen && (
                <CardContent className="space-y-4">
                  {routineItems.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      ルーティンを追加してください
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {routineItems.map((item: any) => {
                        const isEditing = editingRoutineId === item.id;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 text-sm"
                          >
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={(checked) =>
                                handleRoutineToggle(item.id, Boolean(checked))
                              }
                            />
                            {isEditing ? (
                              <Input
                                value={editingRoutineTitle}
                                onChange={(e) =>
                                  setEditingRoutineTitle(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleRoutineEditSave(item.id);
                                  }
                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    handleRoutineEditCancel();
                                  }
                                }}
                              />
                            ) : (
                              <span
                                className={
                                  item.completed
                                    ? "text-muted-foreground line-through"
                                    : ""
                                }
                              >
                                {item.title}
                              </span>
                            )}
                            <div className="ml-auto flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleRoutineEditSave(item.id)
                                    }
                                    disabled={isRoutineSubmitting}
                                  >
                                    保存
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleRoutineEditCancel}
                                    disabled={isRoutineSubmitting}
                                  >
                                    キャンセル
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleRoutineEditStart(item.id, item.title)
                                    }
                                    disabled={isRoutineSubmitting}
                                  >
                                    編集
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRoutineDelete(item.id)}
                                    disabled={isRoutineSubmitting}
                                  >
                                    削除
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={routineTitleDraft}
                      onChange={(e) => setRoutineTitleDraft(e.target.value)}
                      placeholder="新しいルーティンを追加"
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRoutineCreate();
                        }
                      }}
                    />
                    <Button
                      onClick={handleRoutineCreate}
                      disabled={isRoutineSubmitting}
                    >
                      追加
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
            <WbsSummaryCard
              summary={data.wbsSummary || []}
              totalWorkingHours={totalWorkingHours}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[35%_65%]">
            {/* Left: Tasks */}
            <div>
              <DailyTaskPanel
                date={selectedDate}
                tasks={data.dailyTasks || []}
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
                onTaskStatusChange={handleTaskStatusChange}
              />
            </div>

            {/* Right: Time Entries */}
            <div className="space-y-4">
              <DailyTimeEntryTable
                entries={data.timeEntries || []}
                dailyTasks={data.dailyTasks || []}
                routineTasks={data.routineTasks || []}
                projects={projects}
                onUpdate={handleTimeEntryUpdate}
                onDelete={handleTimeEntryDelete}
                onCreate={handleTimeEntryCreate}
                selectedDate={selectedDate}
                attendanceClockIn={data.attendance?.clockIn ?? null}
                attendanceClockOut={data.attendance?.clockOut ?? null}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
