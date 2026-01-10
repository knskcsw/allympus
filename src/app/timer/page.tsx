"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stopwatch } from "@/components/timer/Stopwatch";
import { TimeEntryList } from "@/components/timer/TimeEntryList";
import type { TimeEntry, Task } from "@/generated/prisma/client";

type TimeEntryWithTask = TimeEntry & { task: Task | null };

export default function TimerPage() {
  const [entries, setEntries] = useState<TimeEntryWithTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const response = await fetch(`/api/time-entries?date=${today}`);
    const data = await response.json();
    setEntries(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    await fetch(`/api/time-entries/${id}`, {
      method: "DELETE",
    });
    fetchEntries();
  };

  const totalDuration = entries.reduce(
    (acc, entry) => acc + (entry.duration || 0),
    0
  );

  const formatTotalDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Time Tracking</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Stopwatch onEntryChange={fetchEntries} />

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Total Time Tracked
                </div>
                <div className="text-2xl font-bold">
                  {formatTotalDuration(totalDuration)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Number of Entries
                </div>
                <div className="text-2xl font-bold">{entries.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeEntryList entries={entries} onDelete={handleDelete} />
        </CardContent>
      </Card>
    </div>
  );
}
