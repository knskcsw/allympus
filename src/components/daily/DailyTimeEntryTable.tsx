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
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Download, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface AllocationEntry {
  id: string;
  timeEntryId: string;
  projectId: string;
  project?: { id: string; code: string; name: string; abbreviation: string | null };
  wbsId: string | null;
  wbs?: { id: string; name: string } | null;
  percentage: number;
}

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
  startTime: Date | string;
  endTime: Date | string | null;
  duration: number | null;
  note: string | null;
  allocations?: AllocationEntry[];
}

interface DailyTimeEntryTableProps {
  entries: TimeEntry[];
  dailyTasks: Array<{ id: string; title: string }>;
  routineTasks: Array<{ id: string; title: string }>;
  projects: Array<{
    id: string;
    code: string;
    name: string;
    abbreviation?: string | null;
    sortOrder?: number | null;
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isAllocationMode, setIsAllocationMode] = useState(false);
  const [allocations, setAllocations] = useState<Array<{
    id: string;
    projectId: string;
    wbsId: string;
    percentage: number;
  }>>([]);
  const [formData, setFormData] = useState({
    taskId: "",
    projectId: "",
    wbsId: "",
    startTime: "",
    endTime: "",
  });
  const [createFormData, setCreateFormData] = useState({
    taskId: "",
    newTaskTitle: "", // 自由入力用
    projectId: "",
    wbsId: "",
    startTime: "",
    endTime: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [importingTemplateId, setImportingTemplateId] = useState<string | null>(null);

  const toggleExpand = (entryId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const addAllocation = () => {
    setAllocations([
      ...allocations,
      {
        id: `temp-${Date.now()}`,
        projectId: "",
        wbsId: "",
        percentage: 0,
      },
    ]);
  };

  const removeAllocation = (id: string) => {
    setAllocations(allocations.filter((a) => a.id !== id));
  };

  const updateAllocation = (
    id: string,
    field: "projectId" | "wbsId" | "percentage",
    value: string | number
  ) => {
    setAllocations(
      allocations.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      )
    );
  };

  const updateAllocationMultiple = (
    id: string,
    updates: { projectId?: string; wbsId?: string; percentage?: number }
  ) => {
    setAllocations(
      allocations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      )
    );
  };

  const getTotalPercentage = () => {
    return allocations.reduce((sum, a) => sum + a.percentage, 0);
  };

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
      void result;
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
    const taskId = entry.routineTaskId
      ? `routine:${entry.routineTaskId}`
      : entry.dailyTaskId
        ? `daily:${entry.dailyTaskId}`
        : "";

    // 按分データがあるかチェック
    const hasAllocations = entry.allocations && entry.allocations.length > 0;

    if (hasAllocations) {
      // 按分モードON
      setIsAllocationMode(true);
      setAllocations(
        entry.allocations!.map((alloc) => ({
          id: alloc.id,
          projectId: alloc.projectId,
          wbsId: alloc.wbsId || "",
          percentage: alloc.percentage,
        }))
      );
      setFormData({
        taskId,
        projectId: "",
        wbsId: "",
        startTime: entry.startTime
          ? format(new Date(entry.startTime), "HH:mm")
          : "",
        endTime: entry.endTime
          ? format(new Date(entry.endTime), "HH:mm")
          : "",
      });
    } else {
      // シンプルモード
      setIsAllocationMode(false);
      setAllocations([]);
      setFormData({
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    // タスクが選択されているかチェック
    if (!formData.taskId || formData.taskId === "none") {
      alert("タスクを選択してください");
      return;
    }

    // 按分モードの場合、バリデーション
    if (isAllocationMode) {
      if (allocations.length === 0) {
        alert("按分を1件以上追加してください");
        return;
      }

      const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert(`按分率の合計は100%にしてください（現在: ${totalPercentage.toFixed(1)}%）`);
        return;
      }

      // 按分データに空のプロジェクトがないかチェック
      const hasEmptyProject = allocations.some((a) => !a.projectId);
      if (hasEmptyProject) {
        alert("全ての按分にプロジェクトを選択してください");
        return;
      }
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

    const [taskSource, taskIdValue] = formData.taskId.split(":");
    const taskPayload =
      taskSource === "routine"
        ? { routineTaskId: taskIdValue, dailyTaskId: null }
        : { dailyTaskId: taskIdValue, routineTaskId: null };

    const updatePayload: Record<string, unknown> = {
      ...taskPayload,
      startTime: startDate.toISOString(),
      endTime: endDate ? endDate.toISOString() : null,
    };

    // 按分モードの場合はallocationsを送信
    if (isAllocationMode) {
      updatePayload.allocations = allocations.map((a) => ({
        projectId: a.projectId,
        wbsId: a.wbsId || null,
        percentage: a.percentage,
      }));
      updatePayload.projectId = null;
      updatePayload.wbsId = null;
    } else {
      // シンプルモードの場合は通常通り
      updatePayload.projectId = formData.projectId || null;
      updatePayload.wbsId = formData.wbsId || null;
      updatePayload.allocations = [];
    }

    onUpdate(editingEntry.id, updatePayload);

    setEditingEntry(null);
    setIsAllocationMode(false);
    setAllocations([]);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return; // 二重送信防止

    // バリデーション：既存タスク選択か新規タスク入力のどちらかが必要
    const hasExistingTask = createFormData.taskId && createFormData.taskId !== "none" && createFormData.taskId !== "new";
    const hasNewTask = createFormData.newTaskTitle.trim() !== "";

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
      const isNewTask = createFormData.newTaskTitle.trim() !== "";

      let taskPayload;
      if (isNewTask) {
        // 新規タスク作成の場合
        taskPayload = {
          newTaskTitle: createFormData.newTaskTitle.trim(),
          date: selectedDate.toISOString(),
          dailyTaskId: null,
          routineTaskId: null,
        };
      } else {
        const [taskSource, taskIdValue] = createFormData.taskId.split(":");
        if (taskSource === "routine") {
          taskPayload = { routineTaskId: taskIdValue, dailyTaskId: null };
        } else {
          taskPayload = { dailyTaskId: taskIdValue, routineTaskId: null };
        }
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

  const orderedProjects = [...projects].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  // プロジェクト×WBSの統合リストを作成
  const projectWbsOptions = orderedProjects.flatMap(project =>
    project.wbsList.map(wbs => ({
      projectId: project.id,
      wbsId: wbs.id,
      value: `${project.id}|||${wbs.id}`,
      label: `${project.abbreviation || project.code}■${wbs.name}`,
    }))
  );

  // 編集フォーム用の統合リスト
  const editProjectWbsOptions = orderedProjects.flatMap(project =>
    project.wbsList.map(wbs => ({
      projectId: project.id,
      wbsId: wbs.id,
      value: `${project.id}|||${wbs.id}`,
      label: `${project.abbreviation || project.code}■${wbs.name}`,
    }))
  );

  const isBreakProject = (project?: { code?: string; name?: string; abbreviation?: string | null }) => {
    if (!project) return false;
    const labels = [project.code, project.name, project.abbreviation]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());
    return labels.some((value) => value === "休憩" || value === "break");
  };
  const breakProject = projects.find(isBreakProject);
  const breakProjectOption = breakProject
    ? { value: `${breakProject.id}|||`, label: "休憩" }
    : null;
  const getProjectSelectValue = (projectId: string, wbsId: string) => {
    if (!projectId) return "none";
    return wbsId ? `${projectId}|||${wbsId}` : `${projectId}|||`;
  };

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
                entries.flatMap((entry) => {
                  const hasAllocations = entry.allocations && entry.allocations.length > 0;
                  const isExpanded = expandedRows.has(entry.id);
                  const rows = [];

                  // 親行
                  rows.push(
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => handleEdit(entry)}
                    >
                      <TableCell className="text-left">
                        <div className="flex items-center gap-2">
                          {hasAllocations && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(entry.id);
                              }}
                              className="hover:bg-muted rounded p-1"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <span>
                            {entry.dailyTask?.title ||
                              entry.routineTask?.title ||
                              "タスクなし"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-left max-w-[200px]">
                        {hasAllocations ? (
                          <span className="text-muted-foreground">
                            按分: {entry.allocations!.length}件
                          </span>
                        ) : entry.project && entry.wbs ? (
                          <span className="truncate block">
                            {`${entry.project.abbreviation || entry.project.code}■${entry.wbs.name}`}
                          </span>
                        ) : entry.project ? (
                          <span className="truncate block">
                            {`${entry.project.code} - ${entry.project.name}`}
                          </span>
                        ) : (
                          "集計なし"
                        )}
                      </TableCell>
                      <TableCell className="text-left tabular-nums">
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
                      <TableCell className="text-left tabular-nums">
                        {formatDurationHours(entry.duration)}h
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex justify-start gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEdit(entry);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDelete(entry.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );

                  // 按分詳細行（展開時のみ）
                  if (hasAllocations && isExpanded) {
                    entry.allocations!.forEach((alloc) => {
                      const allocatedHours = ((entry.duration || 0) * alloc.percentage) / 100 / 3600;
                      rows.push(
                        <TableRow
                          key={`${entry.id}-alloc-${alloc.id}`}
                          className="bg-muted/20"
                        >
                          <TableCell className="text-left pl-12">
                            <span className="text-muted-foreground text-sm">↳</span>
                          </TableCell>
                          <TableCell className="text-left text-sm max-w-[200px]">
                            <span className="truncate block">
                              {alloc.percentage.toFixed(1)}% {alloc.project?.abbreviation || alloc.project?.code}
                              {alloc.wbs && `■${alloc.wbs.name}`}
                            </span>
                          </TableCell>
                          <TableCell className="text-left text-sm text-muted-foreground">
                            -
                          </TableCell>
                          <TableCell className="text-left tabular-nums text-sm">
                            {allocatedHours.toFixed(2)}h
                          </TableCell>
                          <TableCell className="text-left">
                            {/* 子行にはボタンなし */}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  }

                  return rows;
                })
              )}
            </TableBody>
          </Table>

          {/* インライン入力フォーム */}
          <form onSubmit={handleCreateSubmit} className="mt-4 border-t pt-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                {/* 新規タスク入力モードの場合はテキスト入力、それ以外はドロップダウン */}
                {createFormData.taskId === "new" ? (
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
                      <SelectItem value="new" className="text-primary font-medium">
                        + 新規タスク
                      </SelectItem>
                      {dailyTasks.map((task) => (
                        <SelectItem key={task.id} value={`daily:${task.id}`}>
                          {task.title}
                        </SelectItem>
                      ))}
                      {routineTasks.length > 0 && (
                        <>
                          <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs font-semibold text-muted-foreground pointer-events-none">
                            ─── Routine ───
                          </div>
                          {routineTasks.map((task) => (
                            <SelectItem key={task.id} value={`routine:${task.id}`}>
                              {task.title}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex-1">
                <Select
                  value={getProjectSelectValue(
                    createFormData.projectId,
                    createFormData.wbsId
                  )}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setCreateFormData({
                        ...createFormData,
                        projectId: "",
                        wbsId: "",
                      });
                    } else {
                      const [projectId, wbsId = ""] = value.split("|||");
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
                  <SelectContent className="max-w-[500px]">
                    <SelectItem value="none">集計なし</SelectItem>
                    {breakProjectOption && (
                      <SelectItem value={breakProjectOption.value}>
                        <span className="truncate block">{breakProjectOption.label}</span>
                      </SelectItem>
                    )}
                    {projectWbsOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="truncate block">{option.label}</span>
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
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>稼働実績を編集</DialogTitle>
          </DialogHeader>

          {/* 按分モードトグル */}
          <div className="flex items-center gap-2 mb-4">
            <Switch
              id="allocation-mode"
              checked={isAllocationMode}
              onCheckedChange={(checked) => {
                setIsAllocationMode(checked);
                if (checked && allocations.length === 0) {
                  // 按分モードON時、按分がなければ1件追加
                  addAllocation();
                }
              }}
            />
            <Label htmlFor="allocation-mode" className="cursor-pointer">
              按分モード {isAllocationMode && `(合計: ${getTotalPercentage().toFixed(1)}%)`}
            </Label>
            {isAllocationMode && (
              <span
                className={
                  Math.abs(getTotalPercentage() - 100) < 0.01
                    ? "text-green-600 text-sm"
                    : "text-destructive text-sm"
                }
              >
                {Math.abs(getTotalPercentage() - 100) < 0.01 ? "✓" : "⚠ 100%にしてください"}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* タスク選択 */}
            <div>
              <Label htmlFor="dailyTask">タスク <span className="text-destructive">*</span></Label>
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
                <SelectTrigger id="dailyTask" className="h-9">
                  <SelectValue placeholder="タスクを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    タスクを選択してください
                  </SelectItem>
                  {dailyTasks.map((task) => (
                    <SelectItem key={task.id} value={`daily:${task.id}`}>
                      {task.title}
                    </SelectItem>
                  ))}
                  {routineTasks.length > 0 && (
                    <>
                      <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs font-semibold text-muted-foreground pointer-events-none">
                        ─── Routine ───
                      </div>
                      {routineTasks.map((task) => (
                        <SelectItem key={task.id} value={`routine:${task.id}`}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 按分モード: 按分エントリリスト */}
            {isAllocationMode ? (
              <div className="space-y-2">
                <Label>按分設定</Label>
                {allocations.map((alloc, index) => (
                  <div key={alloc.id} className="flex gap-2 items-end border p-2 rounded">
                    <div className="flex-1">
                      <Label className="text-xs">プロジェクト■WBS</Label>
                      <Select
                        value={getProjectSelectValue(alloc.projectId, alloc.wbsId)}
                        onValueChange={(value) => {
                          if (value === "none") {
                            updateAllocationMultiple(alloc.id, {
                              projectId: "",
                              wbsId: "",
                            });
                          } else {
                            const [projectId, wbsId = ""] = value.split("|||");
                            updateAllocationMultiple(alloc.id, {
                              projectId,
                              wbsId,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="プロジェクトを選択" />
                        </SelectTrigger>
                        <SelectContent className="max-w-[500px]">
                          <SelectItem value="none">選択してください</SelectItem>
                          {breakProjectOption && (
                            <SelectItem value={breakProjectOption.value}>
                              <span className="truncate block">{breakProjectOption.label}</span>
                            </SelectItem>
                          )}
                          {editProjectWbsOptions.length > 0 ? (
                            editProjectWbsOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <span className="truncate block">{option.label}</span>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-options" disabled>
                              プロジェクト/WBSがありません
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">割合(%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={alloc.percentage || ""}
                        onChange={(e) =>
                          updateAllocation(
                            alloc.id,
                            "percentage",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-9"
                        placeholder="%"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => removeAllocation(alloc.id)}
                      disabled={allocations.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAllocation}
                >
                  + 按分を追加
                </Button>
              </div>
            ) : (
              /* シンプルモード: 通常のプロジェクト選択 */
              <div>
                <Label htmlFor="project">プロジェクト</Label>
                <Select
                  value={getProjectSelectValue(formData.projectId, formData.wbsId)}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setFormData({
                        ...formData,
                        projectId: "",
                        wbsId: "",
                      });
                    } else {
                      const [projectId, wbsId = ""] = value.split("|||");
                      setFormData({
                        ...formData,
                        projectId,
                        wbsId,
                      });
                    }
                  }}
                >
                  <SelectTrigger id="project" className="h-9">
                    <SelectValue placeholder="プロジェクトを選択" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[500px]">
                    <SelectItem value="none">集計なし</SelectItem>
                    {breakProjectOption && (
                      <SelectItem value={breakProjectOption.value}>
                        <span className="truncate block">{breakProjectOption.label}</span>
                      </SelectItem>
                    )}
                    {editProjectWbsOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="truncate block">{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 時間入力 */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="startTime">開始時間</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                  className="h-9 text-left tabular-nums"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endTime">終了時間</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="h-9 text-left tabular-nums"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setEditingEntry(null)}
              >
                キャンセル
              </Button>
              <Button type="submit" size="sm" className="h-9">
                更新
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
