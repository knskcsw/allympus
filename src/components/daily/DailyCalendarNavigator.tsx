"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addDays, subDays, startOfToday } from "date-fns";
import { ja } from "date-fns/locale";

interface DailyCalendarNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DailyCalendarNavigator({
  currentDate,
  onDateChange,
}: DailyCalendarNavigatorProps) {
  const handlePrevDay = () => {
    onDateChange(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(startOfToday());
  };

  const isToday =
    format(currentDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <Card>
      <CardHeader>
        <CardTitle>日付選択</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Display */}
        <div className="text-center">
          <div className="text-2xl font-bold">
            {format(currentDate, "yyyy年M月d日", { locale: ja })}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {format(currentDate, "EEEE", { locale: ja })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevDay}
            title="前の日"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant={isToday ? "secondary" : "outline"}
            onClick={handleToday}
            className="flex-1"
            disabled={isToday}
          >
            <Calendar className="h-4 w-4 mr-2" />
            今日
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            title="次の日"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(subDays(currentDate, 7))}
          >
            -7日
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addDays(currentDate, 7))}
          >
            +7日
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
