"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { addDays, eachDayOfInterval, getDay, format } from "date-fns";

interface BulkAddHolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiscalYear: string;
  onComplete: () => void;
}

// FY25の祝日データ (2025/4/1 - 2026/3/31)
const FY25_HOLIDAYS = [
  { date: "2025-04-29", name: "昭和の日" },
  { date: "2025-05-03", name: "憲法記念日" },
  { date: "2025-05-04", name: "みどりの日" },
  { date: "2025-05-05", name: "こどもの日" },
  { date: "2025-05-06", name: "振替休日" },
  { date: "2025-07-21", name: "海の日" },
  { date: "2025-08-11", name: "山の日" },
  { date: "2025-09-15", name: "敬老の日" },
  { date: "2025-09-23", name: "秋分の日" },
  { date: "2025-10-13", name: "スポーツの日" },
  { date: "2025-11-03", name: "文化の日" },
  { date: "2025-11-23", name: "勤労感謝の日" },
  { date: "2025-11-24", name: "振替休日" },
  { date: "2026-01-01", name: "元日" },
  { date: "2026-01-12", name: "成人の日" },
  { date: "2026-02-11", name: "建国記念の日" },
  { date: "2026-02-23", name: "天皇誕生日" },
  { date: "2026-03-20", name: "春分の日" },
];

// 年末年始休暇 (2025/12/26 - 2026/1/4)
const NEW_YEAR_HOLIDAYS = eachDayOfInterval({
  start: new Date("2025-12-26"),
  end: new Date("2026-01-04"),
}).map((date) => ({
  date: format(date, "yyyy-MM-dd"),
  name: "年末年始休暇",
}));

// FY25の土日を生成 (2025/4/1 - 2026/3/31)
const generateWeekends = (fiscalYear: string) => {
  if (fiscalYear !== "FY25") {
    // TODO: 他の年度に対応する場合は実装を追加
    return [];
  }

  const start = new Date("2025-04-01");
  const end = new Date("2026-03-31");
  const allDays = eachDayOfInterval({ start, end });

  return allDays
    .filter((date) => {
      const dayOfWeek = getDay(date);
      return dayOfWeek === 0 || dayOfWeek === 6; // 日曜日(0)または土曜日(6)
    })
    .map((date) => ({
      date: format(date, "yyyy-MM-dd"),
      name: getDay(date) === 0 ? "日曜日" : "土曜日",
    }));
};

export function BulkAddHolidayDialog({
  open,
  onOpenChange,
  fiscalYear,
  onComplete,
}: BulkAddHolidayDialogProps) {
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [includePublicHolidays, setIncludePublicHolidays] = useState(false);
  const [includeNewYearHolidays, setIncludeNewYearHolidays] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const holidays: Array<{
      date: string;
      name: string;
      type: string;
      fiscalYear: string;
    }> = [];

    // 土日を追加
    if (includeWeekends) {
      const weekends = generateWeekends(fiscalYear);
      holidays.push(
        ...weekends.map((w) => ({
          ...w,
          type: "WEEKEND",
          fiscalYear,
        }))
      );
    }

    // 祝日を追加
    if (includePublicHolidays && fiscalYear === "FY25") {
      holidays.push(
        ...FY25_HOLIDAYS.map((h) => ({
          ...h,
          type: "PUBLIC_HOLIDAY",
          fiscalYear,
        }))
      );
    }

    // 年末年始休暇を追加
    if (includeNewYearHolidays && fiscalYear === "FY25") {
      holidays.push(
        ...NEW_YEAR_HOLIDAYS.map((h) => ({
          ...h,
          type: "SPECIAL_HOLIDAY",
          fiscalYear,
        }))
      );
    }

    if (holidays.length === 0) {
      alert("少なくとも1つの項目を選択してください");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/holidays/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holidays }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`${data.results.length}件の休日を登録しました`);
        onComplete();
        onOpenChange(false);
        // Reset state
        setIncludeWeekends(false);
        setIncludePublicHolidays(false);
        setIncludeNewYearHolidays(false);
      } else {
        const error = await res.json();
        console.error("Failed to bulk add holidays:", error);
        alert("休日の一括登録に失敗しました");
      }
    } catch (error) {
      console.error("Failed to bulk add holidays:", error);
      alert("休日の一括登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>休日を一括登録</DialogTitle>
          <DialogDescription>
            {fiscalYear}の休日を一括で登録します。登録したい項目を選択してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="weekends"
              checked={includeWeekends}
              onCheckedChange={(checked) =>
                setIncludeWeekends(checked as boolean)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="weekends" className="cursor-pointer">
                土日を全て追加
              </Label>
              <p className="text-sm text-muted-foreground">
                {fiscalYear === "FY25"
                  ? "2025年4月1日〜2026年3月31日の土日（約104日）"
                  : "対象年度の全ての土日"}
              </p>
            </div>
          </div>

          {fiscalYear === "FY25" && (
            <>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="publicHolidays"
                  checked={includePublicHolidays}
                  onCheckedChange={(checked) =>
                    setIncludePublicHolidays(checked as boolean)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="publicHolidays" className="cursor-pointer">
                    日本の祝日を追加
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    FY25の祝日・振替休日（18日）
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="newYearHolidays"
                  checked={includeNewYearHolidays}
                  onCheckedChange={(checked) =>
                    setIncludeNewYearHolidays(checked as boolean)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="newYearHolidays" className="cursor-pointer">
                    年末年始休暇を追加
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    2025年12月26日〜2026年1月4日（10日間）
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "登録中..." : "一括登録"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
