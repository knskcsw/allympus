import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "month";
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
  const exportCsv = searchParams.get("export") === "csv";

  let startDate: Date;
  let endDate: Date;

  if (type === "week") {
    const date = new Date(year, month - 1, 1);
    startDate = startOfWeek(date, { weekStartsOn: 1 });
    endDate = endOfWeek(date, { weekStartsOn: 1 });
  } else {
    startDate = startOfMonth(new Date(year, month - 1));
    endDate = endOfMonth(new Date(year, month - 1));
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
      endTime: { not: null },
    },
    include: {
      dailyTask: true,
      project: true,
      wbs: true,
      allocations: {
        include: {
          project: true,
          wbs: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (exportCsv) {
    const csvRows = [
      ["Date", "Clock In", "Clock Out", "Break (min)", "Working Hours", "Note"],
    ];

    attendances.forEach((a) => {
      let workingHours = "";
      if (a.clockIn && a.clockOut) {
        const diff = a.clockOut.getTime() - a.clockIn.getTime();
        const totalMinutes = Math.floor(diff / 60000) - a.breakMinutes;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        workingHours = `${hours}:${mins.toString().padStart(2, "0")}`;
      }

      csvRows.push([
        format(a.date, "yyyy-MM-dd"),
        a.clockIn ? format(a.clockIn, "HH:mm") : "",
        a.clockOut ? format(a.clockOut, "HH:mm") : "",
        a.breakMinutes.toString(),
        workingHours,
        a.note || "",
      ]);
    });

    const csv = csvRows.map((row) => row.join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance_${year}_${month}.csv"`,
      },
    });
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const dailyData = days.map((day) => {
    const attendance = attendances.find(
      (a) => format(a.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );

    let workingMinutes = 0;
    if (attendance?.clockIn && attendance?.clockOut) {
      const diff = attendance.clockOut.getTime() - attendance.clockIn.getTime();
      workingMinutes = Math.floor(diff / 60000) - attendance.breakMinutes;
    }

    const dayTimeEntries = timeEntries.filter(
      (e) => format(e.startTime, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    const trackedSeconds = dayTimeEntries.reduce(
      (acc, e) => acc + (e.duration || 0),
      0
    );

    return {
      date: format(day, "yyyy-MM-dd"),
      dayOfWeek: format(day, "EEE"),
      workingMinutes,
      trackedSeconds,
      hasAttendance: !!attendance?.clockIn,
    };
  });

  const summary = {
    totalWorkingMinutes: dailyData.reduce((acc, d) => acc + d.workingMinutes, 0),
    totalTrackedSeconds: dailyData.reduce((acc, d) => acc + d.trackedSeconds, 0),
    workedDays: dailyData.filter((d) => d.hasAttendance).length,
    totalDays: days.length,
  };

  const wbsSummary = timeEntries.reduce(
    (acc, entry) => {
      // 按分エントリの場合
      if (entry.allocations && entry.allocations.length > 0) {
        entry.allocations.forEach((alloc) => {
          const projectName = alloc.project?.name || "No Project";
          const wbsName = alloc.wbs?.name || "No WBS";
          const key = `${projectName} - ${wbsName}`;
          if (!acc[key]) {
            acc[key] = 0;
          }
          const allocatedSeconds = ((entry.duration || 0) * alloc.percentage) / 100;
          acc[key] += allocatedSeconds;
        });
      }
      // シンプルエントリの場合（後方互換性）
      else if (entry.projectId) {
        const projectName = entry.project?.name || "No Project";
        const wbsName = entry.wbs?.name || "No WBS";
        const key = `${projectName} - ${wbsName}`;
        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key] += entry.duration || 0;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    period: { start: startDate, end: endDate, type },
    dailyData,
    summary,
    wbsSummary,
  });
}
