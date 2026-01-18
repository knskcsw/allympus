"use client";

import { useState, useCallback } from "react";
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
import { BulkAddHolidayDialog } from "@/components/holidays/BulkAddHolidayDialog";
import { HolidayStats } from "@/components/holidays/HolidayStats";
import { HolidayList } from "@/components/holidays/HolidayList";
import { CalendarRange, Plus, FileSpreadsheet } from "lucide-react";
import { useHolidays } from "@/hooks/useHolidays";
import { FISCAL_YEARS, type FiscalYear, type AddHolidayData } from "@/lib/holidays";

export default function HolidaysPage() {
  const [fiscalYear, setFiscalYear] = useState<FiscalYear>("FY25");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  const { holidays, loading, addHoliday, deleteHoliday, fetchHolidays } =
    useHolidays(fiscalYear);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  }, []);

  const handleAddHoliday = useCallback(
    async (data: AddHolidayData) => {
      const success = await addHoliday(data);
      if (success) {
        setDialogOpen(false);
        setSelectedDate(null);
      } else {
        alert("休日の登録に失敗しました");
      }
    },
    [addHoliday]
  );

  const handleDeleteHoliday = useCallback(
    async (id: string) => {
      const success = await deleteHoliday(id);
      if (!success) {
        alert("休日の削除に失敗しました");
      }
    },
    [deleteHoliday]
  );

  const handleOpenAddDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleOpenBulkDialog = useCallback(() => {
    setBulkDialogOpen(true);
  }, []);

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <CalendarRange className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold">Holidays</h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={fiscalYear} onValueChange={(v) => setFiscalYear(v as FiscalYear)}>
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
          <Button variant="outline" onClick={handleOpenBulkDialog}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            一括登録
          </Button>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            休日を追加
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar {fiscalYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <HolidayCalendar
            fiscalYear={fiscalYear}
            holidays={holidays}
            onDateClick={handleDateClick}
          />
        </CardContent>
      </Card>

      {/* Statistics */}
      <HolidayStats holidays={holidays} />

      {/* Holiday List */}
      <HolidayList holidays={holidays} onDelete={handleDeleteHoliday} />

      {/* Dialogs */}
      <AddHolidayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
        onAdd={handleAddHoliday}
      />

      <BulkAddHolidayDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        fiscalYear={fiscalYear}
        onComplete={fetchHolidays}
      />
    </div>
  );
}
