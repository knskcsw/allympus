"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface TimeEntry {
  id: string;
  dailyTaskId: string | null;
  dailyTask?: { id: string; title: string } | null;
  routineTaskId: string | null;
  routineTask?: { id: string; title: string } | null;
  projectId: string | null;
  project?: { id: string; code: string; name: string; abbreviation: string | null } | null;
  wbsId: string | null;
  wbs?: { id: string; name: string } | null;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  note: string | null;
}

interface DailyTimeEntryTableProps {
  entries: TimeEntry[];
  dailyTasks: Array<{ id: string; title: string }>;
  routineTasks: Array<{ id: string; title: string }>;
  projects: Array<{
    id: string;
    code: string;
    name: string;
    wbsList: Array<{ id: string; name: string }>;
  }>;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onCreate: (data: any) => void;
  selectedDate: Date;
  attendanceClockIn?: Date | string | null;
  attendanceClockOut?: Date | string | null;
  workScheduleTemplates?: Array<{ id: string; name: string }>;
  onTemplateImport?: () => void;
}

export default function DailyTimeEntryTable({
  entries,
  dailyTasks,
  routineTasks,
  projects,
  onUpdate,
  onDelete,
  onCreate,
  selectedDate,
  attendanceClockIn = null,
  attendanceClockOut = null,
  workScheduleTemplates = [],
  onTemplateImport,
}: DailyTimeEntryTableProps) {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [formData, setFormData] = useState({
    taskSource: "daily",
    taskId: "",
    projectId: "",
    wbsId: "",
    startTime: "",
    endTime: "",
  });
  const [createFormData, setCreateFormData] = useState({
    taskSource: "daily",
    taskId: "",
    newTaskTitle: "", // 自由入力用
    projectId: "",
    wbsId: "",
    startTime: "",
    endTime: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [importingTemplateId, setImportingTemplateId] = useState<string | null>(null);

  const handleTemplateImport = async (templateId: string) => {
    setImportingTemplateId(templateId);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await fetch(`/api/work-schedule-templates/${templateId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || "Failed to import");
      }
      const result = JSON.parse(text);
      alert(`${result.count}件の稼働実績を登録しました`);
      if (onTemplateImport) {
        onTemplateImport();
      }
    } catch (error) {
      console.error("Failed to import template:", error);
      alert("テンプレートのインポートに失敗しました");
    } finally {
      setImportingTemplateId(null);
    }
  };

  // 前の実績の終了時間を開始時間のデフォルト値にセット
  useEffect(() => {
    if (entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry.endTime) {
        const endTime = format(new Date(lastEntry.endTime), "HH:mm");
        setCreateFormData(prev => ({
          ...prev,
          startTime: endTime,
        }));
      } else if (lastEntry.startTime) {
        const lastStart = format(new Date(lastEntry.startTime), "HH:mm");
        setCreateFormData(prev => ({
          ...prev,
          startTime: lastStart,
        }));
      } else {
        // endTimeがnullの場合は現在時刻
        const now = format(new Date(), "HH:mm");
        setCreateFormData(prev => ({
          ...prev,
          startTime: now,
        }));
      }
    } else {
      // エントリがない場合は現在時刻
      const now = format(new Date(), "HH:mm");
      setCreateFormData(prev => ({
        ...prev,
        startTime: now,
      }));
    }
  }, [entries]);

  // selectedDate変更時にフォームリセット
  useEffect(() => {
    setCreateFormData({
      taskSource: "daily",
      taskId: "",
      newTaskTitle: "",
      projectId: "",
      wbsId: "",
      startTime: "",
      endTime: "",
    });
  }, [selectedDate]);

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    const taskSource = entry.routineTaskId ? "routine" : "daily";
    const taskId = entry.routineTaskId || entry.dailyTaskId || "";
    setFormData({
      taskSource,
      taskId,
      projectId: entry.projectId || "",
      wbsId: entry.wbsId || "",
      startTime: entry.startTime
        ? format(new Date(entry.startTime), "HH:mm")
        : "",
      endTime: entry.endTime
        ? format(new Date(entry.endTime), "HH:mm")
        : "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    // タスクが選択されているかチェック
    if (!formData.taskId || formData.taskId === "none") {
      alert("タスクを選択してください");
      return;
    }

    // Convert time strings to full DateTime
    const startDate = new Date(editingEntry.startTime);
    const [startHours, startMinutes] = formData.startTime.split(":").map(Number);
    startDate.setHours(startHours, startMinutes, 0, 0);

    let endDate = null;
    if (formData.endTime) {
      endDate = new Date(editingEntry.startTime);
      const [endHours, endMinutes] = formData.endTime.split(":").map(Number);
      endDate.setHours(endHours, endMinutes, 0, 0);
    }

    const taskPayload =
      formData.taskSource === "routine"
        ? { routineTaskId: formData.taskId, dailyTaskId: null }
        : { dailyTaskId: formData.taskId, routineTaskId: null };

    onUpdate(editingEntry.id, {
      ...taskPayload,
      projectId: formData.projectId || null,
      wbsId: formData.wbsId || null,
      startTime: startDate.toISOString(),
      endTime: endDate ? endDate.toISOString() : null,
    });

    setEditingEntry(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return; // 二重送信防止

    // バリデーション：既存タスク選択か新規タスク入力のどちらかが必要
    const hasExistingTask = createFormData.taskId && createFormData.taskId !== "none" && createFormData.taskId !== "new";
    const hasNewTask = createFormData.taskSource === "daily" && createFormData.newTaskTitle.trim() !== "";

    if (!hasExistingTask && !hasNewTask) {
      alert("タスクを選択するか、新しいタスク名を入力してください");
      return;
    }

    if (!createFormData.startTime) {
      alert("開始時間を入力してください");
      return;
    }

    if (!createFormData.endTime) {
      alert("終了時間を入力してください");
      return;
    }

    // 時間の大小チェック
    const [startHours, startMinutes] = createFormData.startTime.split(":").map(Number);
    const [endHours, endMinutes] = createFormData.endTime.split(":").map(Number);

    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;

    if (startMinutesTotal >= endMinutesTotal) {
      alert("終了時間は開始時間より後にしてください");
      return;
    }

    // DateTimeの構築（selectedDateの日付 + 入力された時刻）
    const startDate = new Date(selectedDate);
    startDate.setHours(startHours, startMinutes, 0, 0);

    const endDate = new Date(selectedDate);
    endDate.setHours(endHours, endMinutes, 0, 0);

    setIsCreating(true);
    try {
      // API呼び出し
      const isNewTask = createFormData.taskSource === "daily" && createFormData.newTaskTitle.trim() !== "";

      let taskPayload;
      if (isNewTask) {
        // 新規タスク作成の場合
        taskPayload = {
          newTaskTitle: createFormData.newTaskTitle.trim(),
          date: selectedDate.toISOString(),
          dailyTaskId: null,
          routineTaskId: null,
        };
      } else if (createFormData.taskSource === "routine") {
        taskPayload = { routineTaskId: createFormData.taskId, dailyTaskId: null };
      } else {
        taskPayload = { dailyTaskId: createFormData.taskId, routineTaskId: null };
      }

      onCreate({
        ...taskPayload,
        projectId: createFormData.projectId || null,
        wbsId: createFormData.wbsId || null,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      // フォームリセット（タスク/プロジェクト/WBSはクリア、時間は次の実績のために維持）
      setCreateFormData({
        taskSource: createFormData.taskSource,
        taskId: "",
        newTaskTitle: "",
        projectId: "",
        wbsId: "",
        startTime: createFormData.endTime, // 前の終了時間を次の開始時間に
        endTime: "",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Get WBS list for selected project
  const selectedProject = projects.find((p) => p.id === formData.projectId);
  const wbsList = selectedProject?.wbsList || [];

  // Get WBS list for selected project (create form)
  const selectedCreateProject = projects.find((p) => p.id === createFormData.projectId);
  const createWbsList = selectedCreateProject?.wbsList || [];

  // プロジェクト×WBSの統合リストを作成
  const projectWbsOptions = projects.flatMap(project =>
    project.wbsList.map(wbs => ({
      projectId: project.id,
      wbsId: wbs.id,
      value: `${project.id}|||${wbs.id}`,
      label: `${project.code}■${wbs.name}`,
    }))
  );

  // 編集フォーム用の統合リスト
  const editProjectWbsOptions = projects.flatMap(project =>
    project.wbsList.map(wbs => ({
      projectId: project.id,
      wbsId: wbs.id,
      value: `${project.id}|||${wbs.id}`,
      label: `${project.code}■${wbs.name}`,
    }))
  );

  // Format duration to decimal hours (e.g., 1.5)
  const formatDurationHours = (seconds: number | null): string => {
    if (!seconds) return "0.00";
    return (seconds / 3600).toFixed(2);
  };

  const formatTime = (value: Date | string | null): string => {
    if (!value) return "";
    return format(new Date(value), "HH:mm");
  };

  const timeWarnings = entries.reduce<Record<string, { start: boolean; end: boolean }>>(
    (acc, entry, index) => {
      let startMismatch = false;
      let endMismatch = false;
      const startTime = formatTime(entry.startTime);
      if (index === 0 && attendanceClockIn) {
        const clockInTime = formatTime(attendanceClockIn);
        startMismatch = Boolean(clockInTime && clockInTime !== startTime);
      }
      if (index > 0) {
        const prev = entries[index - 1];
        if (!prev.endTime) {
          startMismatch = true;
        } else {
          const prevEnd = formatTime(prev.endTime);
          startMismatch = prevEnd !== startTime;
        }
      }
      if (attendanceClockOut && index === entries.length - 1) {
        const clockOutTime = formatTime(attendanceClockOut);
        if (!entry.endTime) {
          endMismatch = Boolean(clockOutTime);
        } else {
          const endTime = formatTime(entry.endTime);
          endMismatch = Boolean(clockOutTime && clockOutTime !== endTime);
        }
      }
      acc[entry.id] = { start: startMismatch, end: endMismatch };
      return acc;
    },
    {}
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>稼働実績</CardTitle>
          {workScheduleTemplates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {workScheduleTemplates.map((template) => (
                <Button
                  key={template.id}
                  size="sm"
                  variant="outline"
                  onClick={() => handleTemplateImport(template.id)}
                  disabled={importingTemplateId !== null}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {importingTemplateId === template.id ? "..." : template.name}
                </Button>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table className="[&_th]:text-left [&_td]:text-left">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Task</TableHead>
                <TableHead className="text-left">Project</TableHead>
                <TableHead className="text-left">Time</TableHead>
                <TableHead className="text-left">Duration</TableHead>
                <TableHead className="text-left">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    稼働実績がありません
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-left">
                      {entry.dailyTask?.title ||
                        entry.routineTask?.title ||
                        "タスクなし"}
                    </TableCell>
                    <TableCell className="text-left">
                      {entry.project && entry.wbs
                        ? `${entry.project.abbreviation || entry.project.code}■${entry.wbs.name}`
                      : entry.project
                        ? `${entry.project.code} - ${entry.project.name}`
                        : "集計なし"}
                    </TableCell>
                    <TableCell className="text-left font-mono">
                      <span
                        className={
                          timeWarnings[entry.id]?.start ? "text-destructive" : ""
                        }
                      >
                        {format(new Date(entry.startTime), "HH:mm")}
                      </span>
                      {" - "}
                      <span
                        className={
                          timeWarnings[entry.id]?.end ? "text-destructive" : ""
                        }
                      >
                        {entry.endTime
                          ? format(new Date(entry.endTime), "HH:mm")
                          : "進行中"}
                      </span>
                    </TableCell>
                    <TableCell className="text-left font-mono font-semibold">
                      {formatDurationHours(entry.duration)}h
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex justify-start gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(entry)}
                        >
                          <Pencil className="h-4 w-4" />
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
                ))
              )}
            </TableBody>
          </Table>

          {/* インライン入力フォーム */}
          <form onSubmit={handleCreateSubmit} className="mt-4 border-t pt-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Task</span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        createFormData.taskSource === "daily"
                          ? "default"
                          : "outline"
                      }
                      className="h-7 px-2"
                      onClick={() =>
                        setCreateFormData({
                          ...createFormData,
                          taskSource: "daily",
                          taskId: "",
                          newTaskTitle: "",
                        })
                      }
                    >
                      Daily
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        createFormData.taskSource === "routine"
                          ? "default"
                          : "outline"
                      }
                      className="h-7 px-2"
                      onClick={() =>
                        setCreateFormData({
                          ...createFormData,
                          taskSource: "routine",
                          taskId: "",
                          newTaskTitle: "",
                        })
                      }
                    >
                      Routine
                    </Button>
                  </div>
                </div>
                {/* 新規タスク入力モードの場合はテキスト入力、それ以外はドロップダウン */}
                {createFormData.taskId === "new" && createFormData.taskSource === "daily" ? (
                  <div className="flex gap-1">
                    <Input
                      type="text"
                      value={createFormData.newTaskTitle}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          newTaskTitle: e.target.value,
                        })
                      }
                      placeholder="新しいタスク名を入力"
                      className="h-9 flex-1"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2"
                      onClick={() =>
                        setCreateFormData({
                          ...createFormData,
                          taskId: "",
                          newTaskTitle: "",
                        })
                      }
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={createFormData.taskId || "none"}
                    onValueChange={(value) =>
                      setCreateFormData({
                        ...createFormData,
                        taskId: value === "none" ? "" : value,
                        newTaskTitle: "",
                      })
                    }
                    required
                  >
                    <SelectTrigger className="h-9 w-full justify-start text-left">
                      <SelectValue className="text-left" placeholder="Task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
                        Select task
                      </SelectItem>
                      {createFormData.taskSource === "daily" && (
                        <SelectItem value="new" className="text-primary font-medium">
                          + 新規タスク
                        </SelectItem>
                      )}
                      {(createFormData.taskSource === "daily"
                        ? dailyTasks
                        : routineTasks
                      ).map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex-1">
                <Select
                  value={createFormData.projectId && createFormData.wbsId ? `${createFormData.projectId}|||${createFormData.wbsId}` : "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setCreateFormData({
                        ...createFormData,
                        projectId: "",
                        wbsId: "",
                      });
                    } else {
                      const [projectId, wbsId] = value.split("|||");
                      setCreateFormData({
                        ...createFormData,
                        projectId,
                        wbsId,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-full justify-start text-left">
                    <SelectValue className="text-left" placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">集計なし</SelectItem>
                    {projectWbsOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32">
                <Input
                  type="time"
                  value={createFormData.startTime}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, startTime: e.target.value })
                  }
                  required
                  className="h-9 text-left tabular-nums"
                  placeholder="Start"
                />
              </div>

              <div className="w-32">
                <Input
                  type="time"
                  value={createFormData.endTime}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, endTime: e.target.value })
                  }
                  required
                  className="h-9 text-left tabular-nums"
                  placeholder="End"
                />
              </div>

              <Button type="submit" size="sm" disabled={isCreating} className="h-9">
                {isCreating ? "..." : "Add"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingEntry}
        onOpenChange={() => setEditingEntry(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>稼働実績を編集</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="dailyTask">
                タスク <span className="text-destructive">*</span>
              </Label>
              <div className="mt-2 flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={formData.taskSource === "daily" ? "default" : "outline"}
                  className="h-7 px-2"
                  onClick={() =>
                    setFormData({ ...formData, taskSource: "daily", taskId: "" })
                  }
                >
                  Daily
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    formData.taskSource === "routine" ? "default" : "outline"
                  }
                  className="h-7 px-2"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      taskSource: "routine",
                      taskId: "",
                    })
                  }
                >
                  Routine
                </Button>
              </div>
              <Select
                value={formData.taskId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    taskId: value === "none" ? "" : value,
                  })
                }
                required
              >
                <SelectTrigger id="dailyTask">
                  <SelectValue placeholder="タスクを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    タスクを選択してください
                  </SelectItem>
                  {(formData.taskSource === "daily"
                    ? dailyTasks
                    : routineTasks
                  ).map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="project">プロジェクト</Label>
              <Select
                value={formData.projectId && formData.wbsId ? `${formData.projectId}|||${formData.wbsId}` : "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setFormData({
                      ...formData,
                      projectId: "",
                      wbsId: "",
                    });
                  } else {
                    const [projectId, wbsId] = value.split("|||");
                    setFormData({
                      ...formData,
                      projectId,
                      wbsId,
                    });
                  }
                }}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="プロジェクトを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">集計なし</SelectItem>
                  {editProjectWbsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">開始時間</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">終了時間</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingEntry(null)}
              >
                キャンセル
              </Button>
              <Button type="submit">更新</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
