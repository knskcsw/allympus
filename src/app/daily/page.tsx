"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays, startOfDay } from "date-fns";
import DailyAttendanceBanner from "@/components/daily/DailyAttendanceBanner";
import DailyTaskPanel from "@/components/daily/DailyTaskPanel";
import StopwatchIntegrated from "@/components/daily/StopwatchIntegrated";
import DailyTimeEntryTable from "@/components/daily/DailyTimeEntryTable";
import WbsSummaryCard from "@/components/daily/WbsSummaryCard";

export default function DailyPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch daily data
  const fetchDailyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(`/api/daily?date=${dateStr}`);
      const dailyData = await response.json();
      setData(dailyData);
    } catch (error) {
      console.error("Failed to fetch daily data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // Fetch projects (for dropdowns)
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      const projectsData = await response.json();
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  // Auto-copy incomplete tasks from previous day
  const autoCopyIncompleteTasks = useCallback(async () => {
    try {
      const yesterday = subDays(selectedDate, 1);
      const fromDateStr = format(yesterday, "yyyy-MM-dd");
      const toDateStr = format(selectedDate, "yyyy-MM-dd");

      // Check if there are incomplete tasks from yesterday
      const checkResponse = await fetch(
        `/api/daily-tasks?date=${fromDateStr}&status=TODO&status=IN_PROGRESS`
      );
      const incompleteTasks = await checkResponse.json();

      // Only copy if there are incomplete tasks and today has no tasks yet
      if (incompleteTasks.length > 0) {
        const todayResponse = await fetch(
          `/api/daily-tasks?date=${toDateStr}`
        );
        const todayTasks = await todayResponse.json();

        if (todayTasks.length === 0) {
          // Copy incomplete tasks to today
          await fetch("/api/daily-tasks/copy-incomplete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromDate: fromDateStr,
              toDate: toDateStr,
            }),
          });
        }
      }
    } catch (error) {
      console.error("Failed to auto-copy incomplete tasks:", error);
    }
  }, [selectedDate]);

  useEffect(() => {
    autoCopyIncompleteTasks().then(() => {
      fetchDailyData();
    });
    fetchProjects();
  }, [autoCopyIncompleteTasks, fetchDailyData, fetchProjects]);

  // Task handlers
  const handleTaskCreate = async (taskData: any) => {
    try {
      const response = await fetch("/api/daily-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskData,
          date: selectedDate,
        }),
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleTaskUpdate = async (id: string, taskData: any) => {
    try {
      const response = await fetch(`/api/daily-tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleTaskDelete = async (id: string) => {
    if (!confirm("このタスクを削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/daily-tasks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleTaskStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/daily-tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  // TimeEntry handlers
  const handleTimeEntryUpdate = async (id: string, entryData: any) => {
    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to update time entry:", error);
    }
  };

  const handleTimeEntryDelete = async (id: string) => {
    if (!confirm("この稼働実績を削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/time-entries/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchDailyData();
      }
    } catch (error) {
      console.error("Failed to delete time entry:", error);
    }
  };

  // Date change handler
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Top: Attendance Banner with Date Navigation */}
      <DailyAttendanceBanner
        attendance={data.attendance}
        currentDate={selectedDate}
        onDateChange={handleDateChange}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Tasks (col-span-3) */}
        <div className="col-span-3">
          <DailyTaskPanel
            date={selectedDate}
            tasks={data.dailyTasks || []}
            onTaskCreate={handleTaskCreate}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTaskStatusChange={handleTaskStatusChange}
          />
        </div>

        {/* Middle: Time Tracking & Entries (col-span-6) */}
        <div className="col-span-6 space-y-4">
          <StopwatchIntegrated
            dailyTasks={data.dailyTasks || []}
            onEntryChange={fetchDailyData}
          />
          <DailyTimeEntryTable
            entries={data.timeEntries || []}
            dailyTasks={data.dailyTasks || []}
            projects={projects}
            onUpdate={handleTimeEntryUpdate}
            onDelete={handleTimeEntryDelete}
          />
        </div>

        {/* Right: Summary (col-span-3) */}
        <div className="col-span-3">
          <WbsSummaryCard summary={data.wbsSummary || []} />
        </div>
      </div>
    </div>
  );
}
