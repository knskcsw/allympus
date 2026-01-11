import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, subDays, isAfter } from "date-fns";

const DEFAULT_ROUTINE_TITLES = [
  "今日の社内ニュースを見る",
  "昨日の稼働実績を入力",
  "Outlookに出社形態を入力",
  "eTime入力",
  "eSchool確認",
];

function buildClockInDate(date: Date, time: string): Date | null {
  const [hours, minutes] = time.split(":").map((value) => Number(value));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const clockInDate = new Date(date);
  clockInDate.setHours(hours, minutes, 0, 0);
  return clockInDate;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, clockIn, workMode, sleepHours } = body;

    if (!date || !clockIn || !workMode) {
      return NextResponse.json(
        { error: "date, clockIn, and workMode are required" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const today = startOfDay(new Date());
    const dayStart = startOfDay(parsedDate);
    const dayEnd = endOfDay(parsedDate);

    if (isAfter(dayStart, today)) {
      return NextResponse.json(
        { error: "Future date is not allowed" },
        { status: 400 }
      );
    }

    const clockInDate = buildClockInDate(dayStart, clockIn);
    if (!clockInDate) {
      return NextResponse.json({ error: "Invalid clockIn" }, { status: 400 });
    }

    if (sleepHours === "" || sleepHours === null || sleepHours === undefined) {
      return NextResponse.json(
        { error: "sleepHours is required" },
        { status: 400 }
      );
    }

    const numericSleepHours = Number(sleepHours);

    if (Number.isNaN(numericSleepHours)) {
      return NextResponse.json({ error: "Invalid sleepHours" }, { status: 400 });
    }

    let attendance = await prisma.attendance.findFirst({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (attendance?.clockIn) {
      return NextResponse.json(
        { error: "Already checked in" },
        { status: 400 }
      );
    }

    if (attendance) {
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          clockIn: clockInDate,
          workMode,
          sleepHours: numericSleepHours,
        },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          date: dayStart,
          clockIn: clockInDate,
          workMode,
          sleepHours: numericSleepHours,
        },
      });
    }

    const yesterday = subDays(dayStart, 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    const [todayTasks, previousTasks] = await Promise.all([
      prisma.dailyTask.findMany({
        where: {
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      }),
      prisma.dailyTask.findMany({
        where: {
          date: {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (todayTasks.length === 0 && previousTasks.length > 0) {
      await prisma.dailyTask.createMany({
        data: previousTasks.map((task) => ({
          date: dayStart,
          title: task.title,
          description: task.description,
          status: "TODO",
          priority: task.priority,
          estimatedMinutes: task.estimatedMinutes,
        })),
      });
    }

    const todayRoutine = await prisma.morningRoutineItem.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (todayRoutine.length === 0) {
      const previousRoutine = await prisma.morningRoutineItem.findMany({
        where: {
          date: {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      const routineTitles =
        previousRoutine.length > 0
          ? previousRoutine.map((item) => item.title)
          : DEFAULT_ROUTINE_TITLES;

      await prisma.morningRoutineItem.createMany({
        data: routineTitles.map((title, index) => ({
          date: dayStart,
          title,
          completed: false,
          sortOrder: index,
        })),
      });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Failed to check in:", error);
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    );
  }
}
