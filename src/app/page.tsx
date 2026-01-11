import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckSquare, Timer, TrendingUp } from "lucide-react";
import { format, startOfDay, startOfWeek, endOfWeek } from "date-fns";
import { ja } from "date-fns/locale";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const [todayAttendance, weekAttendances, pendingTasks, activeTimeEntry] =
    await Promise.all([
      prisma.attendance.findFirst({
        where: {
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
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
          status: {
            in: ["TODO"],
          },
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

  const weeklyWorkingMinutes = weekAttendances.reduce((acc, att) => {
    if (att.clockIn && att.clockOut) {
      const diff = att.clockOut.getTime() - att.clockIn.getTime();
      return acc + Math.floor(diff / 60000) - att.breakMinutes;
    }
    return acc;
  }, 0);

  return {
    todayAttendance,
    weeklyWorkingMinutes,
    pendingTasks,
    activeTimeEntry,
  };
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default async function Dashboard() {
  const { todayAttendance, weeklyWorkingMinutes, pendingTasks, activeTimeEntry } =
    await getDashboardData();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayAttendance?.clockIn
                ? todayAttendance.clockOut
                  ? "Checked Out"
                  : "Working"
                : "Not Started"}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayAttendance?.clockIn
                ? `In: ${format(todayAttendance.clockIn, "HH:mm")}`
                : "No record yet"}
              {todayAttendance?.clockOut &&
                ` / Out: ${format(todayAttendance.clockOut, "HH:mm")}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(weeklyWorkingMinutes)}
            </div>
            <p className="text-xs text-muted-foreground">
              This week total working time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tasks to be completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Tracking</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTimeEntry ? "Active" : "Stopped"}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTimeEntry
                ? `Working on: ${activeTimeEntry.dailyTask?.title || "No task"}`
                : "No active timer"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
