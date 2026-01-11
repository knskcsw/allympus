"use client";

import { useState } from "react";
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
}

export default function DailyTimeEntryTable({
  entries,
  dailyTasks,
  projects,
  onUpdate,
  onDelete,
}: DailyTimeEntryTableProps) {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [formData, setFormData] = useState({
    dailyTaskId: "",
    projectId: "",
    wbsId: "",
    startTime: "",
    endTime: "",
  });

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
      dailyTaskId: formData.dailyTaskId || null,
      projectId: formData.projectId || null,
      wbsId: formData.wbsId || null,
      startTime: startDate.toISOString(),
      endTime: endDate ? endDate.toISOString() : null,
    });

    setEditingEntry(null);
  };

  // Get WBS list for selected project
  const selectedProject = projects.find((p) => p.id === formData.projectId);
  const wbsList = selectedProject?.wbsList || [];

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
                <TableHead>タスク名</TableHead>
                <TableHead>プロジェクト・WBS</TableHead>
                <TableHead className="text-right">時間帯</TableHead>
                <TableHead className="text-right">稼働時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
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
              <Label htmlFor="dailyTask">タスク</Label>
              <Select
                value={formData.dailyTaskId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    dailyTaskId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger id="dailyTask">
                  <SelectValue placeholder="タスクを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">タスクなし</SelectItem>
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
                value={formData.projectId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    projectId: value === "none" ? "" : value,
                    wbsId: "", // Reset WBS when project changes
                  })
                }
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="プロジェクトを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">プロジェクトなし</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.code} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="wbs">WBS</Label>
              <Select
                value={formData.wbsId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    wbsId: value === "none" ? "" : value,
                  })
                }
                disabled={!formData.projectId}
              >
                <SelectTrigger id="wbs">
                  <SelectValue placeholder="WBSを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">WBSなし</SelectItem>
                  {wbsList.map((wbs) => (
                    <SelectItem key={wbs.id} value={wbs.id}>
                      {wbs.name}
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
