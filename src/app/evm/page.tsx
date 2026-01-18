"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addMonths, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EvmHeader } from "@/components/evm/EvmHeader";
import { EvmProjectCard } from "@/components/evm/EvmProjectCard";
import { PvPlannerCalendar } from "@/components/evm/PvPlannerCalendar";
import { PvPlannerForm } from "@/components/evm/PvPlannerForm";
import { useEvmData } from "@/components/evm/useEvmData";
import type { ViewMode } from "@/components/evm/types";
import { groupTasksByDay } from "@/components/evm/utils";

export default function EvmPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("cumulative");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isTaskSaving, setIsTaskSaving] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const {
    data,
    isLoading,
    fixedTasks,
    isTaskLoading,
    holidays,
    selectedProjectId,
    setSelectedProjectId,
    refetchData,
    refetchFixedTasks,
    addFixedTask,
    deleteFixedTask,
  } = useEvmData(year, month);

  // Reset selected dates when month changes
  useEffect(() => {
    setSelectedDates([]);
  }, [currentDate]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => addMonths(prev, 1));
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleAddFixedTask = useCallback(
    async (params: {
      dates: string[];
      title: string;
      estimatedMinutes: number;
    }) => {
      setIsTaskSaving(true);
      try {
        await Promise.all(
          params.dates.map((date) =>
            addFixedTask({
              date,
              title: params.title,
              estimatedMinutes: params.estimatedMinutes,
              projectId: selectedProjectId,
            })
          )
        );
        setSelectedDates([]);
        await Promise.all([refetchData(), refetchFixedTasks(selectedProjectId)]);
      } finally {
        setIsTaskSaving(false);
      }
    },
    [addFixedTask, selectedProjectId, refetchData, refetchFixedTasks]
  );

  const handleDeleteFixedTask = useCallback(
    async (id: string) => {
      await deleteFixedTask(id);
      await Promise.all([refetchData(), refetchFixedTasks(selectedProjectId)]);
    },
    [deleteFixedTask, refetchData, refetchFixedTasks, selectedProjectId]
  );

  const selectedProject = useMemo(
    () => data?.projects.find((project) => project.projectId === selectedProjectId),
    [data?.projects, selectedProjectId]
  );

  const tasksByDay = useMemo(
    () => (data ? groupTasksByDay(fixedTasks, data.days) : {}),
    [fixedTasks, data]
  );

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <EvmHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {data.projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No projects for this period
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {data.projects.map((project) => (
              <EvmProjectCard
                key={project.projectId}
                project={project}
                days={data.days}
                viewMode={viewMode}
              />
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="space-y-1">
                <CardTitle>PV Planner</CardTitle>
              </div>
              <div className="w-full md:w-[260px] md:ml-auto md:flex md:justify-end">
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="プロジェクトを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.projects.map((project) => (
                      <SelectItem
                        key={project.projectId}
                        value={project.projectId}
                      >
                        {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <PvPlannerCalendar
                currentDate={currentDate}
                days={data.days}
                selectedProject={selectedProject}
                holidays={holidays}
                tasksByDay={tasksByDay}
                isTaskLoading={isTaskLoading}
                selectedDates={selectedDates}
                onSelectedDatesChange={setSelectedDates}
                onDeleteTask={handleDeleteFixedTask}
              />
              <PvPlannerForm
                selectedDates={selectedDates}
                selectedProjectId={selectedProjectId}
                isSaving={isTaskSaving}
                onAddTask={handleAddFixedTask}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
