"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { format, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORK_MODES, type WorkMode, type CheckInData } from "@/types/daily";
import { parseTimeToDecimalHours } from "@/lib/daily-utils";

interface CheckInCardProps {
  selectedDate: Date;
  onCheckIn: (data: CheckInData) => Promise<boolean>;
}

function CheckInCard({ selectedDate, onCheckIn }: CheckInCardProps) {
  const [checkInTime, setCheckInTime] = useState(format(new Date(), "HH:mm"));
  const [workMode, setWorkMode] = useState<WorkMode>("Office");
  const [sleepHours, setSleepHours] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update check-in time when selected date is today
  useEffect(() => {
    const today = startOfDay(new Date());
    if (startOfDay(selectedDate).getTime() === today.getTime()) {
      setCheckInTime(format(new Date(), "HH:mm"));
    }
  }, [selectedDate]);

  const handleSubmit = useCallback(async () => {
    if (!checkInTime || sleepHours === "") {
      alert("出勤時間と睡眠時間を入力してください");
      return;
    }

    const sleepHoursDecimal = parseTimeToDecimalHours(sleepHours);
    if (sleepHoursDecimal === null) {
      alert("睡眠時間の形式が正しくありません");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCheckIn({
        date: format(selectedDate, "yyyy-MM-dd"),
        clockIn: checkInTime,
        workMode,
        sleepHours: sleepHoursDecimal,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [checkInTime, sleepHours, workMode, selectedDate, onCheckIn]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>チェックイン</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="clockIn">出勤時間</Label>
            <Input
              id="clockIn"
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workMode">出社形態</Label>
            <Select
              value={workMode}
              onValueChange={(value) => setWorkMode(value as WorkMode)}
            >
              <SelectTrigger id="workMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sleepHours">睡眠時間</Label>
            <Input
              id="sleepHours"
              type="time"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="例: 07:30"
              required
            />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "チェックイン中..." : "チェックイン"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default memo(CheckInCard);
