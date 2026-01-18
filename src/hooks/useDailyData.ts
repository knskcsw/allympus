"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import type {
  DailyData,
  DailyTask,
  Project,
  WorkScheduleTemplate,
  TimeEntryCreateData,
  TimeEntryUpdateData,
  CheckInData,
} from "@/types/daily";
import { fetchApi } from "@/lib/daily-utils";

interface UseDailyDataReturn {
  // State
  data: DailyData | null;
  projects: Project[];
  workScheduleTemplates: WorkScheduleTemplate[];
  isLoading: boolean;
  errorMessage: string | null;

  // Actions
  refetch: () => Promise<void>;

  // Task handlers
  handleTaskCreate: (taskData: Partial<DailyTask>) => Promise<void>;
  handleTaskUpdate: (id: string, taskData: Partial<DailyTask>) => Promise<void>;
  handleTaskDelete: (id: string) => Promise<void>;
  handleTaskStatusChange: (id: string, status: string) => Promise<void>;

  // Time entry handlers
  handleTimeEntryCreate: (entryData: TimeEntryCreateData) => Promise<void>;
  handleTimeEntryUpdate: (id: string, entryData: TimeEntryUpdateData) => Promise<void>;
  handleTimeEntryDelete: (id: string) => Promise<void>;

  // Attendance handlers
  handleCheckIn: (checkInData: CheckInData) => Promise<boolean>;
  handleClockOut: () => Promise<void>;
}

export function useDailyData(selectedDate: Date): UseDailyDataReturn {
  const [data, setData] = useState<DailyData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workScheduleTemplates, setWorkScheduleTemplates] = useState<WorkScheduleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch daily data
  const fetchDailyData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const dailyData = await fetchApi<DailyData>(`/api/daily?date=${dateStr}`);
      setData(dailyData);
    } catch (error) {
      console.error("Failed to fetch daily data:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to fetch daily data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const projectsData = await fetchApi<Project[]>("/api/projects");
      setProjects(projectsData || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  // Fetch work schedule templates
  const fetchWorkScheduleTemplates = useCallback(async () => {
    try {
      const templatesData = await fetchApi<WorkScheduleTemplate[]>(
        "/api/work-schedule-templates"
      );
      setWorkScheduleTemplates(templatesData || []);
    } catch (error) {
      console.error("Failed to fetch work schedule templates:", error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDailyData();
    fetchProjects();
    fetchWorkScheduleTemplates();
  }, [fetchDailyData, fetchProjects, fetchWorkScheduleTemplates]);

  // Task handlers
  const handleTaskCreate = useCallback(
    async (taskData: Partial<DailyTask>) => {
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
        } else {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            alert(errorData.error || "タスクの作成に失敗しました");
          } catch {
            alert("タスクの作成に失敗しました");
          }
        }
      } catch (error) {
        console.error("Failed to create task:", error);
        alert("タスクの作成に失敗しました");
      }
    },
    [selectedDate, fetchDailyData]
  );

  const handleTaskUpdate = useCallback(
    async (id: string, taskData: Partial<DailyTask>) => {
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
    },
    [fetchDailyData]
  );

  const handleTaskDelete = useCallback(
    async (id: string) => {
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
    },
    [fetchDailyData]
  );

  const handleTaskStatusChange = useCallback(
    async (id: string, status: string) => {
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
    },
    [fetchDailyData]
  );

  // Time entry handlers
  const handleTimeEntryCreate = useCallback(
    async (entryData: TimeEntryCreateData) => {
      try {
        const response = await fetch("/api/time-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entryData),
        });

        if (response.ok) {
          fetchDailyData();
        } else {
          const error = await response.json();
          console.error("Failed to create time entry:", error);
          alert("稼働実績の作成に失敗しました");
        }
      } catch (error) {
        console.error("Failed to create time entry:", error);
        alert("稼働実績の作成に失敗しました");
      }
    },
    [fetchDailyData]
  );

  const handleTimeEntryUpdate = useCallback(
    async (id: string, entryData: TimeEntryUpdateData) => {
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
    },
    [fetchDailyData]
  );

  const handleTimeEntryDelete = useCallback(
    async (id: string) => {
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
    },
    [fetchDailyData]
  );

  // Attendance handlers
  const handleCheckIn = useCallback(
    async (checkInData: CheckInData): Promise<boolean> => {
      try {
        const response = await fetch("/api/attendance/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(checkInData),
        });

        if (response.ok) {
          fetchDailyData();
          return true;
        } else {
          const error = await response.json();
          console.error("Failed to check in:", error);
          alert("チェックインに失敗しました");
          return false;
        }
      } catch (error) {
        console.error("Failed to check in:", error);
        alert("チェックインに失敗しました");
        return false;
      }
    },
    [fetchDailyData]
  );

  const handleClockOut = useCallback(async () => {
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clockOut" }),
      });

      if (response.ok) {
        fetchDailyData();
      } else {
        const error = await response.json();
        console.error("Failed to clock out:", error);
        alert("退勤に失敗しました");
      }
    } catch (error) {
      console.error("Failed to clock out:", error);
      alert("退勤に失敗しました");
    }
  }, [fetchDailyData]);

  return {
    data,
    projects,
    workScheduleTemplates,
    isLoading,
    errorMessage,
    refetch: fetchDailyData,
    handleTaskCreate,
    handleTaskUpdate,
    handleTaskDelete,
    handleTaskStatusChange,
    handleTimeEntryCreate,
    handleTimeEntryUpdate,
    handleTimeEntryDelete,
    handleCheckIn,
    handleClockOut,
  };
}
