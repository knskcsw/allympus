"use client";

import { memo, useCallback } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { FixedTask, Holiday } from "./types";
import { HOLIDAY_TYPE_COLORS } from "./constants";
import { formatHours } from "./utils";

type CalendarDayCellProps = {
  day: Date;
  dateKey: string;
  holiday: Holiday | undefined;
  isSelected: boolean;
  tasks: FixedTask[];
  isTaskLoading: boolean;
  fixedHours: number;
  pvHours: number;
  onToggleDate: (dateKey: string) => void;
  onDeleteTask: (taskId: string) => void;
};

function CalendarDayCellComponent({
  day,
  dateKey,
  holiday,
  isSelected,
  tasks,
  isTaskLoading,
  fixedHours,
  pvHours,
  onToggleDate,
  onDeleteTask,
}: CalendarDayCellProps) {
  const variableHours = Math.max(pvHours - fixedHours, 0);
  const colorClass = holiday ? HOLIDAY_TYPE_COLORS[holiday.type] ?? "" : "";

  const handleClick = useCallback(() => {
    onToggleDate(dateKey);
  }, [dateKey, onToggleDate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onToggleDate(dateKey);
      }
    },
    [dateKey, onToggleDate]
  );

  const handleDeleteClick = useCallback(
    (event: React.MouseEvent, taskId: string) => {
      event.stopPropagation();
      onDeleteTask(taskId);
    },
    [onDeleteTask]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        "min-h-[150px] rounded-md border p-2 text-left transition cursor-pointer",
        isSelected ? "ring-2 ring-primary" : "hover:border-primary/60",
        colorClass,
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {format(day, "M/d (EEE)", { locale: ja })}
        </span>
        {holiday ? (
          <span className="text-[10px] font-medium">{holiday.name}</span>
        ) : null}
      </div>
      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
        <div>固定 {formatHours(fixedHours)}</div>
        <div>変動 {formatHours(variableHours)}</div>
        <div>PV {formatHours(pvHours)}</div>
      </div>
      <div className="mt-2 space-y-1">
        {isTaskLoading ? (
          <span className="text-muted-foreground">Loading...</span>
        ) : tasks.length === 0 ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-[11px]">
                {task.title} ({formatHours(task.estimatedMinutes / 60)})
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(event) => handleDeleteClick(event, task.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const CalendarDayCell = memo(CalendarDayCellComponent);
