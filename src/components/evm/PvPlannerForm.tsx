"use client";

import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PvPlannerFormProps = {
  selectedDates: string[];
  selectedProjectId: string;
  isSaving: boolean;
  onAddTask: (params: {
    dates: string[];
    title: string;
    estimatedMinutes: number;
  }) => Promise<void>;
};

function PvPlannerFormComponent({
  selectedDates,
  selectedProjectId,
  isSaving,
  onAddTask,
}: PvPlannerFormProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskHours, setTaskHours] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setTaskError(null);
    const hours = Number.parseFloat(taskHours);

    if (
      selectedDates.length === 0 ||
      !taskTitle.trim() ||
      !selectedProjectId ||
      !Number.isFinite(hours) ||
      hours <= 0
    ) {
      setTaskError("日付・プロジェクト・タイトル・工数を入力してください。");
      return;
    }

    const estimatedMinutes = Math.round(hours * 60);

    await onAddTask({
      dates: selectedDates,
      title: taskTitle.trim(),
      estimatedMinutes,
    });

    setTaskTitle("");
    setTaskHours("");
  }, [taskTitle, taskHours, selectedDates, selectedProjectId, onAddTask]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.6fr] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="fixedTaskTitle">固定タスク</Label>
          <Input
            id="fixedTaskTitle"
            placeholder="例: 定例会"
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fixedTaskHours">工数（h）</Label>
          <Input
            id="fixedTaskHours"
            type="number"
            min="0"
            step="0.1"
            placeholder="1.5"
            value={taskHours}
            onChange={(event) => setTaskHours(event.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isSaving || !selectedProjectId}
        >
          {isSaving ? "登録中..." : "固定タスクを追加"}
        </Button>
        {taskError ? (
          <span className="text-sm text-destructive">{taskError}</span>
        ) : null}
      </div>
    </>
  );
}

export const PvPlannerForm = memo(PvPlannerFormComponent);
