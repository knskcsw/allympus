"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import type { Attendance } from "@/generated/prisma/client";

interface ClockInOutButtonProps {
  attendance: Attendance | null;
  onClockAction: () => void;
}

export function ClockInOutButton({
  attendance,
  onClockAction,
}: ClockInOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const canClockIn = !attendance?.clockIn;
  const canClockOut = attendance?.clockIn && !attendance?.clockOut;
  const isCompleted = attendance?.clockIn && attendance?.clockOut;

  const handleClick = async () => {
    if (isCompleted) return;

    setIsLoading(true);
    try {
      const type = canClockIn ? "clockIn" : "clockOut";
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        onClockAction();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <Button disabled variant="outline" size="lg" className="w-full">
        Completed for today
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={canClockIn ? "default" : "destructive"}
      size="lg"
      className="w-full"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : canClockIn ? (
        <LogIn className="mr-2 h-5 w-5" />
      ) : (
        <LogOut className="mr-2 h-5 w-5" />
      )}
      {canClockIn ? "Clock In" : "Clock Out"}
    </Button>
  );
}
