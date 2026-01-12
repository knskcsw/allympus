import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isWeekend,
  startOfMonth,
} from "date-fns";
import { WORK_TYPES, type WorkType } from "@/lib/workTypes";

type DailySeries = Record<string, number>;

function getFiscalYear(year: number, month: number) {
  const fiscalYear = month >= 4 ? year : year - 1;
  const suffix = String(fiscalYear % 100).padStart(2, "0");
  return `FY${suffix}`;
}

function buildEmptySeries(days: string[]) {
  return days.reduce<DailySeries>((acc, day) => {
    acc[day] = 0;
    return acc;
  }, {});
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString(),
      10
    );
    const month = parseInt(
      searchParams.get("month") || (new Date().getMonth() + 1).toString(),
      10
    );

    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const days = eachDayOfInterval({ start: startDate, end: endDate }).map(
      (day) => format(day, "yyyy-MM-dd")
    );

    const [projects, timeEntries, fixedTasks, holidays, workHours] =
      await Promise.all([
        prisma.project.findMany({
          orderBy: [{ name: "asc" }],
        }),
        prisma.timeEntry.findMany({
          where: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
            projectId: {
              not: null,
            },
            endTime: {
              not: null,
            },
          },
          orderBy: {
            startTime: "asc",
          },
        }),
        prisma.evmFixedTask.findMany({
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            date: "asc",
          },
        }),
        prisma.holiday.findMany({
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        prisma.projectWorkHours.findMany({
          where: {
            fiscalYear: getFiscalYear(year, month),
            month,
          },
        }),
      ]);

    const holidaySet = new Set(
      holidays.map((holiday) => format(holiday.date, "yyyy-MM-dd"))
    );
    const workingDays = days.filter((day) => {
      const date = new Date(day);
      return !isWeekend(date) && !holidaySet.has(day);
    });
    const workingDaySet = new Set(workingDays);
    const workingDayCount = Math.max(workingDays.length, 0);

    const workHoursByProject = workHours.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.projectId] = item.estimatedHours;
        return acc;
      },
      {}
    );

    const fixedTaskByProject: Record<string, DailySeries> = {};
    const actualByProject: Record<string, DailySeries> = {};

    for (const project of projects) {
      fixedTaskByProject[project.id] = buildEmptySeries(days);
      actualByProject[project.id] = buildEmptySeries(days);
    }

    for (const task of fixedTasks) {
      if (!fixedTaskByProject[task.projectId]) continue;
      const taskDay = format(task.date, "yyyy-MM-dd");
      fixedTaskByProject[task.projectId][taskDay] += task.estimatedMinutes / 60;
    }

    for (const entry of timeEntries) {
      if (!entry.projectId) continue;
      const dayKey = format(entry.startTime, "yyyy-MM-dd");
      if (actualByProject[entry.projectId]) {
        actualByProject[entry.projectId][dayKey] += (entry.duration || 0) / 3600;
      }
    }

    const totalsByType: Record<
      WorkType,
      { pvDaily: number[]; acDaily: number[]; bacTotal: number }
    > = {
      IN_PROGRESS: { pvDaily: Array(days.length).fill(0), acDaily: Array(days.length).fill(0), bacTotal: 0 },
      SE_TRANSFER: { pvDaily: Array(days.length).fill(0), acDaily: Array(days.length).fill(0), bacTotal: 0 },
      INDIRECT: { pvDaily: Array(days.length).fill(0), acDaily: Array(days.length).fill(0), bacTotal: 0 },
    };

    for (const project of projects) {
      const acSeries = days.map((day) => actualByProject[project.id][day] || 0);
      const fixedSeries = days.map(
        (day) => fixedTaskByProject[project.id][day] || 0
      );
      const fixedTotal = fixedSeries.reduce((acc, value) => acc + value, 0);
      const estimatedHours = workHoursByProject[project.id] || 0;
      const remaining = Math.max(estimatedHours - fixedTotal, 0);
      const dailyAllocation =
        workingDayCount > 0 ? remaining / workingDayCount : 0;
      const pvSeries = days.map((day, index) => {
        const base = fixedSeries[index];
        if (!workingDaySet.has(day)) {
          return base;
        }
        return base + dailyAllocation;
      });

      const workType = (project.workType as WorkType) || "IN_PROGRESS";
      const totals = totalsByType[workType] || totalsByType.IN_PROGRESS;
      pvSeries.forEach((value, index) => {
        totals.pvDaily[index] += value;
      });
      acSeries.forEach((value, index) => {
        totals.acDaily[index] += value;
      });
      totals.bacTotal += estimatedHours;
    }

    return NextResponse.json({
      period: { start: startDate, end: endDate },
      days,
      types: WORK_TYPES.map((type) => ({
        workType: type.value,
        label: type.label,
        pvDaily: totalsByType[type.value as WorkType].pvDaily,
        acDaily: totalsByType[type.value as WorkType].acDaily,
        bacTotal: totalsByType[type.value as WorkType].bacTotal,
      })),
    });
  } catch (error) {
    console.error("Failed to load work type report data:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load work type report data";
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Failed to load work type report data"
            : message,
      },
      { status: 500 }
    );
  }
}
