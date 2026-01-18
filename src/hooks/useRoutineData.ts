import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { TemplateItem, RoutineTask } from "@/types/routine";

type UseRoutineDataReturn = {
  templateItems: TemplateItem[];
  routineTasks: RoutineTask[];
  isLoading: boolean;
  errorMessage: string | null;
  fetchRoutineData: () => Promise<void>;
};

export function useRoutineData(): UseRoutineDataReturn {
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRoutineData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [templates, tasks] = await Promise.all([
        apiRequest<TemplateItem[]>("/api/morning-routine-template"),
        apiRequest<RoutineTask[]>("/api/routine-tasks"),
      ]);
      setTemplateItems(templates || []);
      setRoutineTasks(tasks || []);
    } catch (error) {
      console.error("Failed to load routine data:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load routine data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutineData();
  }, [fetchRoutineData]);

  return {
    templateItems,
    routineTasks,
    isLoading,
    errorMessage,
    fetchRoutineData,
  };
}
