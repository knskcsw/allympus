"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceList } from "@/components/attendance/AttendanceList";
import type { Attendance } from "@/generated/prisma/client";

export default function AttendancePage() {
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(
    null
  );
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [todayRes, listRes] = await Promise.all([
      fetch("/api/attendance/today"),
      fetch(`/api/attendance?year=${year}&month=${month}`),
    ]);

    const todayData = await todayRes.json();
    const listData = await listRes.json();

    setTodayAttendance(todayData);
    setAttendances(listData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatWorkingTime = () => {
    if (!todayAttendance?.clockIn) return "0h 0m";

    const clockIn = new Date(todayAttendance.clockIn);
    const clockOut = todayAttendance.clockOut
      ? new Date(todayAttendance.clockOut)
      : new Date();

    const diff = clockOut.getTime() - clockIn.getTime();
    const totalMinutes =
      Math.floor(diff / 60000) - todayAttendance.breakMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Clock className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold">Attendance</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Clock In</div>
                <div className="text-2xl font-bold">
                  {todayAttendance?.clockIn
                    ? format(new Date(todayAttendance.clockIn), "HH:mm")
                    : "--:--"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Clock Out</div>
                <div className="text-2xl font-bold">
                  {todayAttendance?.clockOut
                    ? format(new Date(todayAttendance.clockOut), "HH:mm")
                    : "--:--"}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Working Time</div>
              <div className="text-xl font-semibold">{formatWorkingTime()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Days Worked This Month
                </div>
                <div className="text-2xl font-bold">
                  {attendances.filter((a) => a.clockIn && a.clockOut).length}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Total Hours This Month
                </div>
                <div className="text-2xl font-bold">
                  {Math.floor(
                    attendances.reduce((acc, a) => {
                      if (a.clockIn && a.clockOut) {
                        const diff =
                          new Date(a.clockOut).getTime() -
                          new Date(a.clockIn).getTime();
                        return acc + Math.floor(diff / 60000) - a.breakMinutes;
                      }
                      return acc;
                    }, 0) / 60
                  )}
                  h
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This Month&apos;s Records</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceList attendances={attendances} onUpdate={fetchData} />
        </CardContent>
      </Card>
    </div>
  );
}
