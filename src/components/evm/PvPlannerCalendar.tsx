"use client";

import { memo, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { FixedTask, Holiday, ProjectSeries } from "./types";
import { WEEKDAY_LABELS } from "./constants";
import {
  getCalendarPadding,
  getHolidayForDay,
  getWeekdayDates,
  getWeekdaysInMonth,
  getWorkingDays,
} from "./utils";
import { CalendarDayCell } from "./CalendarDayCell";

type PvPlannerCalendarProps = {
  currentDate: Date;
  days: string[];
  selectedProject: ProjectSeries | undefined;
  holidays: Holiday[];
  tasksByDay: Record<string, FixedTask[]>;
  isTaskLoading: boolean;
  selectedDates: string[];
  onSelectedDatesChange: (dates: string[]) => void;
  onDeleteTask: (taskId: string) => void;
};

function PvPlannerCalendarComponent({
  currentDate,
  days,
  selectedProject,
  holidays,
  tasksByDay,
  isTaskLoading,
  selectedDates,
  onSelectedDatesChange,
  onDeleteTask,
}: PvPlannerCalendarProps) {
  const weekdays = useMemo(
    () => getWeekdaysInMonth(currentDate),
    [currentDate]
  );
  const padding = useMemo(() => getCalendarPadding(weekdays), [weekdays]);

  const selectAllWorkingDays = useCallback(() => {
    const workingDays = getWorkingDays(currentDate, holidays);
    onSelectedDatesChange(Array.from(new Set(workingDays)));
  }, [currentDate, holidays, onSelectedDatesChange]);

  const clearSelectedDates = useCallback(() => {
    onSelectedDatesChange([]);
  }, [onSelectedDatesChange]);

  const toggleWeekdaySelection = useCallback(
    (weekday: number) => {
      const dates = getWeekdayDates(currentDate, weekday, holidays);
      const allSelected = dates.every((date) => selectedDates.includes(date));
      if (allSelected) {
        onSelectedDatesChange(
          selectedDates.filter((date) => !dates.includes(date))
        );
      } else {
        const merged = new Set(selectedDates);
        dates.forEach((date) => merged.add(date));
        onSelectedDatesChange(Array.from(merged));
      }
    },
    [currentDate, holidays, selectedDates, onSelectedDatesChange]
  );

  const toggleDateSelection = useCallback(
    (day: string) => {
      if (selectedDates.includes(day)) {
        onSelectedDatesChange(selectedDates.filter((item) => item !== day));
      } else {
        onSelectedDatesChange([...selectedDates, day]);
      }
    },
    [selectedDates, onSelectedDatesChange]
  );

  const paddingCells = useMemo(
    () =>
      Array.from({ length: padding }).map((_, index) => (
        <div key={`calendar-pad-${index}`} />
      )),
    [padding]
  );

  const dayCells = useMemo(
    () =>
      weekdays.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const holiday = getHolidayForDay(day, holidays);
        const isSelected = selectedDates.includes(key);
        const tasks = tasksByDay[key] ?? [];
        const fixedHours = tasks.reduce(
          (acc, task) => acc + task.estimatedMinutes / 60,
          0
        );
        const pvIndex = days.indexOf(key);
        const pvHours =
          pvIndex >= 0 ? (selectedProject?.pvSeries[pvIndex] ?? 0) : 0;

        return (
          <CalendarDayCell
            key={key}
            day={day}
            dateKey={key}
            holiday={holiday}
            isSelected={isSelected}
            tasks={tasks}
            isTaskLoading={isTaskLoading}
            fixedHours={fixedHours}
            pvHours={pvHours}
            onToggleDate={toggleDateSelection}
            onDeleteTask={onDeleteTask}
          />
        );
      }),
    [
      weekdays,
      holidays,
      selectedDates,
      tasksByDay,
      days,
      selectedProject,
      isTaskLoading,
      toggleDateSelection,
      onDeleteTask,
    ]
  );

  return (
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
        {WEEKDAY_LABELS.map((label, index) => (
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
        {paddingCells}
        {dayCells}
      </div>
      <div className="text-xs text-muted-foreground">
        選択中: {selectedDates.length}日
      </div>
    </div>
  );
}

export const PvPlannerCalendar = memo(PvPlannerCalendarComponent);
