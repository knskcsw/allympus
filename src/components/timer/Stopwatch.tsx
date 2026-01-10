"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Square, RotateCcw } from "lucide-react";
import { useStopwatch } from "@/hooks/useStopwatch";
import type { Task, TimeEntry } from "@/generated/prisma/client";

interface StopwatchProps {
  onEntryChange?: () => void;
}

type TimeEntryWithTask = TimeEntry & { task: Task | null };

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function Stopwatch({ onEntryChange }: StopwatchProps) {
  const { time, isRunning, start, reset, setTime } = useStopwatch();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [activeEntry, setActiveEntry] = useState<TimeEntryWithTask | null>(
    null
  );

  const fetchTasks = useCallback(async () => {
    const response = await fetch("/api/tasks?status=TODO&status=IN_PROGRESS");
    const data = await response.json();
    setTasks(data.filter((t: Task) => t.status !== "DONE" && t.status !== "ARCHIVED"));
  }, []);

  const fetchActiveEntry = useCallback(async () => {
    const response = await fetch("/api/time-entries/active");
    const data = await response.json();
    if (data) {
      setActiveEntry(data);
      setSelectedTaskId(data.taskId || "");
      start(new Date(data.startTime));
    }
  }, [start]);

  useEffect(() => {
    fetchTasks();
    fetchActiveEntry();
  }, [fetchTasks, fetchActiveEntry]);

  const handleStart = async () => {
    const response = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: selectedTaskId || null }),
    });

    if (response.ok) {
      const data = await response.json();
      setActiveEntry(data);
      start();
      onEntryChange?.();
    }
  };

  const handleStop = async () => {
    if (!activeEntry) return;

    await fetch(`/api/time-entries/${activeEntry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stop: true }),
    });

    setActiveEntry(null);
    reset();
    setTime(0);
    onEntryChange?.();
  };

  const handleReset = () => {
    if (activeEntry) {
      handleStop();
    } else {
      reset();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-5xl font-mono font-bold tabular-nums">
            {formatTime(time)}
          </div>
        </div>

        <Select
          value={selectedTaskId || "none"}
          onValueChange={(value) => setSelectedTaskId(value === "none" ? "" : value)}
          disabled={isRunning}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a task (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No task</SelectItem>
            {tasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={handleStart} className="flex-1" size="lg">
              <Play className="mr-2 h-5 w-5" />
              Start
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              <Square className="mr-2 h-5 w-5" />
              Stop
            </Button>
          )}
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            disabled={time === 0 && !isRunning}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {activeEntry?.task && (
          <div className="text-center text-sm text-muted-foreground">
            Working on: <strong>{activeEntry.task.title}</strong>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
