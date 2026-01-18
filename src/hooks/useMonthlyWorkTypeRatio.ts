"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toCumulative } from "@/lib/utils";
import type { WorkTypeReportData } from "@/types/reports";
import type { WorkType } from "@/generated/prisma/client";

export interface MonthlyWorkTypeRatio {
  workType: WorkType;
  label: string;
  pvRatio: number;
  bacRatio: number;
  acRatio: number;
  forecastRatio: number;
}

export interface MonthlyWorkTypeRatioData {
  types: MonthlyWorkTypeRatio[];
  isLoading: boolean;
}

function getSnapshotIndex(days: string[], year: number, month: number): number {
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth =
    new Date().getFullYear() === year && new Date().getMonth() + 1 === month;

  if (currentMonth && days.includes(today)) {
    return days.indexOf(today);
  }
  return days.length - 1;
}

function calculateSnapshotRatios(
  workTypeReport: WorkTypeReportData,
  snapshotIndex: number
): MonthlyWorkTypeRatio[] {
  const { days, types } = workTypeReport;

  const totalPvDaily = days.map((_, index) =>
    types.reduce((acc, type) => acc + (type.pvDaily[index] || 0), 0)
  );
  const totalAcDaily = days.map((_, index) =>
    types.reduce((acc, type) => acc + (type.acDaily[index] || 0), 0)
  );
  const totalBac = types.reduce((acc, type) => acc + type.bacTotal, 0);

  const cumulativeTotalPv = toCumulative(totalPvDaily);
  const cumulativeTotalAc = toCumulative(totalAcDaily);

  const totalPvSnapshot = cumulativeTotalPv[snapshotIndex] || 0;
  const totalAcSnapshot = cumulativeTotalAc[snapshotIndex] || 0;

  return types.map((type) => {
    const cumulativePv = toCumulative(type.pvDaily);
    const cumulativeAc = toCumulative(type.acDaily);

    const typePvSnapshot = cumulativePv[snapshotIndex] || 0;
    const typeAcSnapshot = cumulativeAc[snapshotIndex] || 0;

    const pvRatio = totalPvSnapshot ? (typePvSnapshot / totalPvSnapshot) * 100 : 0;
    const acRatio = totalAcSnapshot ? (typeAcSnapshot / totalAcSnapshot) * 100 : 0;
    const bacRatio = totalBac ? (type.bacTotal / totalBac) * 100 : 0;

    const elapsed = snapshotIndex + 1;
    const remaining = days.length - elapsed;
    const currentType = typeAcSnapshot;
    const currentTotal = totalAcSnapshot;

    const typeForecast =
      currentType === 0 ? 0 : currentType + (currentType / elapsed) * remaining;
    const totalForecast =
      currentTotal === 0
        ? 0
        : currentTotal + (currentTotal / elapsed) * remaining;
    const forecastRatio = totalForecast ? (typeForecast / totalForecast) * 100 : 0;

    return {
      workType: type.workType,
      label: type.label,
      pvRatio,
      bacRatio,
      acRatio,
      forecastRatio,
    };
  });
}

export function useMonthlyWorkTypeRatio(
  year: number,
  month: number
): MonthlyWorkTypeRatioData {
  const [types, setTypes] = useState<MonthlyWorkTypeRatio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/reports/worktype?year=${year}&month=${month}`
      );
      const data: WorkTypeReportData = await response.json();

      if (data.error) {
        console.error("Failed to fetch work type report:", data.error);
        setTypes([]);
      } else if (data.days && data.types && data.days.length > 0) {
        const snapshotIndex = getSnapshotIndex(data.days, year, month);
        const ratios = calculateSnapshotRatios(data, snapshotIndex);
        setTypes(ratios);
      } else {
        setTypes([]);
      }
    } catch (error) {
      console.error("Failed to fetch work type report:", error);
      setTypes([]);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    types,
    isLoading,
  };
}
