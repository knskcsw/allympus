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
import { Label } from "@/components/ui/label";
import { Play, Square, RotateCcw } from "lucide-react";
import { useStopwatch } from "@/hooks/useStopwatch";

interface DailyTask {
  id: string;
  title: string;
}

interface Project {
  id: string;
  code: string;
  name: string;
  abbreviation: string | null;
}

interface Wbs {
  id: string;
  projectId: string;
  name: string;
}

interface TimeEntry {
  id: string;
  dailyTaskId: string | null;
  projectId: string | null;
  wbsId: string | null;
  startTime: Date;
}

interface StopwatchIntegratedProps {
  dailyTasks: DailyTask[];
  onEntryChange?: () => void;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function StopwatchIntegrated({
  dailyTasks,
  onEntryChange,
}: StopwatchIntegratedProps) {
  const { time, isRunning, start, reset, setTime } = useStopwatch();
  const [projects, setProjects] = useState<Project[]>([]);
  const [wbsList, setWbsList] = useState<Wbs[]>([]);
  const [selectedDailyTaskId, setSelectedDailyTaskId] = useState<string>("");
  const [selectedProjectWbs, setSelectedProjectWbs] = useState<string>(""); // Format: "projectId:wbsId"
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);

  const fetchProjects = useCallback(async () => {
    const response = await fetch("/api/projects");
    const data = await response.json();
    setProjects(data);

    // Flatten WBS list from all projects
    const allWbs = data.flatMap((project: Project & { wbsList: Wbs[] }) =>
      project.wbsList.map((wbs) => ({
        ...wbs,
        projectId: project.id,
      }))
    );
    setWbsList(allWbs);
  }, []);

  const fetchActiveEntry = useCallback(async () => {
    const response = await fetch("/api/time-entries/active");
    const data = await response.json();
    if (data) {
      setActiveEntry(data);
      setSelectedDailyTaskId(data.dailyTaskId || "");
      if (data.projectId && data.wbsId) {
        setSelectedProjectWbs(`${data.projectId}:${data.wbsId}`);
      }
      start(new Date(data.startTime));
    }
  }, [start]);

  useEffect(() => {
    fetchProjects();
    fetchActiveEntry();
  }, [fetchProjects, fetchActiveEntry]);

  const handleStart = async () => {
    // Parse selected project and WBS
    let projectId = null;
    let wbsId = null;
    if (selectedProjectWbs && selectedProjectWbs !== "none") {
      const [pId, wId] = selectedProjectWbs.split(":");
      projectId = pId;
      wbsId = wId;
    }

    const response = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dailyTaskId: selectedDailyTaskId || null,
        projectId,
        wbsId,
      }),
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
        <CardTitle>タイマー</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-5xl font-mono font-bold tabular-nums">
            {formatTime(time)}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="daily-task">
              タスク <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedDailyTaskId || "none"}
              onValueChange={(value) =>
                setSelectedDailyTaskId(value === "none" ? "" : value)
              }
              disabled={isRunning}
            >
              <SelectTrigger id="daily-task">
                <SelectValue placeholder="タスクを選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  タスクを選択してください
                </SelectItem>
                {dailyTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="project-wbs">プロジェクト・WBS（任意）</Label>
            <Select
              value={selectedProjectWbs || "none"}
              onValueChange={(value) =>
                setSelectedProjectWbs(value === "none" ? "" : value)
              }
              disabled={isRunning}
            >
              <SelectTrigger id="project-wbs">
                <SelectValue placeholder="プロジェクト・WBSを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし</SelectItem>
                {projects.map((project) =>
                  project.wbsList && project.wbsList.length > 0 ? (
                    project.wbsList.map((wbs: Wbs) => (
                      <SelectItem
                        key={`${project.id}:${wbs.id}`}
                        value={`${project.id}:${wbs.id}`}
                      >
                        {project.abbreviation || project.code}■{wbs.name}
                      </SelectItem>
                    ))
                  ) : null
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              className="flex-1"
              size="lg"
              disabled={!selectedDailyTaskId || selectedDailyTaskId === "none"}
            >
              <Play className="mr-2 h-5 w-5" />
              開始
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              <Square className="mr-2 h-5 w-5" />
              停止
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
      </CardContent>
    </Card>
  );
}
