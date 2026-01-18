"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SalaryEntry, SalaryTotals, DeductionTotal, NetTrendItem } from "@/types/salary";
import { DEDUCTION_LABELS, sumBy, getTotalDeductions } from "@/lib/salary-utils";

type UseSalaryDataReturn = {
  year: number;
  rows: SalaryEntry[];
  sortedRows: SalaryEntry[];
  isLoading: boolean;
  savingRows: Record<string, boolean>;
  totals: SalaryTotals;
  deductionTotals: DeductionTotal[];
  netTrend: NetTrendItem[];
  maxNet: number;
  handlePrevYear: () => void;
  handleNextYear: () => void;
  handleValueChange: (id: string, key: keyof SalaryEntry, value: string) => void;
  handleSaveRow: (row: SalaryEntry) => Promise<void>;
  handleAddMonth: () => Promise<void>;
  handleRemoveMonth: (row: SalaryEntry) => Promise<void>;
};

export function useSalaryData(): UseSalaryDataReturn {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<SalaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.month - b.month),
    [rows]
  );

  const fetchRows = useCallback(async (targetYear: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/salary?year=${targetYear}`);
      if (!response.ok) {
        throw new Error("Failed to load salary records");
      }
      const data = (await response.json()) as SalaryEntry[];
      setRows(data);
    } catch (error) {
      console.error(error);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows(year);
  }, [fetchRows, year]);

  const handlePrevYear = useCallback(() => {
    setYear((prev) => prev - 1);
  }, []);

  const handleNextYear = useCallback(() => {
    setYear((prev) => prev + 1);
  }, []);

  const handleValueChange = useCallback(
    (id: string, key: keyof SalaryEntry, value: string) => {
      const numericValue = Number(value.replace(/,/g, ""));
      setRows((current) =>
        current.map((row) =>
          row.id === id
            ? { ...row, [key]: Number.isNaN(numericValue) ? 0 : numericValue }
            : row
        )
      );
    },
    []
  );

  const handleSaveRow = useCallback(async (row: SalaryEntry) => {
    setSavingRows((prev) => ({ ...prev, [row.id]: true }));
    try {
      const response = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!response.ok) {
        throw new Error("Failed to save salary record");
      }
      const saved = (await response.json()) as SalaryEntry;
      setRows((current) =>
        current.map((item) => (item.id === saved.id ? saved : item))
      );
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSavingRows((prev) => ({ ...prev, [row.id]: false }));
    }
  }, []);

  const handleAddMonth = useCallback(async () => {
    const months = rows.map((row) => row.month);
    const nextMonth = months.length ? Math.max(...months) + 1 : 1;
    if (nextMonth > 12) {
      alert("12ヶ月以上は追加できません。");
      return;
    }
    try {
      const response = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month: nextMonth }),
      });
      if (!response.ok) {
        throw new Error("Failed to add salary record");
      }
      const saved = (await response.json()) as SalaryEntry;
      setRows((current) => [...current, saved]);
    } catch (error) {
      console.error(error);
      alert("追加に失敗しました。");
    }
  }, [rows, year]);

  const handleRemoveMonth = useCallback(async (row: SalaryEntry) => {
    try {
      const response = await fetch("/api/salary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: row.year, month: row.month }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete salary record");
      }
      setRows((current) => current.filter((item) => item.id !== row.id));
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました。");
    }
  }, []);

  const totals = useMemo<SalaryTotals>(() => {
    const gross = sumBy(rows, "gross");
    const net = sumBy(rows, "net");
    const bonus = sumBy(rows, "bonus");
    const deductions = rows.reduce(
      (total, row) => total + getTotalDeductions(row),
      0
    );
    const averageNet = rows.length ? net / rows.length : 0;
    return { gross, net, bonus, deductions, averageNet };
  }, [rows]);

  const deductionTotals = useMemo<DeductionTotal[]>(
    () =>
      DEDUCTION_LABELS.map((item) => ({
        ...item,
        value: sumBy(rows, item.key),
      })),
    [rows]
  );

  const netTrend = useMemo<NetTrendItem[]>(() => {
    const byMonth = new Map(sortedRows.map((row) => [row.month, row.net]));
    return Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      net: byMonth.get(index + 1) ?? 0,
    }));
  }, [sortedRows]);

  const maxNet = useMemo(
    () => Math.max(1, ...netTrend.map((item) => item.net)),
    [netTrend]
  );

  return {
    year,
    rows,
    sortedRows,
    isLoading,
    savingRows,
    totals,
    deductionTotals,
    netTrend,
    maxNet,
    handlePrevYear,
    handleNextYear,
    handleValueChange,
    handleSaveRow,
    handleAddMonth,
    handleRemoveMonth,
  };
}
