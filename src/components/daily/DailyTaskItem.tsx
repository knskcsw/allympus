"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";

export interface DailyTask {
  id: string;
  date: Date;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimatedMinutes: number | null;
  sortOrder?: number;
  createdAt?: string;
  totalTimeSpent?: number;
}

interface DailyTaskItemProps {
  task: DailyTask;
  onEdit: (task: DailyTask) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
  showMoveControls?: boolean;
}

const statusColors: Record<string, string> = {
  TODO: "bg-gray-400",
  DONE: "bg-green-500",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-400",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

export function DailyTaskItem({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onMoveUp,
  onMoveDown,
  disableMoveUp = false,
  disableMoveDown = false,
  showMoveControls = false,
}: DailyTaskItemProps) {
  const isDone = task.status === "DONE";

  return (
    <Card className="border-muted/60">
      <CardContent className="flex items-center gap-2 px-2 py-2">
        <Checkbox
          checked={isDone}
          onCheckedChange={(checked) =>
            onStatusChange(task.id, checked ? "DONE" : "TODO")
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`truncate ${
                isDone ? "text-muted-foreground line-through" : ""
              }`}
            >
              {task.title}
            </span>
            <Badge
              className={`text-[10px] px-1.5 py-0.5 ${priorityColors[task.priority]}`}
            >
              {task.priority}
            </Badge>
            <Badge
              className={`text-[10px] px-1.5 py-0.5 ${
                statusColors[isDone ? "DONE" : "TODO"]
              }`}
            >
              {isDone ? "DONE" : "TODO"}
            </Badge>
          </div>
        </div>
        {showMoveControls && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onMoveUp}
              disabled={disableMoveUp}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onMoveDown}
              disabled={disableMoveDown}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onEdit(task)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
