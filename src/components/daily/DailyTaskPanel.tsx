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
import { DailyTaskItem, type DailyTask } from "./DailyTaskItem";

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
  const [sortMode, setSortMode] = useState("manual");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "MEDIUM",
    });
    setEditingTask(null);
  };

  const handleEdit = (task: DailyTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      title: formData.title.trim(),
      description: formData.description || null,
      priority: formData.priority,
    };

    // Check for duplicate task name
    if (!editingTask) {
      const isDuplicate = tasks.some(task => task.title === data.title);
      if (isDuplicate) {
        alert("同じ名前のタスクが既に存在します");
        return;
      }
    } else {
      // When editing, check if the new name conflicts with other tasks
      const isDuplicate = tasks.some(task => task.id !== editingTask.id && task.title === data.title);
      if (isDuplicate) {
        alert("同じ名前のタスクが既に存在します");
        return;
      }
    }

    if (editingTask) {
      onTaskUpdate(editingTask.id, data);
    } else {
      onTaskCreate({ ...data, status: "TODO" });
    }

    setIsFormOpen(false);
    resetForm();
  };

  const statusRank = (status: string) => (status === "DONE" ? 1 : 0);
  const priorityRank: Record<string, number> = {
    URGENT: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortMode === "status") {
      const statusDiff = statusRank(a.status) - statusRank(b.status);
      if (statusDiff !== 0) return statusDiff;
    }

    if (sortMode === "priority") {
      const priorityDiff =
        (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
      if (priorityDiff !== 0) return priorityDiff;
    }

    const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (orderDiff !== 0) return orderDiff;

    const aCreated = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bCreated = b.createdAt ? Date.parse(b.createdAt) : 0;
    return aCreated - bCreated;
  });

  const handleMoveTask = (taskId: string, direction: "up" | "down") => {
    if (sortMode !== "manual") return;
    const sortOrders = sortedTasks.map((task) => task.sortOrder);
    const hasUniqueOrder = new Set(sortOrders).size === sortOrders.length;
    const orderedTasks = sortedTasks.map((task, index) => ({
      ...task,
      sortOrder: hasUniqueOrder ? task.sortOrder : index,
    }));

    const currentIndex = orderedTasks.findIndex((task) => task.id === taskId);
    if (currentIndex < 0) return;
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= orderedTasks.length) return;

    const currentTask = orderedTasks[currentIndex];
    const nextTask = orderedTasks[nextIndex];
    const nextOrder = nextTask.sortOrder ?? nextIndex;
    const currentOrder = currentTask.sortOrder ?? currentIndex;

    const desiredOrders = orderedTasks.map((task) => task.sortOrder ?? 0);
    desiredOrders[currentIndex] = nextOrder;
    desiredOrders[nextIndex] = currentOrder;

    orderedTasks.forEach((task, index) => {
      const desiredOrder = desiredOrders[index];
      if (!hasUniqueOrder || task.sortOrder !== desiredOrder) {
        onTaskUpdate(task.id, { sortOrder: desiredOrder });
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>タスク</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={sortMode} onValueChange={setSortMode}>
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">手動</SelectItem>
                  <SelectItem value="status">ステータス順</SelectItem>
                  <SelectItem value="priority">優先度順</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedTasks.length > 0 && (
            <div className="space-y-2">
              {sortedTasks.map((task, index) => (
                <DailyTaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={onTaskDelete}
                  onStatusChange={onTaskStatusChange}
                  onMoveUp={() => handleMoveTask(task.id, "up")}
                  onMoveDown={() => handleMoveTask(task.id, "down")}
                  disableMoveUp={index === 0}
                  disableMoveDown={index === sortedTasks.length - 1}
                  showMoveControls={sortMode === "manual"}
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
