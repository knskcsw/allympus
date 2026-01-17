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
    const [attendance, dailyTasks, timeEntries, morningRoutine, routineTasks] =
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
            routineTask: {
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
            allocations: {
              include: {
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
        prisma.routineTask.findMany({
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
    const wbsSummaryMap = new Map<
      string,
      {
        projectId: string | null;
        projectName: string;
        projectAbbreviation: string | null;
        wbsId: string | null;
        wbsName: string;
        totalSeconds: number;
      }
    >();

    const processEntry = (
      projectId: string | null,
      projectName: string,
      projectAbbreviation: string | null,
      wbsId: string | null,
      wbsName: string,
      durationSeconds: number
    ) => {
      if (!projectId) return;

      const key = `${projectId || "null"}-${wbsId || "null"}`;
      const existing = wbsSummaryMap.get(key);

      if (existing) {
        existing.totalSeconds += durationSeconds;
      } else {
        wbsSummaryMap.set(key, {
          projectId,
          projectName,
          projectAbbreviation,
          wbsId,
          wbsName,
          totalSeconds: durationSeconds,
        });
      }
    };

    timeEntries.forEach((entry) => {
      // Check for allocations first
      if (entry.allocations && entry.allocations.length > 0) {
        entry.allocations.forEach((alloc) => {
          const allocatedDuration = Math.round(
            (entry.duration || 0) * (alloc.percentage / 100)
          );

          processEntry(
            alloc.projectId,
            alloc.project?.name || "No Project",
            alloc.project?.abbreviation || null,
            alloc.wbsId,
            alloc.wbs?.name || "No WBS",
            allocatedDuration
          );
        });
      } else if (entry.projectId) {
        // Simple entry with direct project assignment
        processEntry(
          entry.projectId,
          entry.project?.name || "No Project",
          entry.project?.abbreviation || null,
          entry.wbsId,
          entry.wbs?.name || "No WBS",
          entry.duration || 0
        );
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
      routineTasks,
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
