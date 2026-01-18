import { useCallback, useState } from "react";
import {
  type Project,
  type WorkHoursData,
  type VacationData,
  type WorkingDaysData,
  type WorkHoursField,
  FISCAL_YEAR,
  MONTHS,
  DEFAULT_WORKING_DAYS,
  roundToTenth,
  createDefaultMonthlyWorkHours,
} from "@/components/kadmin/types";

interface UseKadminDataReturn {
  projects: Project[];
  workHoursData: WorkHoursData;
  vacationData: VacationData;
  workingDaysData: WorkingDaysData;
  loading: boolean;
  saving: boolean;
  calculating: boolean;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setWorkHoursData: React.Dispatch<React.SetStateAction<WorkHoursData>>;
  setVacationData: React.Dispatch<React.SetStateAction<VacationData>>;
  fetchAllData: () => Promise<void>;
  handleCellChange: (
    projectId: string,
    month: number,
    field: WorkHoursField,
    value: number
  ) => void;
  handleVacationChange: (month: number, value: number) => void;
  handleCalculateActual: () => Promise<void>;
  handleSave: () => Promise<boolean>;
  updateProjectOrder: (projectIds: string[]) => Promise<void>;
}

export function useKadminData(
  onCalculateSuccess?: () => void,
  onCalculateError?: () => void
): UseKadminDataReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workHoursData, setWorkHoursData] = useState<WorkHoursData>({});
  const [vacationData, setVacationData] = useState<VacationData>({});
  const [workingDaysData, setWorkingDaysData] = useState<WorkingDaysData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const fetchProjects = useCallback(async (): Promise<Project[]> => {
    const res = await fetch("/api/projects?includeInactive=true&kadminActive=true");
    return res.json();
  }, []);

  const fetchWorkHours = useCallback(async (projectsData: Project[]) => {
    const res = await fetch(`/api/kadmin/work-hours?fiscalYear=${FISCAL_YEAR}`);
    const workHoursDataRaw = await res.json();

    const transformed: WorkHoursData = {};

    for (const item of workHoursDataRaw) {
      if (!transformed[item.projectId]) {
        transformed[item.projectId] = {};
      }
      transformed[item.projectId][item.month] = {
        estimatedHours: item.estimatedHours,
        actualHours: item.actualHours,
        overtimeHours: item.overtimeHours,
        workingDays: item.workingDays || DEFAULT_WORKING_DAYS[item.month] || 20,
      };
    }

    // Initialize empty data for projects/months without data
    for (const project of projectsData) {
      if (!transformed[project.id]) {
        transformed[project.id] = {};
      }
      for (const month of MONTHS) {
        if (!transformed[project.id][month]) {
          transformed[project.id][month] = createDefaultMonthlyWorkHours(month);
        }
      }
    }

    return transformed;
  }, []);

  const fetchVacations = useCallback(async (): Promise<VacationData> => {
    try {
      const res = await fetch(`/api/kadmin/monthly-vacation?fiscalYear=${FISCAL_YEAR}`);
      const monthlyVacations = await res.json();

      const aggregated: VacationData = {};
      for (const vacation of monthlyVacations) {
        aggregated[vacation.month] = { hours: vacation.hours };
      }

      // Initialize empty months
      for (const month of MONTHS) {
        if (!aggregated[month]) {
          aggregated[month] = { hours: 0 };
        }
      }

      return aggregated;
    } catch (error) {
      console.error("Failed to fetch vacations:", error);
      const empty: VacationData = {};
      for (const month of MONTHS) {
        empty[month] = { hours: 0 };
      }
      return empty;
    }
  }, []);

  const fetchWorkingDays = useCallback(async (): Promise<WorkingDaysData> => {
    try {
      const res = await fetch(`/api/holidays/working-days?fiscalYear=${FISCAL_YEAR}`);
      const data = await res.json();
      return data.workingDays;
    } catch (error) {
      console.error("Failed to fetch working days:", error);
      return { ...DEFAULT_WORKING_DAYS };
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsData, vacations, workingDays] = await Promise.all([
        fetchProjects(),
        fetchVacations(),
        fetchWorkingDays(),
      ]);

      setProjects(projectsData);
      setVacationData(vacations);
      setWorkingDaysData(workingDays);

      const workHours = await fetchWorkHours(projectsData);
      setWorkHoursData(workHours);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, fetchVacations, fetchWorkingDays, fetchWorkHours]);

  const handleCellChange = useCallback(
    (projectId: string, month: number, field: WorkHoursField, value: number) => {
      setWorkHoursData((prev) => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          [month]: {
            ...prev[projectId][month],
            [field]: value,
          },
        },
      }));
    },
    []
  );

  const handleVacationChange = useCallback((month: number, value: number) => {
    setVacationData((prev) => ({
      ...prev,
      [month]: { hours: value },
    }));
  }, []);

  const handleCalculateActual = useCallback(async () => {
    setCalculating(true);
    try {
      const res = await fetch(`/api/kadmin/actual-hours?fiscalYear=${FISCAL_YEAR}`);
      const actualHours = await res.json();

      setWorkHoursData((prev) => {
        const updated = { ...prev };

        // Reset all actual hours to 0
        for (const projectId in updated) {
          for (const month of MONTHS) {
            if (updated[projectId][month]) {
              updated[projectId] = {
                ...updated[projectId],
                [month]: {
                  ...updated[projectId][month],
                  actualHours: 0,
                },
              };
            }
          }
        }

        // Apply calculated actual hours
        for (const item of actualHours) {
          if (updated[item.projectId]?.[item.month]) {
            updated[item.projectId] = {
              ...updated[item.projectId],
              [item.month]: {
                ...updated[item.projectId][item.month],
                actualHours: roundToTenth(item.hours),
              },
            };
          }
        }

        return updated;
      });

      onCalculateSuccess?.();
    } catch (error) {
      console.error("Failed to calculate actual hours:", error);
      onCalculateError?.();
    } finally {
      setCalculating(false);
    }
  }, [onCalculateSuccess, onCalculateError]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const updates = [];
      for (const projectId in workHoursData) {
        for (const month of MONTHS) {
          const data = workHoursData[projectId][month];
          updates.push({
            projectId,
            fiscalYear: FISCAL_YEAR,
            month,
            estimatedHours: data.estimatedHours,
            actualHours: data.actualHours,
            overtimeHours: data.overtimeHours,
            workingDays: data.workingDays,
          });
        }
      }

      const vacationUpdates = MONTHS.map((month) => ({
        fiscalYear: FISCAL_YEAR,
        month,
        hours: vacationData[month]?.hours || 0,
      }));

      await Promise.all([
        fetch("/api/kadmin/work-hours", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        }),
        fetch("/api/kadmin/monthly-vacation", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates: vacationUpdates }),
        }),
      ]);

      return true;
    } catch (error) {
      console.error("Failed to save:", error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [workHoursData, vacationData]);

  const updateProjectOrder = useCallback(async (projectIds: string[]) => {
    await fetch("/api/projects/reorder-kadmin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectIds }),
    });
  }, []);

  return {
    projects,
    workHoursData,
    vacationData,
    workingDaysData,
    loading,
    saving,
    calculating,
    setProjects,
    setWorkHoursData,
    setVacationData,
    fetchAllData,
    handleCellChange,
    handleVacationChange,
    handleCalculateActual,
    handleSave,
    updateProjectOrder,
  };
}
