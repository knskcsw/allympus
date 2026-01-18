import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Clock, CheckSquare, Timer, TrendingUp, LucideIcon } from "lucide-react";
import { format, startOfDay, startOfWeek, endOfWeek } from "date-fns";
import type { Attendance, DailyTask, TimeEntry } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

// ============================================================================
// Constants
// ============================================================================

const MILLISECONDS_PER_MINUTE = 60000;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MINUTES_PER_HOUR = 60;
const WEEK_STARTS_ON_MONDAY = 1;

// ============================================================================
// Types
// ============================================================================

type AttendanceWithTimes = Pick<Attendance, "clockIn" | "clockOut" | "breakMinutes">;

type TimeEntryWithTask = TimeEntry & {
  dailyTask: DailyTask | null;
};

type DashboardData = {
  todayAttendance: Attendance | null;
  weeklyWorkingMinutes: number;
  pendingTaskCount: number;
  activeTimeEntry: TimeEntryWithTask | null;
};

type StatCardProps = {
  title: string;
  icon: LucideIcon;
  value: string | number;
  description: string;
};

type TodayStatus = "Checked Out" | "Working" | "Not Started";

// ============================================================================
// Utility Functions
// ============================================================================

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const mins = minutes % MINUTES_PER_HOUR;
  return `${hours}h ${mins}m`;
}

function calculateWorkingMinutes(attendance: AttendanceWithTimes): number {
  if (!attendance.clockIn || !attendance.clockOut) {
    return 0;
  }
  const diff = attendance.clockOut.getTime() - attendance.clockIn.getTime();
  return Math.floor(diff / MILLISECONDS_PER_MINUTE) - attendance.breakMinutes;
}

function getTodayStatus(attendance: Attendance | null): TodayStatus {
  if (!attendance?.clockIn) {
    return "Not Started";
  }
  return attendance.clockOut ? "Checked Out" : "Working";
}

function formatAttendanceTime(attendance: Attendance | null): string {
  if (!attendance?.clockIn) {
    return "No record yet";
  }
  const clockInTime = `In: ${format(attendance.clockIn, "HH:mm")}`;
  const clockOutTime = attendance.clockOut
    ? ` / Out: ${format(attendance.clockOut, "HH:mm")}`
    : "";
  return clockInTime + clockOutTime;
}

function formatActiveTaskDescription(timeEntry: TimeEntryWithTask | null): string {
  if (!timeEntry) {
    return "No active timer";
  }
  const taskTitle = timeEntry.dailyTask?.title ?? "No task";
  return `Working on: ${taskTitle}`;
}

// ============================================================================
// Data Fetching
// ============================================================================

async function getDashboardData(): Promise<DashboardData> {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON_MONDAY });
  const weekEnd = endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON_MONDAY });

  const [todayAttendance, weekAttendances, pendingTaskCount, activeTimeEntry] =
    await Promise.all([
      prisma.attendance.findFirst({
        where: {
          date: {
            gte: today,
            lt: new Date(today.getTime() + MILLISECONDS_PER_DAY),
          },
        },
      }),
      prisma.attendance.findMany({
        where: {
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      }),
      prisma.dailyTask.count({
        where: {
          status: "TODO",
        },
      }),
      prisma.timeEntry.findFirst({
        where: {
          endTime: null,
        },
        include: {
          dailyTask: true,
        },
      }),
    ]);

  const weeklyWorkingMinutes = weekAttendances.reduce(
    (total, attendance) => total + calculateWorkingMinutes(attendance),
    0
  );

  return {
    todayAttendance,
    weeklyWorkingMinutes,
    pendingTaskCount,
    activeTimeEntry,
  };
}

// ============================================================================
// Components
// ============================================================================

function StatCard({ title, icon: Icon, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DashboardHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-primary/10 p-2 text-primary">
        <Home className="h-5 w-5" />
      </div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default async function Dashboard() {
  const {
    todayAttendance,
    weeklyWorkingMinutes,
    pendingTaskCount,
    activeTimeEntry,
  } = await getDashboardData();

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today Status"
          icon={Clock}
          value={getTodayStatus(todayAttendance)}
          description={formatAttendanceTime(todayAttendance)}
        />

        <StatCard
          title="Weekly Hours"
          icon={TrendingUp}
          value={formatDuration(weeklyWorkingMinutes)}
          description="This week total working time"
        />

        <StatCard
          title="Pending Tasks"
          icon={CheckSquare}
          value={pendingTaskCount}
          description="Tasks to be completed"
        />

        <StatCard
          title="Time Tracking"
          icon={Timer}
          value={activeTimeEntry ? "Active" : "Stopped"}
          description={formatActiveTaskDescription(activeTimeEntry)}
        />
      </div>
    </div>
  );
}
