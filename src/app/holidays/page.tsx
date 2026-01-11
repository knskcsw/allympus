"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HolidayCalendar } from "@/components/holidays/HolidayCalendar";
import { AddHolidayDialog } from "@/components/holidays/AddHolidayDialog";
import type { Holiday } from "@/generated/prisma/client";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FISCAL_YEARS = ["FY25", "FY26", "FY27"];

const HOLIDAY_TYPE_LABELS: { [key: string]: string } = {
  PUBLIC_HOLIDAY: "祝日",
  WEEKEND: "定休日",
  SPECIAL_HOLIDAY: "特別休日",
};

export default function HolidaysPage() {
  const [fiscalYear, setFiscalYear] = useState("FY25");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/holidays?fiscalYear=${fiscalYear}`);
      const data = await res.json();
      setHolidays(data);
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
    } finally {
      setLoading(false);
    }
  }, [fiscalYear]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const handleAddHoliday = async (data: {
    date: Date;
    name: string;
    type: string;
  }) => {
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
        setDialogOpen(false);
        setSelectedDate(null);
      } else {
        const error = await res.json();
        console.error("Failed to add holiday:", error);
        alert("休日の登録に失敗しました");
      }
    } catch (error) {
      console.error("Failed to add holiday:", error);
      alert("休日の登録に失敗しました");
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("この休日を削除しますか？")) {
      return;
    }

    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchHolidays();
      } else {
        const error = await res.json();
        console.error("Failed to delete holiday:", error);
        alert("休日の削除に失敗しました");
      }
    } catch (error) {
      console.error("Failed to delete holiday:", error);
      alert("休日の削除に失敗しました");
    }
  };

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Holidays</h1>
          <p className="text-muted-foreground mt-2">
            会社の年間休日を管理します
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={fiscalYear} onValueChange={setFiscalYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FISCAL_YEARS.map((fy) => (
                <SelectItem key={fy} value={fy}>
                  {fy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            休日を追加
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>カレンダー ({fiscalYear})</CardTitle>
        </CardHeader>
        <CardContent>
          <HolidayCalendar
            fiscalYear={fiscalYear}
            holidays={holidays}
            onDateClick={handleDateClick}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>休日一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {holidays.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              登録された休日はありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>休日名</TableHead>
                  <TableHead>種類</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell>
                      {format(new Date(holiday.date), "yyyy年M月d日(E)", {
                        locale: ja,
                      })}
                    </TableCell>
                    <TableCell>{holiday.name}</TableCell>
                    <TableCell>
                      {HOLIDAY_TYPE_LABELS[holiday.type] || holiday.type}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteHoliday(holiday.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddHolidayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
        onAdd={handleAddHoliday}
      />
    </div>
  );
}
