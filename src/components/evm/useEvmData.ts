"use client";

import { useCallback, useEffect, useState } from "react";
import type { EvmData, FixedTask, Holiday } from "./types";
import { getFiscalYear } from "./utils";

type UseEvmDataReturn = {
  data: EvmData | null;
  isLoading: boolean;
  fixedTasks: FixedTask[];
  isTaskLoading: boolean;
  holidays: Holiday[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  refetchData: () => Promise<void>;
  refetchFixedTasks: (projectId: string) => Promise<void>;
  addFixedTask: (params: {
    date: string;
    title: string;
    estimatedMinutes: number;
    projectId: string;
  }) => Promise<void>;
  deleteFixedTask: (id: string) => Promise<void>;
};

export function useEvmData(year: number, month: number): UseEvmDataReturn {
  const [data, setData] = useState<EvmData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fixedTasks, setFixedTasks] = useState<FixedTask[]>([]);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/evm?year=${year}&month=${month}`);
      const result = await response.json();
      setData(result);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  const fetchHolidays = useCallback(async () => {
    const fiscalYear = getFiscalYear(year, month);
    const response = await fetch(`/api/holidays?fiscalYear=${fiscalYear}`);
    const result = await response.json();
    setHolidays(result);
  }, [month, year]);

  const fetchFixedTasks = useCallback(
    async (projectId: string) => {
      if (!projectId) return;
      setIsTaskLoading(true);
      try {
        const response = await fetch(
          `/api/evm-fixed-tasks?year=${year}&month=${month}&projectId=${projectId}`
        );
        const result = await response.json();
        setFixedTasks(result);
      } finally {
        setIsTaskLoading(false);
      }
    },
    [month, year]
  );

  const addFixedTask = useCallback(
    async (params: {
      date: string;
      title: string;
      estimatedMinutes: number;
      projectId: string;
    }) => {
      await fetch("/api/evm-fixed-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
    },
    []
  );

  const deleteFixedTask = useCallback(async (id: string) => {
    await fetch(`/api/evm-fixed-tasks/${id}`, { method: "DELETE" });
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch holidays
  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Auto-select first project
  useEffect(() => {
    if (!data) return;
    if (!selectedProjectId && data.projects.length > 0) {
      setSelectedProjectId(data.projects[0].projectId);
    }
  }, [data, selectedProjectId]);

  // Fetch fixed tasks when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    fetchFixedTasks(selectedProjectId);
  }, [fetchFixedTasks, selectedProjectId]);

  return {
    data,
    isLoading,
    fixedTasks,
    isTaskLoading,
    holidays,
    selectedProjectId,
    setSelectedProjectId,
    refetchData: fetchData,
    refetchFixedTasks: fetchFixedTasks,
    addFixedTask,
    deleteFixedTask,
  };
}
