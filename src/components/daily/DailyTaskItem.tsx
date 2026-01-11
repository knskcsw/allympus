"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Clock } from "lucide-react";

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

interface DailyTaskItemProps {
  task: DailyTask;
  onEdit: (task: DailyTask) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

const statusColors: Record<string, string> = {
  TODO: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-green-500",
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

export function DailyTaskItem({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: DailyTaskItemProps) {
  const nextStatus: Record<string, string> = {
    TODO: "IN_PROGRESS",
    IN_PROGRESS: "DONE",
  };

  const nextStatusLabel: Record<string, string> = {
    TODO: "開始",
    IN_PROGRESS: "完了",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{task.title}</CardTitle>
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

        {/* Time tracking info */}
        {(task.totalTimeSpent !== undefined || task.estimatedMinutes) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {task.totalTimeSpent !== undefined && (
              <span className="font-semibold text-foreground">
                {formatDuration(task.totalTimeSpent)}
              </span>
            )}
            {task.estimatedMinutes && (
              <span>/ {task.estimatedMinutes}m est.</span>
            )}
          </div>
        )}

        {/* Status change button */}
        {nextStatus[task.status] && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          >
            {nextStatusLabel[task.status]}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
