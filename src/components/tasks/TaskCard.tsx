"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Clock } from "lucide-react";
import type { Task } from "@/generated/prisma/client";

interface TaskCardProps {
  task: Task & { totalTimeSpent?: number };
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

const statusColors: Record<string, string> = {
  TODO: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-green-500",
  ARCHIVED: "bg-gray-400",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-400",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskCardProps) {
  const nextStatus: Record<string, string> = {
    TODO: "IN_PROGRESS",
    IN_PROGRESS: "DONE",
    DONE: "ARCHIVED",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(task)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge className={statusColors[task.status]}>{task.status}</Badge>
          <Badge className={priorityColors[task.priority]}>
            {task.priority}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {task.totalTimeSpent ? formatDuration(task.totalTimeSpent) : "0m"}
            </span>
            {task.estimatedMinutes && (
              <span className="text-xs">/ {task.estimatedMinutes}m est.</span>
            )}
          </div>
          {task.dueDate && (
            <span>Due: {format(new Date(task.dueDate), "MM/dd")}</span>
          )}
        </div>

        {task.status !== "ARCHIVED" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          >
            Move to {nextStatus[task.status]}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
