"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { startOfDay } from "date-fns";
import DailyAttendanceBanner from "@/components/daily/DailyAttendanceBanner";
import DailyTaskPanel from "@/components/daily/DailyTaskPanel";
import DailyTimeEntryTable from "@/components/daily/DailyTimeEntryTable";
import WbsSummaryCard from "@/components/daily/WbsSummaryCard";
import MorningRoutineCard from "@/components/daily/MorningRoutineCard";
import CheckInCard from "@/components/daily/CheckInCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDailyData } from "@/hooks/useDailyData";
import { useMorningRoutine } from "@/hooks/useMorningRoutine";
import {
  calculateBreakMinutesFromEntries,
  calculateTotalWorkingHours,
} from "@/lib/daily-utils";
import type { DailyData } from "@/types/daily";

// Loading component
function LoadingView() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-sm">読み込み中...</div>
    </div>
  );
}

// Error component
function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-screen px-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>読み込みに失敗しました</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button onClick={onRetry}>再読み込み</Button>
        </CardContent>
      </Card>
    </div>
  );
}

// No data component
function NoDataView() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-sm">データが見つかりません</div>
    </div>
  );
}

// Future date component
function FutureDateView() {
  return (
    <Card>
      <CardContent className="py-10 text-center text-muted-foreground">
        未来の日付は表示できません
      </CardContent>
    </Card>
  );
}

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [internalData, setInternalData] = useState<DailyData | null>(null);

  // Custom hooks for data management
  const {
    data: fetchedData,
    projects,
    workScheduleTemplates,
    isLoading,
    errorMessage,
    refetch,
    handleTaskCreate,
    handleTaskUpdate,
    handleTaskDelete,
    handleTaskStatusChange,
    handleTimeEntryCreate,
    handleTimeEntryUpdate,
    handleTimeEntryDelete,
    handleCheckIn,
    handleClockOut,
  } = useDailyData(selectedDate);

  // Use fetched data or internal data for optimistic updates
  const data = internalData ?? fetchedData;

  // Sync fetched data to internal state
  const setData = useCallback((updater: React.SetStateAction<DailyData | null>) => {
    if (typeof updater === "function") {
      setInternalData((prev) => updater(prev ?? fetchedData));
    } else {
      setInternalData(updater);
    }
  }, [fetchedData]);

  // Reset internal data when fetched data changes
  useEffect(() => {
    setInternalData(null);
  }, [fetchedData]);

  // Morning routine management
  const morningRoutine = useMorningRoutine({
    selectedDate,
    data,
    setData,
    onDataRefresh: refetch,
  });

  // Memoized calculations
  const breakMinutesFromEntries = useMemo(
    () => calculateBreakMinutesFromEntries(data?.timeEntries || []),
    [data?.timeEntries]
  );

  const totalWorkingHours = useMemo(
    () =>
      calculateTotalWorkingHours(
        data?.attendance || null,
        breakMinutesFromEntries
      ),
    [data?.attendance, breakMinutesFromEntries]
  );

  // Date-related calculations
  const today = useMemo(() => startOfDay(new Date()), []);
  const selectedStart = useMemo(() => startOfDay(selectedDate), [selectedDate]);
  const isFutureDate = selectedStart > today;
  const hasCheckedIn = Boolean(data?.attendance?.clockIn);
  const canClockOut = hasCheckedIn && selectedStart.getTime() === today.getTime();

  // Date change handler - prevent future dates
  const handleDateChange = useCallback(
    (newDate: Date) => {
      if (startOfDay(newDate) > today) return;
      setSelectedDate(newDate);
    },
    [today]
  );

  // Render loading state
  if (isLoading) {
    return <LoadingView />;
  }

  // Render error state
  if (errorMessage) {
    return <ErrorView message={errorMessage} onRetry={refetch} />;
  }

  // Render no data state
  if (!data) {
    return <NoDataView />;
  }

  return (
    <div
      className={`space-y-4 p-6 min-h-screen text-sm ${
        morningRoutine.isRoutineComplete
          ? ""
          : "bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100"
      }`}
    >
      {/* Top: Attendance Banner with Date Navigation */}
      <DailyAttendanceBanner
        attendance={data.attendance}
        currentDate={selectedDate}
        onDateChange={handleDateChange}
        maxDate={today}
        onClockOut={handleClockOut}
        showClockOut={canClockOut}
        onAttendanceUpdated={refetch}
        additionalBreakMinutes={Math.round(breakMinutesFromEntries)}
      />

      {isFutureDate ? (
        <FutureDateView />
      ) : !hasCheckedIn ? (
        <CheckInCard selectedDate={selectedDate} onCheckIn={handleCheckIn} />
      ) : (
        <>
          {/* Morning Routine and WBS Summary */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[35%_65%]">
            <MorningRoutineCard
              routineItems={morningRoutine.routineItems}
              isOpen={morningRoutine.isRoutineOpen}
              onOpenChange={morningRoutine.setIsRoutineOpen}
              routineTitleDraft={morningRoutine.routineTitleDraft}
              onRoutineTitleDraftChange={morningRoutine.setRoutineTitleDraft}
              editingRoutineId={morningRoutine.editingRoutineId}
              editingRoutineTitle={morningRoutine.editingRoutineTitle}
              onEditingRoutineTitleChange={morningRoutine.setEditingRoutineTitle}
              isSubmitting={morningRoutine.isRoutineSubmitting}
              isImporting={morningRoutine.isRoutineImporting}
              onToggle={morningRoutine.handleRoutineToggle}
              onCreate={morningRoutine.handleRoutineCreate}
              onImport={morningRoutine.handleRoutineImport}
              onEditStart={morningRoutine.handleRoutineEditStart}
              onEditCancel={morningRoutine.handleRoutineEditCancel}
              onEditSave={morningRoutine.handleRoutineEditSave}
              onDelete={morningRoutine.handleRoutineDelete}
            />
            <WbsSummaryCard
              summary={data.wbsSummary || []}
              totalWorkingHours={totalWorkingHours}
            />
          </div>

          {/* Tasks and Time Entries */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[35%_65%]">
            <div>
              <DailyTaskPanel
                date={selectedDate}
                tasks={data.dailyTasks || []}
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
                onTaskStatusChange={handleTaskStatusChange}
              />
            </div>
            <div className="space-y-4">
              <DailyTimeEntryTable
                entries={data.timeEntries || []}
                dailyTasks={data.dailyTasks || []}
                routineTasks={data.routineTasks || []}
                projects={projects}
                onUpdate={handleTimeEntryUpdate}
                onDelete={handleTimeEntryDelete}
                onCreate={handleTimeEntryCreate}
                selectedDate={selectedDate}
                attendanceClockIn={data.attendance?.clockIn ?? null}
                attendanceClockOut={data.attendance?.clockOut ?? null}
                workScheduleTemplates={workScheduleTemplates}
                onTemplateImport={refetch}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
