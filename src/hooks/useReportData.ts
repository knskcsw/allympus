"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReportData, WorkTypeReportData } from "@/types/reports";

interface UseReportDataResult {
  report: ReportData | null;
  workTypeReport: WorkTypeReportData | null;
  isLoading: boolean;
  isWorkTypeLoading: boolean;
  refetch: () => void;
}

export function useReportData(year: number, month: number): UseReportDataResult {
  const [report, setReport] = useState<ReportData | null>(null);
  const [workTypeReport, setWorkTypeReport] = useState<WorkTypeReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorkTypeLoading, setIsWorkTypeLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/reports?year=${year}&month=${month}&type=month`
      );
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error("Failed to fetch report:", error);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  const fetchWorkTypeReport = useCallback(async () => {
    setIsWorkTypeLoading(true);
    try {
      const response = await fetch(
        `/api/reports/worktype?year=${year}&month=${month}`
      );
      const data = await response.json();
      if (data.error) {
        console.error("Failed to fetch work type report:", data.error);
        setWorkTypeReport(null);
      } else {
        setWorkTypeReport(data);
      }
    } catch (error) {
      console.error("Failed to fetch work type report:", error);
      setWorkTypeReport(null);
    } finally {
      setIsWorkTypeLoading(false);
    }
  }, [year, month]);

  const refetch = useCallback(() => {
    fetchReport();
    fetchWorkTypeReport();
  }, [fetchReport, fetchWorkTypeReport]);

  useEffect(() => {
    fetchReport();
    fetchWorkTypeReport();
  }, [fetchReport, fetchWorkTypeReport]);

  return {
    report,
    workTypeReport,
    isLoading,
    isWorkTypeLoading,
    refetch,
  };
}
