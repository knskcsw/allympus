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
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface TimeEntry {
  id: string;
  dailyTaskId: string | null;
  dailyTask?: { id: string; title: string } | null;
  task?: { id: string; title: string } | null;
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
}

export default function DailyTimeEntryTable({
  entries,
  dailyTasks,
  projects,
  onUpdate,
  onDelete,
  onCreate,
  selectedDate,
}: DailyTimeEntryTableProps) {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [formData, setFormData] = useState({
    dailyTaskId: "",
    projectId: "",
    wbsId: "",
    startTime: "",
    endTime: "",
  });
  const [createFormData, setCreateFormData] = useState({
    dailyTaskId: "",
    projectId: "",
    wbsId: "",
    startTime: "",
    endTime: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  // 前の実績の終了時間を開始時間のデフォルト値にセット
  useEffect(() => {
    if (entries.length > 0) {
      const latestEntry = entries[0]; // startTime降順ソート済み
      if (latestEntry.endTime) {
        const endTime = format(new Date(latestEntry.endTime), "HH:mm");
        setCreateFormData(prev => ({
          ...prev,
          startTime: endTime,
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
      dailyTaskId: "",
      projectId: "",
      wbsId: "",
      startTime: "",
      endTime: "",
    });
  }, [selectedDate]);

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      dailyTaskId: entry.dailyTaskId || "",
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
    if (!formData.dailyTaskId || formData.dailyTaskId === "none") {
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

    onUpdate(editingEntry.id, {
      dailyTaskId: formData.dailyTaskId,
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

    // バリデーション
    if (!createFormData.dailyTaskId || createFormData.dailyTaskId === "none") {
      alert("タスクを選択してください");
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
      onCreate({
        dailyTaskId: createFormData.dailyTaskId,
        projectId: createFormData.projectId || null,
        wbsId: createFormData.wbsId || null,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      // フォームリセット（タスク/プロジェクト/WBSはクリア、時間は次の実績のために維持）
      setCreateFormData({
        dailyTaskId: "",
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

  // Format time range
  const formatTimeRange = (entry: TimeEntry): string => {
    const start = format(new Date(entry.startTime), "HH:mm");
    const end = entry.endTime ? format(new Date(entry.endTime), "HH:mm") : "進行中";
    return `${start} - ${end}`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>稼働実績</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Time</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Edit</TableHead>
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
                    <TableCell>
                      {entry.dailyTask?.title ||
                        entry.task?.title ||
                        "タスクなし"}
                    </TableCell>
                    <TableCell>
                      {entry.project && entry.wbs
                        ? `${entry.project.abbreviation || entry.project.code}■${entry.wbs.name}`
                        : entry.project
                        ? `${entry.project.code} - ${entry.project.name}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatTimeRange(entry)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatDurationHours(entry.duration)}h
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
                <Select
                  value={createFormData.dailyTaskId || "none"}
                  onValueChange={(value) =>
                    setCreateFormData({
                      ...createFormData,
                      dailyTaskId: value === "none" ? "" : value,
                    })
                  }
                  required
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Select task
                    </SelectItem>
                    {dailyTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
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
                  className="h-9"
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
                  className="h-9"
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
              <Select
                value={formData.dailyTaskId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    dailyTaskId: value === "none" ? "" : value,
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
                  {dailyTasks.map((task) => (
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
                  <SelectItem value="none">プロジェクトなし</SelectItem>
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
