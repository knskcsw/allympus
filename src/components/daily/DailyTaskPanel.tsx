"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { DailyTaskItem } from "./DailyTaskItem";

interface DailyTask {
  id: string;
  date: Date;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimatedMinutes: number | null;
  totalTimeSpent?: number;
}

interface DailyTaskPanelProps {
  date: Date;
  tasks: DailyTask[];
  onTaskCreate: (data: Partial<DailyTask>) => void;
  onTaskUpdate: (id: string, data: Partial<DailyTask>) => void;
  onTaskDelete: (id: string) => void;
  onTaskStatusChange: (id: string, status: string) => void;
}

export default function DailyTaskPanel({
  date,
  tasks,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTaskStatusChange,
}: DailyTaskPanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    estimatedMinutes: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      estimatedMinutes: "",
    });
    setEditingTask(null);
  };

  const handleEdit = (task: DailyTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes?.toString() || "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      title: formData.title,
      description: formData.description || null,
      status: formData.status,
      priority: formData.priority,
      estimatedMinutes: formData.estimatedMinutes
        ? parseInt(formData.estimatedMinutes)
        : null,
    };

    if (editingTask) {
      onTaskUpdate(editingTask.id, data);
    } else {
      onTaskCreate(data);
    }

    setIsFormOpen(false);
    resetForm();
  };

  // Group tasks by status
  const todoTasks = tasks.filter((t) => t.status === "TODO");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>タスク</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* TODO Section */}
          {todoTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                TODO ({todoTasks.length})
              </h3>
              {todoTasks.map((task) => (
                <DailyTaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={onTaskDelete}
                  onStatusChange={onTaskStatusChange}
                />
              ))}
            </div>
          )}

          {/* IN_PROGRESS Section */}
          {inProgressTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                進行中 ({inProgressTasks.length})
              </h3>
              {inProgressTasks.map((task) => (
                <DailyTaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={onTaskDelete}
                  onStatusChange={onTaskStatusChange}
                />
              ))}
            </div>
          )}

          {/* DONE Section */}
          {doneTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                完了 ({doneTasks.length})
              </h3>
              {doneTasks.map((task) => (
                <DailyTaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={onTaskDelete}
                  onStatusChange={onTaskStatusChange}
                />
              ))}
            </div>
          )}

          {tasks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              タスクがありません
            </p>
          )}
        </CardContent>
      </Card>

      {/* Task Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "タスクを編集" : "タスクを追加"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">ステータス</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">TODO</SelectItem>
                    <SelectItem value="IN_PROGRESS">進行中</SelectItem>
                    <SelectItem value="DONE">完了</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">優先度</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">低</SelectItem>
                    <SelectItem value="MEDIUM">中</SelectItem>
                    <SelectItem value="HIGH">高</SelectItem>
                    <SelectItem value="URGENT">緊急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="estimatedMinutes">見積もり時間（分）</Label>
              <Input
                id="estimatedMinutes"
                type="number"
                value={formData.estimatedMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedMinutes: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
              >
                キャンセル
              </Button>
              <Button type="submit">
                {editingTask ? "更新" : "作成"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
