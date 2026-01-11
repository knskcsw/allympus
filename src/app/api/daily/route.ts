import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { error: "date parameter is required" },
        { status: 400 }
      );
    }

    const date = new Date(dateParam);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Fetch all data in parallel
    const [attendance, dailyTasks, timeEntries, morningRoutine] =
      await Promise.all([
        // 1. Attendance for the date
        prisma.attendance.findFirst({
          where: {
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        }),

        // 2. Daily tasks for the date
        prisma.dailyTask.findMany({
          where: {
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            timeEntries: {
              select: {
                duration: true,
              },
            },
          },
        }),

        // 3. Time entries for the date (with relations)
        prisma.timeEntry.findMany({
          where: {
            startTime: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          orderBy: { startTime: "asc" },
          include: {
            dailyTask: {
              select: {
                id: true,
                title: true,
              },
            },
            project: {
              select: {
                id: true,
                code: true,
                name: true,
                abbreviation: true,
              },
            },
            wbs: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.morningRoutineItem.findMany({
          where: {
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          orderBy: { sortOrder: "asc" },
        }),
      ]);

  // Calculate total time spent for each daily task
  const tasksWithTotalTime = dailyTasks.map((task) => ({
    ...task,
    totalTimeSpent: task.timeEntries.reduce(
      (acc, entry) => acc + (entry.duration || 0),
      0
    ),
  }));

  // Calculate WBS summary (grouped by project and WBS)
  const wbsSummaryMap = new Map<string, {
    projectId: string | null;
    projectName: string;
    projectAbbreviation: string | null;
    wbsId: string | null;
    wbsName: string;
    totalSeconds: number;
  }>();

  timeEntries.forEach((entry) => {
    const projectId = entry.projectId || null;
    const projectName = entry.project?.name || "No Project";
    const projectAbbreviation = entry.project?.abbreviation || null;
    const wbsId = entry.wbsId || null;
    const wbsName = entry.wbs?.name || "No WBS";
    const key = `${projectId || "null"}-${wbsId || "null"}`;

    const existing = wbsSummaryMap.get(key);
    if (existing) {
      existing.totalSeconds += entry.duration || 0;
    } else {
      wbsSummaryMap.set(key, {
        projectId,
        projectName,
        projectAbbreviation,
        wbsId,
        wbsName,
        totalSeconds: entry.duration || 0,
      });
    }
  });

  // Convert to array and add decimal hours
  const wbsSummary = Array.from(wbsSummaryMap.values()).map((item) => ({
    ...item,
    totalHours: Number((item.totalSeconds / 3600).toFixed(2)),
  }));

    // Return aggregated data
    return NextResponse.json({
      date: dateParam,
      attendance,
      morningRoutine,
      dailyTasks: tasksWithTotalTime,
      timeEntries,
      wbsSummary,
    });
  } catch (error) {
    console.error("Failed to load daily data:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load daily data";
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Failed to load daily data"
            : message,
      },
      { status: 500 }
    );
  }
}
