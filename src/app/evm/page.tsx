"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import EvmLineChart from "@/components/evm/EvmLineChart";
import type { Holiday } from "@/generated/prisma/client";

type ProjectSeries = {
  projectId: string;
  projectName: string;
  acSeries: number[];
  pvSeries: number[];
  totals: {
    acHours: number;
    pvHours: number;
    fixedHours: number;
    estimatedHours: number;
  };
};

type EvmData = {
  period: { start: string; end: string };
  days: string[];
  projects: ProjectSeries[];
};

type FixedTask = {
  id: string;
  date: string;
  title: string;
  estimatedMinutes: number;
  projectId: string;
  project?: { id: string; name: string };
};

function getFiscalYear(year: number, month: number) {
  const fiscalYear = month >= 4 ? year : year - 1;
  const suffix = String(fiscalYear % 100).padStart(2, "0");
  return `FY${suffix}`;
}

const HOLIDAY_TYPE_COLORS: Record<string, string> = {
  PUBLIC_HOLIDAY:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-700",
  SPECIAL_HOLIDAY:
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-700",
  PAID_LEAVE:
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-700",
};

function formatHours(value: number) {
  return `${value.toFixed(1)}h`;
}

export default function EvmPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<EvmData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"daily" | "cumulative">("cumulative");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [fixedTasks, setFixedTasks] = useState<FixedTask[]>([]);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [isTaskSaving, setIsTaskSaving] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskHours, setTaskHours] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const pvColor = "#3b82f6";
  const acColor = "#ef4444";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/evm?year=${year}&month=${month}`);
    const result = await response.json();
    setData(result);
    setIsLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchHolidays = useCallback(async () => {
    const fiscalYear = getFiscalYear(year, month);
    const response = await fetch(`/api/holidays?fiscalYear=${fiscalYear}`);
    const result = await response.json();
    setHolidays(result);
  }, [month, year]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const fetchFixedTasks = useCallback(
    async (projectId: string) => {
      if (!projectId) return;
      setIsTaskLoading(true);
      const response = await fetch(
        `/api/evm-fixed-tasks?year=${year}&month=${month}&projectId=${projectId}`
      );
      const result = await response.json();
      setFixedTasks(result);
      setIsTaskLoading(false);
    },
    [month, year]
  );

  useEffect(() => {
    if (!data) return;
    if (!selectedProjectId && data.projects.length > 0) {
      setSelectedProjectId(data.projects[0].projectId);
    }
  }, [data, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    fetchFixedTasks(selectedProjectId);
  }, [fetchFixedTasks, selectedProjectId]);

  useEffect(() => {
    setSelectedDates([]);
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getWeekdayDates = (weekday: number) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
      .filter((day) => day.getDay() === weekday)
      .filter((day) => !getHolidayForDay(day))
      .map((day) => format(day, "yyyy-MM-dd"));
  };

  const selectAllWorkingDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
      .filter((day) => day.getDay() >= 1 && day.getDay() <= 5)
      .filter((day) => !getHolidayForDay(day))
      .map((day) => format(day, "yyyy-MM-dd"));
    setSelectedDates(Array.from(new Set(days)));
  };

  const toggleWeekdaySelection = (weekday: number) => {
    const dates = getWeekdayDates(weekday);
    setSelectedDates((prev) => {
      const allSelected = dates.every((date) => prev.includes(date));
      if (allSelected) {
        return prev.filter((date) => !dates.includes(date));
      }
      const merged = new Set(prev);
      dates.forEach((date) => merged.add(date));
      return Array.from(merged);
    });
  };

  const getHolidayForDay = (day: Date) =>
    holidays.find((holiday) => isSameDay(new Date(holiday.date), day));

  const toggleDateSelection = (day: string) => {
    setSelectedDates((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
    );
  };

  const clearSelectedDates = () => {
    setSelectedDates([]);
  };

  const handleAddFixedTask = async () => {
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
    setIsTaskSaving(true);
    await Promise.all(
      selectedDates.map((date) =>
        fetch("/api/evm-fixed-tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date,
            title: taskTitle.trim(),
            estimatedMinutes,
            projectId: selectedProjectId,
          }),
        })
      )
    );
    setTaskTitle("");
    setTaskHours("");
    setSelectedDates([]);
    setIsTaskSaving(false);
    await Promise.all([fetchData(), fetchFixedTasks(selectedProjectId)]);
  };

  const handleDeleteFixedTask = async (id: string) => {
    await fetch(`/api/evm-fixed-tasks/${id}`, {
      method: "DELETE",
    });
    await Promise.all([fetchData(), fetchFixedTasks(selectedProjectId)]);
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  const selectedProject = data.projects.find(
    (project) => project.projectId === selectedProjectId
  );
  const tasksByDay = data.days.reduce<Record<string, FixedTask[]>>((acc, day) => {
    acc[day] = [];
    return acc;
  }, {});
  for (const task of fixedTasks) {
    const taskDay = format(new Date(task.date), "yyyy-MM-dd");
    if (tasksByDay[taskDay]) {
      tasksByDay[taskDay].push(task);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">EVM</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border bg-background p-1 shadow-sm">
            <Button
              variant={viewMode === "cumulative" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cumulative")}
              className="rounded-full"
            >
              積算
            </Button>
            <Button
              variant={viewMode === "daily" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("daily")}
              className="rounded-full"
            >
              日別
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium min-w-[120px] text-center">
              {format(currentDate, "yyyy年 M月", { locale: ja })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {data.projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No projects for this period
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {data.projects.map((project) => {
              const cumulative = (values: number[]) => {
                let sum = 0;
                return values.map((value) => {
                  sum += value;
                  return sum;
                });
              };
              const pvSeries = viewMode === "daily" ? project.pvSeries : cumulative(project.pvSeries);
              const acSeries = viewMode === "daily" ? project.acSeries : cumulative(project.acSeries);

              return (
                <Card key={project.projectId} className="relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary))/12,_transparent_55%)]" />
                  <CardHeader className="pb-2">
                    <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
                      <span>{project.projectName}</span>
                      <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                        PV {formatHours(project.totals.pvHours)} / AC {formatHours(project.totals.acHours)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <EvmLineChart
                      dates={data.days}
                      series={[
                        {
                          label: "PV",
                          color: pvColor,
                          data: pvSeries,
                        },
                        {
                          label: "AC",
                          color: acColor,
                          data: acSeries,
                        },
                      ]}
                    />
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pvColor }} />
                        PV
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: acColor }} />
                        AC
                      </span>
                      <span>
                        Fixed {formatHours(project.totals.fixedHours)} / Est {formatHours(project.totals.estimatedHours)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="space-y-1">
                <CardTitle>PV Planner</CardTitle>
              </div>
              <div className="w-full md:w-[260px] md:ml-auto md:flex md:justify-end">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="プロジェクトを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.projects.map((project) => (
                      <SelectItem key={project.projectId} value={project.projectId}>
                        {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>日付選択</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllWorkingDays}>
                      全選択
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearSelectedDates}>
                      全解除
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground">
                  {["月", "火", "水", "木", "金"].map((label, index) => (
                    <Button
                      key={label}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-0 text-xs font-medium text-muted-foreground"
                      onClick={() => toggleWeekdaySelection(index + 1)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {(() => {
                    const monthStart = startOfMonth(currentDate);
                    const monthEnd = endOfMonth(currentDate);
                    const allDays = eachDayOfInterval({
                      start: monthStart,
                      end: monthEnd,
                    });
                    const weekdays = allDays.filter((day) => {
                      const dayOfWeek = day.getDay();
                      return dayOfWeek >= 1 && dayOfWeek <= 5;
                    });
                    const firstWeekday = weekdays[0];
                    const padding =
                      firstWeekday && firstWeekday.getDay() > 0
                        ? firstWeekday.getDay() - 1
                        : 0;
                    const cells = Array.from({ length: padding }).map(
                      (_, index) => <div key={`calendar-pad-${index}`} />
                    );

                    weekdays.forEach((day) => {
                      const key = format(day, "yyyy-MM-dd");
                      const holiday = getHolidayForDay(day);
                      const isSelected = selectedDates.includes(key);
                      const colorClass = holiday
                        ? HOLIDAY_TYPE_COLORS[holiday.type] ?? ""
                        : "";
                      const tasks = tasksByDay[key] ?? [];
                      const fixedHours = tasks.reduce(
                        (acc, task) => acc + task.estimatedMinutes / 60,
                        0
                      );
                      const pvIndex = data.days.indexOf(key);
                      const pvHours = pvIndex >= 0 ? selectedProject?.pvSeries[pvIndex] ?? 0 : 0;
                      const variableHours = Math.max(pvHours - fixedHours, 0);

                      cells.push(
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleDateSelection(key)}
                          className={[
                            "min-h-[150px] rounded-md border p-2 text-left transition",
                            isSelected ? "ring-2 ring-primary" : "hover:border-primary/60",
                            colorClass,
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              {format(day, "M/d (EEE)", { locale: ja })}
                            </span>
                            {holiday ? (
                              <span className="text-[10px] font-medium">
                                {holiday.name}
                              </span>
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
                                <div key={task.id} className="flex items-center justify-between gap-2">
                                  <span className="text-[11px]">
                                    {task.title} ({formatHours(task.estimatedMinutes / 60)})
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleDeleteFixedTask(task.id);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </button>
                      );
                    });

                    return cells;
                  })()}
                </div>
                <div className="text-xs text-muted-foreground">
                  選択中: {selectedDates.length}日
                </div>
              </div>
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
                <Button onClick={handleAddFixedTask} disabled={isTaskSaving || !selectedProjectId}>
                  {isTaskSaving ? "登録中..." : "固定タスクを追加"}
                </Button>
                {taskError ? <span className="text-sm text-destructive">{taskError}</span> : null}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
