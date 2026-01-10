"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Plus } from "lucide-react";
import type { Task } from "@/generated/prisma/client";

type TaskWithTime = Task & { totalTimeSpent?: number };

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    const response = await fetch("/api/tasks");
    const data = await response.json();
    setTasks(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreate = async (data: Partial<Task>) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchTasks();
  };

  const handleUpdate = async (data: Partial<Task>) => {
    if (!editingTask) return;
    await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingTask(null);
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });
    fetchTasks();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTasks();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  const groupedTasks = {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {(["TODO", "IN_PROGRESS", "DONE"] as const).map((status) => (
          <div key={status} className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              {status.replace("_", " ")}
              <span className="text-sm text-muted-foreground">
                ({groupedTasks[status].length})
              </span>
            </h2>
            <div className="space-y-3">
              {groupedTasks[status].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {groupedTasks[status].length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
      />

      <TaskForm
        task={editingTask}
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
