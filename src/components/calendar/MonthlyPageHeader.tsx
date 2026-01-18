"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface MonthlyPageHeaderProps {
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export const MonthlyPageHeader = memo(function MonthlyPageHeader({
  onPrevMonth,
  onNextMonth,
  onToday,
}: MonthlyPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Calendar className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold">Calendar</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onToday}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={onNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
