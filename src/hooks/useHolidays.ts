import { useState, useCallback, useEffect } from "react";
import type { Holiday } from "@/generated/prisma/client";
import type { AddHolidayData, FiscalYear } from "@/lib/holidays";

interface UseHolidaysReturn {
  holidays: Holiday[];
  loading: boolean;
  error: string | null;
  fetchHolidays: () => Promise<void>;
  addHoliday: (data: AddHolidayData) => Promise<boolean>;
  deleteHoliday: (id: string) => Promise<boolean>;
}

export function useHolidays(fiscalYear: FiscalYear): UseHolidaysReturn {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/holidays?fiscalYear=${fiscalYear}`);
      const data = await res.json();

      if (res.ok) {
        setHolidays(data);
      } else {
        console.error("Failed to fetch holidays:", data);
        setError("休日の取得に失敗しました");
        setHolidays([]);
      }
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
      setError("休日の取得に失敗しました");
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [fiscalYear]);

  const addHoliday = useCallback(
    async (data: AddHolidayData): Promise<boolean> => {
      try {
        const res = await fetch("/api/holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            date: data.date.toISOString(),
            fiscalYear,
          }),
        });

        if (res.ok) {
          await fetchHolidays();
          return true;
        } else {
          const error = await res.json();
          console.error("Failed to add holiday:", error);
          return false;
        }
      } catch (err) {
        console.error("Failed to add holiday:", err);
        return false;
      }
    },
    [fiscalYear, fetchHolidays]
  );

  const deleteHoliday = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/holidays/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          await fetchHolidays();
          return true;
        } else {
          const error = await res.json();
          console.error("Failed to delete holiday:", error);
          return false;
        }
      } catch (err) {
        console.error("Failed to delete holiday:", err);
        return false;
      }
    },
    [fetchHolidays]
  );

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  return {
    holidays,
    loading,
    error,
    fetchHolidays,
    addHoliday,
    deleteHoliday,
  };
}
