import { useMemo, useCallback } from "react";
import {
  type Project,
  type WorkHoursData,
  type VacationData,
  type WorkingDaysData,
  type EditableField,
  MONTHS,
  DEFAULT_WORKING_DAYS,
  calculateStandardHours,
} from "@/components/kadmin/types";

interface UseKadminCalculationsReturn {
  calculateYearTotal: (projectId: string, field: EditableField) => number;
  calculateMonthTotal: (month: number, field: EditableField) => number;
  calculateGrandTotal: (field: EditableField) => number;
  calculateVacationTotal: () => number;
  calculateYearStandardHours: () => number;
  calculateOvertimeHours: (month: number) => number;
  calculateYearOvertimeHours: () => number;
}

export function useKadminCalculations(
  projects: Project[],
  workHoursData: WorkHoursData,
  vacationData: VacationData,
  workingDaysData: WorkingDaysData
): UseKadminCalculationsReturn {
  const calculateYearTotal = useCallback(
    (projectId: string, field: EditableField): number => {
      return MONTHS.reduce(
        (total, month) => total + (workHoursData[projectId]?.[month]?.[field] || 0),
        0
      );
    },
    [workHoursData]
  );

  const calculateMonthTotal = useCallback(
    (month: number, field: EditableField): number => {
      return projects.reduce(
        (total, project) => total + (workHoursData[project.id]?.[month]?.[field] || 0),
        0
      );
    },
    [projects, workHoursData]
  );

  const calculateGrandTotal = useCallback(
    (field: EditableField): number => {
      return MONTHS.reduce((total, month) => total + calculateMonthTotal(month, field), 0);
    },
    [calculateMonthTotal]
  );

  const calculateVacationTotal = useCallback((): number => {
    return MONTHS.reduce((total, month) => total + (vacationData[month]?.hours || 0), 0);
  }, [vacationData]);

  const calculateYearStandardHours = useCallback((): number => {
    return MONTHS.reduce((total, month) => {
      const workingDays = workingDaysData[month] || DEFAULT_WORKING_DAYS[month] || 20;
      return total + calculateStandardHours(workingDays);
    }, 0);
  }, [workingDaysData]);

  const calculateOvertimeHours = useCallback(
    (month: number): number => {
      const actualTotal = calculateMonthTotal(month, "actualHours");
      const workingDays = workingDaysData[month] || DEFAULT_WORKING_DAYS[month] || 20;
      const standardHours = calculateStandardHours(workingDays);
      const vacationHours = vacationData[month]?.hours || 0;
      const expectedHours = standardHours - vacationHours;
      return actualTotal - expectedHours;
    },
    [calculateMonthTotal, workingDaysData, vacationData]
  );

  const calculateYearOvertimeHours = useCallback((): number => {
    return MONTHS.reduce((total, month) => total + calculateOvertimeHours(month), 0);
  }, [calculateOvertimeHours]);

  return useMemo(
    () => ({
      calculateYearTotal,
      calculateMonthTotal,
      calculateGrandTotal,
      calculateVacationTotal,
      calculateYearStandardHours,
      calculateOvertimeHours,
      calculateYearOvertimeHours,
    }),
    [
      calculateYearTotal,
      calculateMonthTotal,
      calculateGrandTotal,
      calculateVacationTotal,
      calculateYearStandardHours,
      calculateOvertimeHours,
      calculateYearOvertimeHours,
    ]
  );
}
