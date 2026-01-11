import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";

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

  const days = eachDayOfInterval({ start: startDate, end: endDate }).map((day) =>
    format(day, "yyyy-MM-dd")
  );

  const [projects, timeEntries, holidays, workHours] = await Promise.all([
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
      include: {
        dailyTask: true,
      },
      orderBy: {
        startTime: "asc",
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
  const workingDayCount = Math.max(days.length - holidaySet.size, 0);

  const workHoursByProject = workHours.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.projectId] = item.estimatedHours;
      return acc;
    },
    {}
  );

  const fixedTaskByProject: Record<string, DailySeries> = {};
  const actualByProject: Record<string, DailySeries> = {};
  const fixedTaskSeen = new Set<string>();

  for (const project of projects) {
    fixedTaskByProject[project.id] = buildEmptySeries(days);
    actualByProject[project.id] = buildEmptySeries(days);
  }

  for (const entry of timeEntries) {
    if (!entry.projectId) continue;
    const dayKey = format(entry.startTime, "yyyy-MM-dd");
    if (actualByProject[entry.projectId]) {
      actualByProject[entry.projectId][dayKey] += (entry.duration || 0) / 3600;
    }

    if (!entry.dailyTask || !entry.dailyTask.estimatedMinutes) continue;
    const taskDay = format(entry.dailyTask.date, "yyyy-MM-dd");
    const fixedKey = `${entry.dailyTask.id}:${entry.projectId}`;
    if (fixedTaskSeen.has(fixedKey)) continue;
    fixedTaskSeen.add(fixedKey);
    if (fixedTaskByProject[entry.projectId]) {
      fixedTaskByProject[entry.projectId][taskDay] +=
        entry.dailyTask.estimatedMinutes / 60;
    }
  }

  const projectSeries = projects.map((project) => {
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
      if (holidaySet.has(day)) {
        return base;
      }
      return base + dailyAllocation;
    });

    return {
      projectId: project.id,
      projectName: project.name,
      acSeries,
      pvSeries,
      totals: {
        acHours: acSeries.reduce((acc, value) => acc + value, 0),
        pvHours: pvSeries.reduce((acc, value) => acc + value, 0),
        fixedHours: fixedTotal,
        estimatedHours,
      },
    };
  });

  return NextResponse.json({
    period: { start: startDate, end: endDate },
    days,
    projects: projectSeries,
  });
}
