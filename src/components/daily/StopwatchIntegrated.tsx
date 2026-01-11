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
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedWbsId, setSelectedWbsId] = useState<string>("");
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
      setSelectedProjectId(data.projectId || "");
      setSelectedWbsId(data.wbsId || "");
      start(new Date(data.startTime));
    }
  }, [start]);

  useEffect(() => {
    fetchProjects();
    fetchActiveEntry();
  }, [fetchProjects, fetchActiveEntry]);

  // Filter WBS by selected project
  const filteredWbsList = selectedProjectId
    ? wbsList.filter((wbs) => wbs.projectId === selectedProjectId)
    : wbsList;

  // When project changes, reset WBS selection if it's not in the new project
  useEffect(() => {
    if (selectedProjectId && selectedWbsId) {
      const isWbsInProject = filteredWbsList.some(
        (wbs) => wbs.id === selectedWbsId
      );
      if (!isWbsInProject) {
        setSelectedWbsId("");
      }
    }
  }, [selectedProjectId, selectedWbsId, filteredWbsList]);

  const handleStart = async () => {
    const response = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dailyTaskId: selectedDailyTaskId || null,
        projectId: selectedProjectId || null,
        wbsId: selectedWbsId || null,
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
            <Label htmlFor="daily-task">タスク（任意）</Label>
            <Select
              value={selectedDailyTaskId || "none"}
              onValueChange={(value) =>
                setSelectedDailyTaskId(value === "none" ? "" : value)
              }
              disabled={isRunning}
            >
              <SelectTrigger id="daily-task">
                <SelectValue placeholder="タスクを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">タスクなし</SelectItem>
                {dailyTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="project">プロジェクト（任意）</Label>
            <Select
              value={selectedProjectId || "none"}
              onValueChange={(value) =>
                setSelectedProjectId(value === "none" ? "" : value)
              }
              disabled={isRunning}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="プロジェクトを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">プロジェクトなし</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="wbs">WBS（任意）</Label>
            <Select
              value={selectedWbsId || "none"}
              onValueChange={(value) =>
                setSelectedWbsId(value === "none" ? "" : value)
              }
              disabled={isRunning || !selectedProjectId}
            >
              <SelectTrigger id="wbs">
                <SelectValue placeholder="WBSを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">WBSなし</SelectItem>
                {filteredWbsList.map((wbs) => (
                  <SelectItem key={wbs.id} value={wbs.id}>
                    {wbs.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={handleStart} className="flex-1" size="lg">
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
